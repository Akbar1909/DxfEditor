/* eslint-disable no-param-reassign */
import { Point2D } from 'dxf/Common';
import {
    LAYER_WITH_STANDS_PREFIX,
    LAYER_WITH_STAND_IDS_PREFIX,
    LAYER_WITH_STAND_NAMES_PREFIX,
    LAYER_WITH_WALLS_PREFIX,
    UNIQUE_ENTITY_KEY,
    DXF_EDITOR_SIZES,
    DXF_EDITOR_COLORS,
    LAYERS_WITH_STANDS,
} from 'store/dxfEditor';
import { Context } from 'konva/lib/Context';
import memoize from './memoize';
import {
    DxfEditorStateType,
    EntityModel,
    ITextEntity,
    IHatchEntity,
    IPolylineEntity,
    IArcEntity,
    ILineEntity,
    ICircleEntity,
    IEllipseEntity,
    ISolidEntity,
    EntityTypeEnum,
    StandType,
} from '../dxfEditor.types';

export type WrapperTypes = {
    wrapperLeftBottom: Point2D;
    wrapperTopRight: Point2D;
    wrapperLeftBottomScaled: Point2D;
    wrapperTopRightScaled: Point2D;
};

const aliasLayerName = (layerName: string) => layerName.replace(/stand id/gi, LAYERS_WITH_STANDS);
/**
 * Represents the wrapper types for a bounding box.
 * @typedef {Object} WrapperTypes
 * @property {Point2D} wrapperLeftBottom - The coordinates of the bottom-left corner of the wrapper.
 * @property {Point2D} wrapperTopRight - The coordinates of the top-right corner of the wrapper.
 * @property {Point2D} wrapperLeftBottomScaled - The scaled coordinates of the bottom-left
 * corner of the wrapper.
 * @property {Point2D} wrapperTopRightScaled - The scaled coordinates of the top-right
 * corner of the wrapper.
 */

/**
 * Represents a 2D point.
 * @typedef {Object} Point2D
 * @property {number} x - The x-coordinate of the point.
 * @property {number} y - The y-coordinate of the point.
 */

/**
 * Prepares an entity by applying common parameters and transformations based on its type.
 *
 * @param {Object} options - The options for preparing the entity.
 * @param {EntityModel} options.entity - The entity to prepare.
 * @param {DxfEditorStateType['tables']['ltypes']} options.ltypes -
 * The line types table used for line type lookup.
 * @param {DxfEditorStateType['tables']['styles']} options.styles -
 *  The styles table used for entity style lookup.
 * @returns {EntityModel} The prepared entity.
 */
const prepareEntity = ({
    entity,
    ltypes,
    styles,
}: {
    entity: EntityModel;
    ltypes: DxfEditorStateType['tables']['ltypes'];
    styles: DxfEditorStateType['tables']['styles'];
}): EntityModel => {
    const commonParams = {
        ...('lineTypeName' in entity &&
            ltypes && { lineStyle: ltypes[entity.lineTypeName as string] }),
        ...('styleName' in entity && styles && { entityStyle: styles[entity.styleName as string] }),
    };

    switch (entity.type) {
        case EntityTypeEnum.MTEXT:
        case EntityTypeEnum.TEXT:
            return {
                ...entity,
                string: parseSpecialChars(entity.string),
                x: entity.xAxisX ?? entity.x,
                y: entity.xAxisY ?? entity.y,
                textHeight: entity.nominalTextHeight || entity.textHeight,
                width: entity.horizontalWidth || entity.width,
                ...commonParams,
                scaleX: entity.scaleX ?? 1,
                scaleY: entity.scaleY ?? 1,
            };
        case EntityTypeEnum.POLYLINE:
            return {
                ...entity,
                ...commonParams,
                scaleX: entity.scaleX ?? 1,
                scaleY: entity.scaleY ?? 1,
            };
        case EntityTypeEnum.LWPOLYLINE:
            return {
                ...entity,
                type: EntityTypeEnum.POLYLINE,
                ...commonParams,
                scaleX: entity.scaleX ?? 1,
                scaleY: entity.scaleY ?? 1,
            };
        default:
            return {
                ...entity,
                ...commonParams,
                scaleX: entity.scaleX ?? 1,
                scaleY: entity.scaleY ?? 1,
            };
    }
};

