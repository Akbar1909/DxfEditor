import { hexToRGB } from './color';

/**
 * Creates a field name by combining a layer name and an entity handle.
 *
 * @param {string} layerName - The name of the layer.
 * @param {string} entityHandle - The handle of the entity.
 * @returns {string} The concatenated field name in the format "layerName/entityHandle".
 */
const createFieldName = (layerName: string, entityHandle: string) =>
    `${layerName}/${entityHandle}/main`;

/**
 * Parses a field name into its layer and entity handle components.
 *
 * @param {string} fieldName - The field name to parse in the format "layerName/entityHandle".
 * @returns {Object} An object containing the parsed layer and entity handle components.
 * @property {string} layer - The parsed layer name.
 * @property {string} handle - The parsed entity handle.
 */
const parseFieldName = (fieldName: string) => {
    const [layer, handle, isCheckbox = ''] = fieldName.split('/');

    return {
        layer,
        handle,
        isCheckbox: Boolean(isCheckbox),
    };
};

// const parseFieldName = memoize(localParseFieldName);

const createSelectFieldName = (layerName: string, entityHandle: string) =>
    `${layerName}/${entityHandle}/selected`;

const createVisibilityFieldName = (layerName: string, entityHandle: string) =>
    `${layerName}/${entityHandle}/visibility`;

const createDeleteFieldName = (layerName: string, entityHandle: string) =>
    `${layerName}/${entityHandle}/delete`;

type WhiteListValue = { layer: string; handle: string; visible: boolean; selected: boolean };

const filterStandIds = (
    formValues: Record<string, string>,
    search: string,
): {
    count: number;
    whiteList: Map<string, WhiteListValue>;
} => {
    const standIdKeys = [];

    for (const key in formValues) {
        if (key.endsWith('main')) {
            standIdKeys.push(key);
        }
    }

    const filteredMap = new Map();

    for (const key of standIdKeys) {
        const { handle, layer } = parseFieldName(key);
        const deleteFieldName = createDeleteFieldName(layer, handle);
        const visibleFieldName = createVisibilityFieldName(layer, handle);
        const selectFieldName = createSelectFieldName(layer, handle);

        const active =
            new RegExp(search.trim(), 'i').test(formValues[key]) && !formValues[deleteFieldName];
        if (active) {
            filteredMap.set(handle, {
                handle,
                layer,
                visible: formValues[visibleFieldName],
                selected: formValues[selectFieldName],
            });
        }
    }

    const count = filteredMap.size;

    return {
        whiteList: filteredMap,
        count,
    };
};

const prepareStands = (
    canvasStands: Array<Record<string, any>>,
    updatedIds: Record<string, string>,
) => {
    const preparedStands: Record<string, any> = {};

    let hasStandWithoutId = false;

    for (const item of canvasStands) {
        const { name, points, stroke, fill, strokeWidth, textHandle, textLayer, hideStand } = item;

        const fieldName = createFieldName(textLayer, textHandle);

        hasStandWithoutId = !updatedIds[fieldName];

        if (hasStandWithoutId) {
            return {
                hasStandWithoutId,
                stands: {},
            };
        }

        preparedStands[name] = {
            handle: name,
            coords: points,
            params: {
                strokeColor: JSON.stringify(hexToRGB(stroke.slice(1)).obj),
                shapeColor: JSON.stringify(hexToRGB(fill.slice(1)).obj),
                strokeWidth,
                hideStand: String(hideStand),
            },
            name: updatedIds[fieldName],
        };
    }

    return {
        hasStandWithoutId: false,
        stands: preparedStands,
    };
};

export type { WhiteListValue };

export {
    createFieldName,
    parseFieldName,
    createSelectFieldName,
    createVisibilityFieldName,
    createDeleteFieldName,
    filterStandIds,
    prepareStands,
};
