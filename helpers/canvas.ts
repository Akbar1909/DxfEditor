import Konva from 'konva';
import { DXF_EDITOR_COLORS, LAYER_WITH_STANDS_PREFIX } from 'store/dxfEditor';
import { EntityTypeEnum, IPolylineEntity } from '../dxfEditor.types';
import { createDeleteFieldName, createSelectFieldName, createVisibilityFieldName } from './form';
import dxfEditorCache from './cache';

const getMainLayer = (stage: Konva.Stage | null) => {
    if (!stage) {
        return null;
    }

    if (dxfEditorCache.has('dxfEditor-main-layer')) {
        return dxfEditorCache.getEntity<Konva.Layer>('dxfEditor-main-layer');
    }

    const mainLayer = stage.findOne('#dxfEditor-main-layer') as unknown as Konva.Layer;

    dxfEditorCache.setEntity<Konva.Layer>('dxfEditor-main-layer', mainLayer);

    return mainLayer;
};

/**
 * Creates an entity ID based on the provided handle.
 *
 * @param {string} handle - The handle to be used for creating the entity ID.
 * @returns {string} The generated entity ID in the format 'stand-{handle}'.
 */
const createEntityId = (handle: string) => `stand-${handle}`;

/**
 * Checks if the provided ID belongs to an entity.
 *
 * @param {string} [id=''] - The ID to be checked. Defaults to an empty string if not provided.
 * @returns {boolean} Returns true if the ID starts with 'stand',
 * indicating it belongs to an entity. Otherwise, returns false.
 */
const isEntity = (id = '') => id.startsWith('stand');

/**
 * Creates a layer ID based on the provided layer name.
 *
 * @param {string} layerName - The layer name to be used for creating the layer ID.
 * @returns {string} The generated layer ID in the format 'dxfLayer-{layerName}'.
 */
const createLayerId = (layerName: string) => `dxfLayer-${layerName}`;

/**
 * Checks if the provided ID belongs to a layer.
 *
 * @param {string} id - The ID to be checked.
 * @returns {boolean} Returns true if the ID starts with 'dxfLayer',
 * indicating it belongs to a layer. Otherwise, returns false.
 */
const isLayer = (id: string) => id.startsWith('dxfLayer');

/**
 * Retrieves the transformed points of a Konva.Line entity.
 *
 * @param {Konva.Line} entity - The Konva.Line entity for which to retrieve the transformed points.
 * @returns {Array<[number, number]>} An array of transformed points in the format [x, y].
 */
const getTransformedPoints = (entity: Konva.Line) => {
    const points = entity.points();

    const formattedPoints: Array<[number, number]> = [];

    const chunkSize = 2;
    for (let i = 0; i < points.length; i += chunkSize) {
        const chunk = points.slice(i, i + chunkSize) as [number, number];
        formattedPoints.push(chunk);
    }

    const transformedPoints: Array<[number, number]> = [];
    formattedPoints.forEach((point: [number, number]) => {
        const newPoint = entity.getTransform().point({ x: point[0], y: point[1] });

        transformedPoints.push([newPoint.x, newPoint.y]);
    });

    return transformedPoints;
};

/**
 * Retrieves the stands
 *
 * @param {Konva.Stage | Konva.Group} node - The Konva.Stage or Konva.Group node from
 *  which to retrieve the stands.
 * @returns {Array<IPolylineEntity>} An array of stands outside of the stage,
 * represented as IPolylineEntity objects.
 */
const getStandsOutOfStage = (node: Konva.Stage | Konva.Group) => {
    const stands: Array<IPolylineEntity> = [];

    const { children } = node;

    if (!Array.isArray(children)) {
        return stands;
    }

    children?.forEach((entity: any) => {
        if (entity.children) {
            stands.push(...getStandsOutOfStage(entity));
        }

        const isStand = isEntity(entity.attrs.id);

        if (isStand) {
            const { layer, name, visible } = entity.getAttrs();

            stands.push({
                hideStand: !visible,
                layer,
                ...entity.attrs,
                handle: name,
                points: getTransformedPoints(entity),
                type: EntityTypeEnum.POLYLINE,
            });
        }
    });

    return stands;
};

/**
 * Retrieves stands as lines based on the provided node and mode.
 *
 * @param {Konva.Stage | Konva.Group | Konva.Layer} node - The Konva.Stage, Konva.Group,
 * or Konva.Layer from which to retrieve the stands.
 * @param {'visible' | 'selected' | 'selected-and-visible' | 'hidden' | 'all'} mode -
 * The mode indicating which stands to include based on their visibility and selection.
 * @returns {Map<string, Konva.Line>} A map of stands represented as Konva.Line objects,
 * where the keys are the handles and the values are the lines.
 */