/**
 * Scales a 2D point using the provided scaling factors and reference points.
 *
 * @param {Point2D} point - The 2D point to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {number} scaleX - The scaling factor for the x-coordinate. Defaults to 1 if not provided.
 * @param {number} scaleY - The scaling factor for the y-coordinate. Defaults to 1 if not provided.
 * @returns {Point2D} The scaled 2D point.
 */
const scalePoint2D = (
    point: Point2D,
    args: WrapperTypes,
    { scaleX, scaleY }: { scaleX: number; scaleY: number },
) => ({
    x: (point.x - args.wrapperLeftBottom.x) * (scaleX || 1) + args.wrapperLeftBottomScaled.x,
    y: args.wrapperTopRightScaled.y - (point.y - args.wrapperLeftBottom.y) * (scaleY || 1),
});

/**
 * Calculates the scaling factors for the x and y coordinates based on
 *  the provided wrapper and reference points.
 *
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @returns {Object} An object containing the scaling factors for the x and y coordinates.
 * @property {number} scaleX - The scaling factor for the x-coordinate.
 * @property {number} scaleY - The scaling factor for the y-coordinate.
 */
const getScaleXY = (args: WrapperTypes) => {
    const { wrapperLeftBottom, wrapperTopRight, wrapperLeftBottomScaled, wrapperTopRightScaled } =
        args;

    const scaleX =
        // eslint-disable-next-line operator-linebreak
        (wrapperTopRightScaled.x - wrapperLeftBottomScaled.x) /
        (wrapperTopRight.x - wrapperLeftBottom.x);

    const scaleY =
        // eslint-disable-next-line operator-linebreak
        (wrapperTopRightScaled.y - wrapperLeftBottomScaled.y) /
        (wrapperTopRight.y - wrapperLeftBottom.y);

    return {
        scaleX,
        scaleY,
    };
};

const memoizedGetScaleXY = memoize(getScaleXY);

/**
 * Scales a text entity and adjusts its position based on
 * the provided scaling wrapper and stage options.
 *
 * @param {ITextEntity} entity - The text entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 * The stage options for adjusting the position.
 * @returns {ITextEntity} The scaled text entity.
 */
const scaleTextEntity = (
    entity: ITextEntity,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
) => {
    const { scale } = stageOptions;
    const { scaleX, scaleY } = memoizedGetScaleXY(args);
    const { x, y } = scalePoint2D({ x: entity.x, y: entity.y }, args, { scaleX, scaleY });

    return {
        ...entity,
        x: dxfRounder((x - stageOptions.x) / scale),
        y: dxfRounder((y - stageOptions.y) / scale),
        z: 0,
        // width: dxfRounder((entity.width || 1) * scale),
    };
};

/**
 * Scales a solid entity and adjusts its corner positions based on
 *  the provided scaling wrapper and stage options.
 *
 * @param {ISolidEntity} entity - The solid entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 * The stage options for adjusting the positions.
 * @returns {ISolidEntity} The scaled solid entity.
 */
const scaleSolidEntity = (
    entity: ISolidEntity,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
) => {
    const { scaleX, scaleY } = memoizedGetScaleXY(args);

    entity.corners.forEach((corner, i) => {
        const { x, y } = scalePoint2D({ x: corner.x, y: corner.y }, args, { scaleX, scaleY });
        // eslint-disable-next-line no-param-reassign
        entity.corners[i] = {
            ...corner,
            x: dxfRounder((x - stageOptions.x) / stageOptions.scale),
            y: dxfRounder((y - stageOptions.y) / stageOptions.scale),
        };
    });

    return entity;
};

