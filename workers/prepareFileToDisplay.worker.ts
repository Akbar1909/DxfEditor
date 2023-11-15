// @ts-nocheck
import { Helper } from 'dxf';
import {
    prepareEntity,
    scaleEntity,
    isValidStand,
    makeEntitiesKeyValue,
    makeLayers,
    renderWrapperInsideContainer,
    attachStandNameToStand,
    checkStandLayer,
    isInvalidStand,
    aliasLayerName,
} from 'components/DxfEditor/helpers/parser';
import { Point2D } from 'dxf/Common';
import { pChecker } from 'components/DxfEditor/helpers/performanceChecker';
import {
    EntityTypeEnum,
    EntityModel,
    StandType,
    DxfBlockType,
    DxfEditorStateType,
} from 'components/DxfEditor/dxfEditor.types';
import { LAYER_WITH_UNSUPPORTED_ELEMENTS } from 'store/dxfEditor';

// eslint-disable-next-line no-restricted-globals
self.onmessage = (
    e: MessageEvent<{ fileContent: string; stageOptions: DxfEditorStateType['stageOptions'] }>,
) => {
    const { fileContent, stageOptions } = e.data;
    const { width, height } = stageOptions;
    const { parsed } = new Helper(fileContent);

    // @ts-ignore
    const {
        header = {},
        blocks = [],
        tables: { layers, styles, vports, ltypes },
    } = parsed;

    const entities = (parsed?.entities || []) as unknown as Array<EntityModel>;

    const wrapperLeftBottom = (header?.extMin as Point2D) || { x: 0, y: height };
    const wrapperTopRight = (header?.extMax as Point2D) || { x: width, y: 0 };

    pChecker.start();

    const { wrapperLeftBottomScaled, wrapperTopRightScaled } = renderWrapperInsideContainer(
        wrapperLeftBottom,
        wrapperTopRight,
        width,
        height,
    );

    const args = {
        wrapperLeftBottom,
        wrapperTopRight,
        wrapperLeftBottomScaled,
        wrapperTopRightScaled,
    };

    const standNameEntities = entities
        .filter(
            (entity) =>
                (entity.type === EntityTypeEnum.TEXT || entity.type === EntityTypeEnum.MTEXT) &&
                checkStandLayer(entity.layer, 'stand-id'),
        )
        .map((entity) =>
            scaleEntity(prepareEntity({ entity, styles, ltypes }), args, stageOptions),
        );

    const keyValueBlocks = ((Array.isArray(blocks) ? blocks : []) as Array<DxfBlockType>).reduce(
        (acc, cur) => ({ ...acc, [cur.name]: cur }),
        {},
    );

    const totalEntities = entities.map((entity) => {
        if (entity.type !== EntityTypeEnum.INSERT) {
            return entity;
        }

        return {
            ...entity,
            blockData: keyValueBlocks[entity.block],
        };
    });

    const stands = totalEntities
        .filter(isValidStand)
        .map((entity) =>
            scaleEntity(prepareEntity({ entity, styles, ltypes }), args, stageOptions),
        ) as unknown as StandType[];

    const invalidEntities = totalEntities
        .filter(isInvalidStand)
        .map((entity) =>
            scaleEntity(prepareEntity({ entity, ltypes, styles }), args, stageOptions),
        );

    const { stands: formattedStands, textEntities } = attachStandNameToStand(
        stands,
        standNameEntities,
    );

    const standsWithIds = formattedStands.filter((stand) => stand?.text);

    const keyValueStands = makeEntitiesKeyValue(standsWithIds);

    let preparedLayers = {
        [LAYER_WITH_UNSUPPORTED_ELEMENTS]: {
            entities: {},
            selected: false,
            options: {
                name: LAYER_WITH_UNSUPPORTED_ELEMENTS,
                displayName: 'Unsupported elements',
            },
            visible: false,
            expanded: false,
            standNameEntities: {},
        },
        ...Object.values(layers || {}).reduce(
            (acc: Record<string, any>, cur: any, i) => ({
                ...acc,
                [cur.name || `Default LayerName ${i}`]: {
                    entities: {},
                    selected: false,
                    options: {
                        name: cur.name,
                        displayName: aliasLayerName(cur.name),
                    },
                    visible: cur.colorNumber > 0,
                    deleted: false,
                    expanded: checkStandLayer(cur.name, 'stand-id'),
                    standNameEntities: {},
                },
            }),
            {},
        ),
        ...makeLayers(keyValueStands, layers),
    };

    preparedLayers = textEntities.reduce(
        (acc, cur) => ({
            ...acc,
            [cur.layer]: {
                ...acc[cur.layer],
                standNameEntities: { ...acc[cur.layer]?.standNameEntities, [cur.handle]: cur },
            },
        }),
        preparedLayers,
    );

    pChecker.end();

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
        layers: preparedLayers,
        validEntities: keyValueStands,
        invalidEntities,
        wrapperLeftBottom,
        wrapperTopRight,
        wrapperLeftBottomScaled,
        wrapperTopRightScaled,
        tables: {
            styles,
            vports,
            ltypes,
        },
        textEntities: textEntities.reduce((acc, cur) => ({ ...acc, [cur.handle]: cur }), {}),
    });
};

export default null;