const getStandsAsLines = (
    node: Konva.Stage | Konva.Group | Konva.Layer,
    mode: 'visible' | 'selected' | 'selected-and-visible' | 'hidden' | 'all',
    whiteList?: Map<string, { layer: string; handle: string; selected: boolean; visible: boolean }>,
) => {
    const lines: Map<string, Konva.Line> = new Map();

    const { children = [] } = node;

    for (const entity of children) {
        if (
            (entity instanceof Konva.Stage ||
                entity instanceof Konva.Group ||
                entity instanceof Konva.Layer) &&
            entity.children
        ) {
            const temp = getStandsAsLines(entity, mode, whiteList);
            for (const [key, value] of temp) {
                lines.set(key, value);
            }
        }

        const isStand = (entity?.attrs.id || '').startsWith('stand');

        if (isStand && entity instanceof Konva.Line) {
            const handle = entity.getAttr('name');
            const entityAdditionalInfo = whiteList && whiteList.get(entity.getAttr('textHandle'));

            let condition: boolean | undefined = false;

            switch (mode) {
                case 'visible':
                    condition = entity.getAttr('visible');
                    break;
                case 'selected':
                    condition = entity.getAttr('selected');
                    break;
                case 'selected-and-visible':
                    condition =
                        entityAdditionalInfo?.selected &&
                        entityAdditionalInfo?.visible &&
                        entity.getAttr('selected') &&
                        entity.getAttr('visible');
                    break;
                default:
                    condition = true;
                    break;
            }

            if (condition) {
                lines.set(handle, entity);
            }
        }
    }

    return lines;
};

/**
 * Updates the canvas entities' properties based on the provided values map.
 *
 * @param {Konva.Stage | Konva.Layer | Konva.Group} node - The Konva.Stage,
 * Konva.Layer, or Konva.Group whose entities need to be updated.
 * @param {Map<string, { fill: string; stroke: string; strokeWidth: number }>} values -
 *  A map of values where the keys are
 * the handles of the entities, and the values are the updated properties.
 */
const updateCanvasEntities = (
    entities: Map<
        string,
        { fill: string; stroke: string; strokeWidth: number; handle: string; standId: string }
    >,
) => {
    for (const [handle, entity] of entities) {
        const line = dxfEditorCache.getEntity(handle);

        if (line) {
            line.setAttrs({
                standId: entity.standId,
                fill: entity.fill,
                stroke: entity.stroke,
                realFill: entity.fill,
                realStroke: entity.stroke,
                strokeWidth: entity.strokeWidth,
                visible: true,
            });
        }
    }
};

export type ToggleEntitiesVisibilityModeType =
    | 'show-all'
    | 'toggle-visibility'
    | 'hide-all'
    | 'select-all'
    | 'unselect-all'
    | 'toggle-selection'
    | 'delete-selected-entity'
    | 'highlight-stands-without-id';

const toggleEntitiesVisibility = (
    stage: Konva.Stage,
    mode: ToggleEntitiesVisibilityModeType,
    whiteList: Map<string, { layer: string; handle: string; selected: boolean; visible: boolean }>,
    setValue: Function,
    force = false,
) => {
    const mainLayer = getMainLayer(stage);

    if (!mainLayer) {
        return;
    }

    const groups = (
        Array.isArray(mainLayer.children)
            ? mainLayer.children.filter(
                  (child) =>
                      child instanceof Konva.Group &&
                      child.getAttr('name').startsWith(LAYER_WITH_STANDS_PREFIX),
              ) || []
            : []
    ) as Konva.Group[];

    for (const group of groups) {
        const entities = (
            Array.isArray(group.children) ? group.children.slice() : []
        ) as Array<Konva.Line>;

        for (const entity of entities) {
            const isStand = isEntity(entity?.getAttr('id'));
            if (isStand && entity instanceof Konva.Line) {
                const textHandle = entity.getAttr('textHandle');

                const standFormInfo = whiteList.get(textHandle);

                const hasAccessToOperation = entity.getAttr('selected') && standFormInfo?.selected;

                const { layer: textLayer = '' } = standFormInfo || {};

                switch (mode) {
                    case 'show-all':
                        if (hasAccessToOperation || force) {
                            const visibleFieldName = createVisibilityFieldName(
                                textLayer,
                                textHandle,
                            );

                            setValue(visibleFieldName, true);
                            entity.setAttr('visible', true);
                        }

                        break;
                    case 'hide-all':
                        if (hasAccessToOperation || force) {
                            const visibleFieldName = createVisibilityFieldName(
                                textLayer,
                                textHandle,
                            );

                            setValue(visibleFieldName, false);
                            entity.setAttr('visible', false);
                        }
                        break;
                    case 'toggle-visibility':
                        entity.setAttr('visible', !entity.getAttr('visible'));
                        break;
                    case 'select-all':
                        if (whiteList.has(textHandle) || force) {
                            const selectFieldName = createSelectFieldName(textLayer, textHandle);
                            setValue(selectFieldName, true);
                            entity.setAttr('selected', true);
                        }
                        break;
                    case 'unselect-all':
                        if (whiteList.has(textHandle) || force) {
                            const selectFieldName = createSelectFieldName(textLayer, textHandle);
                            entity.setAttr('selected', false);
                            setValue(selectFieldName, false);
                        }
                        break;
                    case 'toggle-selection':
                        entity.setAttr('selected', !entity.getAttr('selected'));
                        break;
                    case 'delete-selected-entity':
                        if (hasAccessToOperation || force) {
                            const deleteFieldName = createDeleteFieldName(textLayer, textHandle);
                            setValue(deleteFieldName, true);
                            entity.destroy();
                        }
                        break;
                    case 'highlight-stands-without-id':
                    default:
                        break;
                }
            }
        }
    }
};