/**
 * Scales a polyline entity and adjusts its vertices and points based on
 * the provided scaling wrapper and stage options.
 *
 * @param {IPolylineEntity} entity - The polyline entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 * The stage options for adjusting the positions.
 * @returns {IPolylineEntity} The scaled polyline entity.
 */
const scalePolylineEntity = (
    entity: IPolylineEntity,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
) => {
    const { scaleX, scaleY } = memoizedGetScaleXY(args);

    if (!Array.isArray(entity.vertices)) {
        return entity;
    }

    entity.vertices.forEach((vertice: any, i: number) => {
        const { x, y } = scalePoint2D({ x: vertice.x, y: vertice.y }, args, { scaleX, scaleY });

        entity.vertices[i] = {
            ...vertice,
            x: dxfRounder((x - stageOptions.x) / stageOptions.scale),
            y: dxfRounder((y - stageOptions.y) / stageOptions.scale),
        };
    });

    entity.points = entity.vertices.reduce(
        (acc, cur: Point2D) => [...acc, [cur.x, cur.y]],
        [] as IPolylineEntity['points'],
    );

    return entity;
};

/**
 * Scales an arc entity and adjusts its position and radius based on
 * the provided scaling wrapper and stage options.
 *
 * @param {IArcEntity} entity - The arc entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 *  The stage options for adjusting the position and radius.
 * @returns {IArcEntity} The scaled arc entity.
 */
const scaleArcEntity = (
    entity: IArcEntity,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
) => {
    const { scale, x, y } = stageOptions;
    const { scaleX, scaleY } = memoizedGetScaleXY(args);

    const { x: arcX, y: arcY } = scalePoint2D({ x: entity.x, y: entity.y }, args, {
        scaleX,
        scaleY,
    });

    return {
        ...entity,
        x: dxfRounder((arcX - x) / scale),
        y: dxfRounder((arcY - y) / scale),
        z: 0,
        r: dxfRounder((entity.r * Math.min(scaleX, scaleY)) / scale),
    };
};

/**
 * Scales a line entity and adjusts its start and end positions based on
 * the provided scaling wrapper and stage options.
 *
 * @param {ILineEntity} entity - The line entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 * The stage options for adjusting the positions.
 * @returns {ILineEntity} The scaled line entity.
 */
const scaleLineEntity = (
    entity: ILineEntity,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
) => {
    const { scale, x, y } = stageOptions;
    const { scaleX, scaleY } = memoizedGetScaleXY(args);

    const start = scalePoint2D({ x: entity.start.x, y: entity.start.y }, args, {
        scaleX,
        scaleY,
    });
    const end = scalePoint2D({ x: entity.end.x, y: entity.end.y }, args, { scaleX, scaleY });

    return {
        ...entity,
        start: {
            x: dxfRounder((start.x - x) / scale),
            y: dxfRounder((start.y - y) / scale),
            z: 0,
        },
        end: {
            x: dxfRounder((end.x - x) / scale),
            y: dxfRounder((end.y - y) / scale),
            z: 0,
        },
    };
};

/**
 * Scales a circle entity and adjusts its position and radius based on
 * the provided scaling wrapper and stage options.
 *
 * @param {ICircleEntity} entity - The circle entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 *  The stage options for adjusting the position and radius.
 * @returns {ICircleEntity} The scaled circle entity.
 */
const scaleCircleEntity = (
    entity: ICircleEntity,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
) => {
    const { scale, ...stageXY } = stageOptions;
    const { scaleX, scaleY } = memoizedGetScaleXY(args);

    const { x, y } = scalePoint2D({ x: entity.x, y: entity.y }, args, { scaleX, scaleY });

    return {
        ...entity,
        x: dxfRounder((x - stageXY.x) / scale),
        y: dxfRounder((y - stageXY.y) / scale),
        r: dxfRounder((entity.r * Math.min(scaleX, scaleY)) / scale),
        z: 0,
    };
};

/**
 * Scales a hatch entity and adjusts the entities within its boundary loops based on
 * the provided scaling wrapper and stage options.
 *
 * @param {IHatchEntity} entity - The hatch entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 * The stage options for adjusting the entities.
 * @returns {IHatchEntity} The scaled hatch entity.
 */
const scaleHatchEntity = (
    entity: IHatchEntity,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
) => {
    const newLoops = entity.boundary.loops.map((loop) => ({
        ...loop,
        entities: loop.entities.map((item) => ({
            ...entity,
            ...scaleEntity(item, args, stageOptions),
        })),
    }));

    // @ts-ignore
    entity.boundary.loops = newLoops;

    return entity;
};

/**
 * Scales an ellipse entity and adjusts its position, major axis, and minor axis based on
 *  the provided scaling wrapper and stage options.
 *
 * @param {IEllipseEntity} entity - The ellipse entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 *  The stage options for adjusting the position and axes.
 * @returns {IEllipseEntity} The scaled ellipse entity.
 */
const scaleEllipseEntity = (
    entity: IEllipseEntity,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
) => {
    const { scale, ...stageXY } = stageOptions;
    const { scaleX, scaleY } = memoizedGetScaleXY(args);

    const { x, y } = scalePoint2D({ x: entity.x, y: entity.y }, args, { scaleX, scaleY });

    return {
        ...entity,
        x: dxfRounder((x - stageXY.x) / scale),
        y: dxfRounder((y - stageXY.y) / scale),
        majorX: dxfRounder(entity.majorX / scale),
        majorY: dxfRounder(entity.majorY / scale),
    };
};

/**
 * Moves the coordinates of an entity by adding the provided x and y offsets.
 *
 * @param {EntityModel} entity - The entity to move the coordinates of.
 * @param {Point2D} offset - The x and y offsets to add to the coordinates.
 * @returns {EntityModel} The entity with moved coordinates.
 */
const movePoint = (entity: EntityModel, { x, y }: Point2D) => {
    switch (entity.type) {
        case EntityTypeEnum.POLYLINE:
        case EntityTypeEnum.LWPOLYLINE:
            return {
                ...entity,
                vertices: entity.vertices.map((vertice) => ({
                    x: dxfRounder(vertice.x + x),
                    y: dxfRounder(vertice.y + y),
                    z: 0,
                })),
            };
        case EntityTypeEnum.CIRCLE:
            return {
                ...entity,
                x: dxfRounder(entity.x + x),
                y: dxfRounder(entity.y + y),
            };
        default:
            return entity;
    }
};

/**
 * Scales an entity based on its type using the provided scaling wrapper and stage options.
 *
 * @param {EntityModel} entity - The entity to scale.
 * @param {WrapperTypes} args - The scaling wrapper and reference points.
 * @param {DxfEditorStateType['stageOptions']} stageOptions -
 * The stage options for scaling and positioning.
 * @returns {EntityModel} The scaled entity.
 */
const scaleEntity = (
    entity: EntityModel,
    args: WrapperTypes,
    stageOptions: DxfEditorStateType['stageOptions'],
): EntityModel => {
    switch (entity.type) {
        case EntityTypeEnum.POLYLINE:
        case EntityTypeEnum.LWPOLYLINE:
            // @ts-ignore
            return scalePolylineEntity(entity, args, stageOptions);
        case EntityTypeEnum.LINE:
            return scaleLineEntity(entity, args, stageOptions);
        case EntityTypeEnum.MTEXT:
        case EntityTypeEnum.TEXT:
            return scaleTextEntity(entity, args, stageOptions);
        case EntityTypeEnum.ARC:
            return scaleArcEntity(entity, args, stageOptions);
        case EntityTypeEnum.CIRCLE:
            return scaleCircleEntity(entity, args, stageOptions);
        case EntityTypeEnum.HATCH:
            return scaleHatchEntity(entity, args, stageOptions);
        case EntityTypeEnum.ELLIPSE:
            return scaleEllipseEntity(entity, args, stageOptions);
        case EntityTypeEnum.SOLID:
            return scaleSolidEntity(entity, args, stageOptions);
        case EntityTypeEnum.INSERT:
            return {
                ...entity,
                blockData: {
                    ...entity.blockData,
                    entities: entity.blockData?.entities
                        .map((blockEntity) => movePoint(blockEntity, { x: entity.x, y: entity.y }))
                        .map((blockEntity) => scaleEntity(blockEntity, args, stageOptions)),
                },
            };
        default:
            return entity;
    }
};