/* Function to scale & position the stage as needed to have
 ** the target shape fill the viewport.
 ** padding parameter is optional - if given this number
 ** of pixels is used as padding around the target shape.
 */
const centerAndFitShape = (stage: Konva.Stage, shape: Konva.Line, padding?: number) => {
    // set padding if not provided.
    // eslint-disable-next-line no-param-reassign
    padding = padding || 0;

    const // raw rect around shape, no padding applied.
        // Note: getClientRect gives size based on scaling, but
        // we want the unscaled size so use 'relativeTo: stage' param
        // to ensure consistent measurements.
        shapeRectRaw = shape.getClientRect({ relativeTo: stage });
    // Add padding to make a larger rect - this is what we want to fill the view
    const shapeRect = {
        x: shapeRectRaw.x - padding,
        y: shapeRectRaw.y - padding,
        width: shapeRectRaw.width + 2 * padding,
        height: shapeRectRaw.height + 2 * padding,
    };
    // Get the space we can see in the web page = size of div containing stage
    // or stage size, whichever is the smaller
    const viewRect = {
        width:
            stage.width() < stage.container().offsetWidth
                ? stage.width()
                : stage.container().offsetWidth,
        height:
            stage.height() < stage.container().offsetHeight
                ? stage.height()
                : stage.container().offsetHeight,
    };
    // Get the ratios of target shape v's view space widths and heights
    const widthRatio = viewRect.width / shapeRect.width;
    const heightRatio = viewRect.height / shapeRect.height;
    // decide on best scale to fit longest side of shape into view
    const scale = widthRatio > heightRatio ? heightRatio : widthRatio;
    // calculate the final adjustments needed to make
    // the shape centered in the view
    const centeringAjustment = {
        x: (viewRect.width - shapeRect.width * scale) / 2,
        y: (viewRect.height - shapeRect.height * scale) / 2,
    };
    // and the final position is...
    const finalPosition = {
        x: centeringAjustment.x + -shapeRect.x * scale,
        y: centeringAjustment.y + -shapeRect.y * scale,
    };

    // Apply the final position and scale to the stage.

    stage.position(finalPosition);
    stage.scale({ x: scale, y: scale });
};

const getTransformer = (stage: Konva.Stage | null, fresh = false) => {
    if (fresh) {
        return stage?.findOne('#dxfEditor-transformer') as Konva.Transformer | null;
    }

    if (!stage) {
        return null;
    }

    const mainLayer = getMainLayer(stage);

    if (!mainLayer) {
        return null;
    }

    if (dxfEditorCache.has('dxfEditor-transformer')) {
        return dxfEditorCache.getEntity<Konva.Transformer>('dxfEditor-transformer');
    }

    const tr = stage.findOne('#dxfEditor-transformer') as Konva.Transformer;

    if (!tr) {
        return null;
    }

    dxfEditorCache.setEntity<Konva.Transformer>('dxfEditor-transformer', tr);

    return tr;
};

const wait = (time = 100) =>
    new Promise((resolve) => {
        setTimeout(resolve, time);
    });

const activateStand = (entity: Konva.Line) => {
    const { realFill = '', realStroke = '', fill, stroke } = entity.getAttrs();

    if (!realFill && !realStroke) {
        entity.setAttrs({
            realFill: fill,
            realStroke: stroke,
        });
    }

    entity.setAttrs({
        fill: DXF_EDITOR_COLORS.ACTIVE_ENTITY_FILL,
        stroke: DXF_EDITOR_COLORS.ACTIVE_ENTITY_STROKE,
    });
};

const warnStand = (entity: Konva.Line) => {
    const { realFill = '', realStroke = '', fill, stroke } = entity.getAttrs();

    if (!realFill && !realStroke) {
        entity.setAttrs({
            realFill: fill,
            realStroke: stroke,
        });
    }

    entity.setAttrs({
        fill: DXF_EDITOR_COLORS.STAND_WITHOUT_ID_FILL,
        stroke: DXF_EDITOR_COLORS.STAND_WITHOUT_ID_STROKE,
    });
};

export {
    getStandsOutOfStage,
    getStandsAsLines,
    updateCanvasEntities,
    createEntityId,
    createLayerId,
    isEntity,
    isLayer,
    toggleEntitiesVisibility,
    centerAndFitShape,
    getTransformer,
    wait,
    activateStand,
    warnStand,
    getMainLayer,
};