/**
 * Converts an array of entities into a key-value object
 * where the keys are the entity handles and the values are the entities.
 *
 * @param {EntityModel[]} entities - The array of entities.
 * @returns {Object} The key-value object with entity handles as keys and entities as values.
 */
const makeEntitiesKeyValue = (entities: EntityModel[]) =>
    entities.reduce(
        (acc, cur) => ({
            ...acc,
            [cur.handle]: cur,
        }),
        {},
    );

/**
 * Creates layers based on the entities and layer options.
 *
 * @param {Object} entities - The entities keyed by their unique entity key.
 * @param {Object} layersOptions - The layer options.
 * @returns {Object} The created layers.
 */
const makeLayers = (entities: Record<string, EntityModel>, layersOptions: any) =>
    Object.values(entities).reduce(
        (acc, current) => ({
            ...acc,
            [current.layer]: {
                entities: {
                    // @ts-ignore
                    ...(acc[current.layer]?.entities || {}),
                    [current[UNIQUE_ENTITY_KEY]]: current,
                },
                selected: false,
                options: {
                    name: current.layer || 'Default LayerName',
                    displayName: aliasLayerName(current.layer),
                },
                deleted: false,
                expanded: checkStandLayer(current.layer, 'stand-id'),
                // @ts-ignore
                visible: layersOptions[current.layer]?.colorNumber > 0,
                standNameEntities: {},
            },
        }),
        {},
    );

const getEntities = (entities: Array<EntityModel>) =>
    // @ts-ignore
    entities.reduce((acc, cur) => ({ ...acc, [cur.type]: [...(acc[cur.type] || []), cur] }), {});

/**
 * Renders a wrapper inside a container based on the provided dimensions and wrapper coordinates.
 *
 * @param {Point2D} wrapperLeftBottom - The bottom-left coordinate of the wrapper.
 * @param {Point2D} wrapperTopRight - The top-right coordinate of the wrapper.
 * @param {number} width - The width of the container.
 * @param {number} height - The height of the container.
 * @returns {Object} The scaled and positioned coordinates of the wrapper inside the container.
 */
function renderWrapperInsideContainer(
    wrapperLeftBottom: Point2D,
    wrapperTopRight: Point2D,
    width: number,
    height: number,
) {
    const wrapperWidth = wrapperTopRight.x - wrapperLeftBottom.x;
    const wrapperHeight = wrapperTopRight.y - wrapperLeftBottom.y;
    const widthScale = width / wrapperWidth;
    const heightScale = height / wrapperHeight;
    const scale = Math.min(widthScale, heightScale);
    const wrapperWidthScaled = wrapperWidth * scale;
    const wrapperHeightScaled = wrapperHeight * scale;
    const wrapperLeftBottomScaled = {
        x: (width - wrapperWidthScaled) / 2,
        y: (height - wrapperHeightScaled) / 2,
    };
    const wrapperTopRightScaled = {
        x: wrapperLeftBottomScaled.x + wrapperWidthScaled,
        y: wrapperLeftBottomScaled.y + wrapperHeightScaled,
    };
    return { wrapperLeftBottomScaled, wrapperTopRightScaled };
}

/**
 * Converts an array of points to an array of {x, y} coordinate objects.
 *
 * @param {number[]} points - The array of points.
 * @returns {Object[]} The array of {x, y} coordinate objects.
 */
const convertPointsToXY = (points: number[]) => {
    const coords = [];

    for (let i = 0; i < points.length; i += 2) {
        coords.push({ x: points[i], y: points[i + 1] });
    }

    return coords;
};

const memoizedConvertPointsToXY = memoize(convertPointsToXY);

/**
 * Checks if an entity belongs to a valid stand layer.
 *
 * @param {EntityModel} entity - The entity to check.
 * @returns {boolean} `true` if the entity belongs to a valid stand layer, `false` otherwise.
 */
const isValidStand = (entity: EntityModel) =>
    checkStandLayer(entity.layer, 'stand-shape') &&
    [EntityTypeEnum.POLYLINE, EntityTypeEnum.LWPOLYLINE].includes(entity.type);

/**
 * Checks if an entity does not belong to a valid stand layer.
 *
 * @param {EntityModel} entity - The entity to check.
 * @returns {boolean} `true` if the entity does not belong
 * to a valid stand layer, `false` otherwise.
 */
const isInvalidStand = (entity: EntityModel) => !isValidStand(entity);

/**
 * Filters out invalid stand entities from an array of entities.
 *
 * @param {EntityModel[]} entities - The array of entities to filter.
 * @returns {EntityModel[]} The array of valid stand entities.
 */
const filterValidStands = (entities: EntityModel[]) => entities.map(isValidStand) || [];

// ==== Draw entities on native html5 canvas without external libraries

const calculatePattern = (patterns: Array<{ length: number }>) =>
    Array.isArray(patterns)
        ? patterns.map((pattern) => {
              const positivePattern = Math.abs(pattern.length);

              if (positivePattern < 1) {
                  return positivePattern * 10;
              }

              return positivePattern;
          })
        : [];

/**
 * Draws a line entity on the canvas context.
 *
 * @param {Context} ctx - The canvas context to draw on.
 * @param {ILineEntity} entity - The line entity to draw.
 * @returns {void}
 */
const drawLine = (ctx: Context, entity: ILineEntity) => {
    ctx.beginPath();

    ctx.setLineDash(calculatePattern(entity?.lineStyle?.pattern));

    ctx.moveTo(entity.start.x, entity.start.y);
    ctx.lineTo(entity.end.x, entity.end.y);
    ctx.closePath();
    ctx.strokeStyle = DXF_EDITOR_COLORS.UNSUPPORTED_ELEMENT_FILL;
    ctx.lineWidth = DXF_EDITOR_SIZES.STROKE_WIDTH;
    ctx.scale(entity.scaleX, entity.scaleY);
    ctx.stroke();
};

/**
 * Draws a polygon entity (polyline) on the canvas context.
 *
 * @param {Context} ctx - The canvas context to draw on.
 * @param {IPolylineEntity} entity - The polyline entity to draw.
 * @returns {void}
 */
const drawPolygon = (ctx: Context, entity: IPolylineEntity) => {
    const {
        points: [startPoint, ...rest],
    } = entity;
    ctx.beginPath();

    ctx.moveTo(startPoint[0], startPoint[1]);

    rest.forEach((point) => {
        ctx.lineTo(point[0], point[1]);
    });

    ctx.closePath();
    ctx.strokeStyle = DXF_EDITOR_COLORS.UNSUPPORTED_ELEMENT_FILL;
    // ctx.fillStyle = DXF_EDITOR_COLORS.STAND_WITH_ID_FILL;
    ctx.lineWidth = DXF_EDITOR_SIZES.STROKE_WIDTH;
    ctx.scale(entity.scaleX, entity.scaleY);
    ctx.stroke();
    // ctx.fill();
};

/**
 * Draws a circle entity on the canvas context.
 *
 * @param {Context} ctx - The canvas context to draw on.
 * @param {ICircleEntity} entity - The circle entity to draw.
 * @returns {void}
 */
const drawCircle = (ctx: Context, entity: ICircleEntity) => {
    if (entity.r <= 0) {
        return;
    }

    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.r, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.strokeStyle = DXF_EDITOR_COLORS.UNSUPPORTED_ELEMENT_FILL;
    ctx.lineWidth = DXF_EDITOR_SIZES.STROKE_WIDTH;
    // ctx.fillStyle = DXF_EDITOR_COLORS.STAND_WITH_ID_FILL;
    // ctx.fill();
    ctx.scale(entity.scaleX, entity.scaleY);
    ctx.stroke();
};

/**
 * Draws an arc entity on the canvas context.
 *
 * @param {Context} ctx - The canvas context to draw on.
 * @param {IArcEntity} entity - The arc entity to draw.
 * @returns {void}
 */

const drawArc = (ctx: Context, entity: IArcEntity) => {
    const startAngle = entity.startAngle % (2 * Math.PI);
    const endAngle = entity.endAngle % (2 * Math.PI);

    ctx.beginPath();
    ctx.arc(entity.x, entity.y, Math.abs(entity.r), -endAngle, -startAngle);
    ctx.strokeStyle = DXF_EDITOR_COLORS.UNSUPPORTED_ELEMENT_FILL;
    ctx.lineWidth = DXF_EDITOR_SIZES.STROKE_WIDTH;

    ctx.scale(entity.scaleX, entity.scaleY);
    ctx.stroke();
};

/**
 * Draws a solid entity on the canvas context.
 *
 * @param {Context} ctx - The canvas context to draw on.
 * @param {ISolidEntity} entity - The solid entity to draw.
 * @returns {void}
 */
const drawSolid = (ctx: Context, entity: ISolidEntity) => {
    ctx.beginPath();
    ctx.moveTo(entity.corners[0].x, entity.corners[0].y);
    for (let i = 1; i < entity.corners.length; i++) {
        ctx.lineTo(entity.corners[i].x, entity.corners[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = DXF_EDITOR_COLORS.UNSUPPORTED_ELEMENT_FILL;
    ctx.lineWidth = DXF_EDITOR_SIZES.STROKE_WIDTH;
    ctx.scale(entity.scaleX, entity.scaleY);
    ctx.stroke();
};

/**
 * Draws an entity on the native canvas context based on its entity type.
 *
 * @param {Context} ctx - The native canvas context to draw on.
 * @param {EntityModel} entity - The entity to draw.
 * @returns {void}
 */
const drawEntityOnNativeCanvas = (ctx: Context, entity: EntityModel): void => {
    switch (entity.type) {
        case EntityTypeEnum.LINE:
            drawLine(ctx, entity);
            break;
        case EntityTypeEnum.CIRCLE:
            drawCircle(ctx, entity);
            break;
        case EntityTypeEnum.ARC:
            drawArc(ctx, entity);
            break;
        case EntityTypeEnum.POLYLINE:
            drawPolygon(ctx, entity);
            break;
        case EntityTypeEnum.SOLID:
            // TODO: need to research.
            drawSolid(ctx, entity);
            break;
        case EntityTypeEnum.INSERT:
            if (!Array.isArray(entity.blockData?.entities)) {
                return;
            }
            entity.blockData?.entities.forEach((insertEntity) => {
                if (insertEntity.type !== EntityTypeEnum.POLYLINE) {
                    drawEntityOnNativeCanvas(ctx, insertEntity);
                }
            });
            break;
        default:
            break;
    }
};

/**
 * Checks if a point is inside a polygon defined by its corners.
 *
 * @param {number[]} point - The point coordinates as [x, y].
 * @param {number[][]} standCorners - The polygon corners as an array of [x, y] coordinates.
 * @returns {boolean} - `true` if the point is inside the polygon, `false` otherwise.
 */
const pointInsidePolygon = (point: [number, number], corners: Array<[number, number]>) => {
    let inside = false;

    if (!Array.isArray(corners)) {
        return false;
    }

    for (let i = 0, j = corners.length - 1; i < corners.length; j = i, i += 1) {
        const xi = corners[i][0];
        const yi = corners[i][1];
        const xj = corners[j][0];
        const yj = corners[j][1];

        const intersect =
            yi > point[1] !== yj > point[1] &&
            point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
};

/**
 * Attaches stand names to corresponding stands based on the positioning of text entities.
 *
 * @param {IPolylineEntity[]} stands - The array of stands.
 * @param {ITextEntity[]} texts - The array of text entities.
 * @returns {Object} - An object containing
 *  the updated text entities and stands.
 */
const attachStandNameToStand = (stands: StandType[], texts: ITextEntity[]) => {
    const textEntities = [...texts];

    for (const stand of stands) {
        for (const text of textEntities) {
            if (pointInsidePolygon([text.x, text.y], stand.points)) {
                stand.text = text;
                text.stand = stand.handle;
            }
        }
    }

    return {
        textEntities,
        stands,
    };
};

/**
 * Rounds a number to three decimal places.
 *
 * @param {number} x - The number to round.
 * @returns {number} - The rounded number.
 */
function dxfRounder(x: number) {
    return Number(x.toFixed(3));
}

/**
 * Checks if a layer name belongs to a specific category based on the given mode.
 *
 * @param {string} layerName - The layer name to check.
 * @param {'wall' | 'stand-id' | 'stand-name' | 'stand-shape'} mode -
 * The category mode to check against.
 * @returns {boolean} - `true` if the layer belongs to the specified category, `false` otherwise.
 */
function checkStandLayer(
    layerName: string,
    mode: 'wall' | 'stand-id' | 'stand-name' | 'stand-shape',
) {
    const categories: Record<'wall' | 'stand-id' | 'stand-name' | 'stand-shape', string> = {
        wall: LAYER_WITH_WALLS_PREFIX,
        'stand-id': LAYER_WITH_STAND_IDS_PREFIX,
        'stand-shape': LAYER_WITH_STANDS_PREFIX,
        'stand-name': LAYER_WITH_STAND_NAMES_PREFIX,
    };

    return (layerName || '').toLowerCase().startsWith(categories[mode]);
}

/** Regex for parsing special characters in text entities. */
const SPECIAL_CHARS_RE = /(?:%%([dpcou%]))|(?:\\U\+([0-9a-fA-F]{4}))/g;

/**
 * Parse special characters in text entities and convert them to corresponding unicode
 * characters.
 * https://knowledge.autodesk.com/support/autocad/learn-explore/caas/CloudHelp/cloudhelp/2019/ENU/AutoCAD-Core/files/GUID-518E1A9D-398C-4A8A-AC32-2D85590CDBE1-htm.html
 * @param {string} text Raw string.
 * @return {string} String with special characters replaced.
 */
function parseSpecialChars(text: string) {
    return text.replaceAll(SPECIAL_CHARS_RE, (match, p1, p2) => {
        if (p1 !== undefined) {
            switch (p1) {
                case 'd':
                    return '\xb0';
                case 'p':
                    return '\xb1';
                case 'c':
                    return '\u2205';
                case 'o':
                    /* Toggles overscore mode on and off, not implemented. */
                    return '';
                case 'u':
                    /* Toggles underscore mode on and off, not implemented. */
                    return '';
                case '%':
                    return '%';
            }
        } else if (p2 !== undefined) {
            const code = parseInt(p2, 16);
            if (isNaN(code)) {
                return match;
            }
            return String.fromCharCode(code);
        }
        return match;
    });
}

export {
    getEntities,
    makeLayers,
    renderWrapperInsideContainer,
    scaleEntity,
    makeEntitiesKeyValue,
    convertPointsToXY,
    memoizedConvertPointsToXY,
    memoizedGetScaleXY,
    scalePoint2D,
    filterValidStands,
    prepareEntity,
    isValidStand,
    isInvalidStand,
    drawCircle,
    drawLine,
    drawArc,
    drawSolid,
    drawEntityOnNativeCanvas,
    attachStandNameToStand,
    dxfRounder,
    checkStandLayer,
    parseSpecialChars,
    aliasLayerName,
};
