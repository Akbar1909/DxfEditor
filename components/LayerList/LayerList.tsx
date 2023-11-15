/* eslint-disable no-param-reassign */
import { FC, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    LAYERS_WITH_STANDS,
    LAYER_WITH_UNSUPPORTED_ELEMENTS,
    getDxfEditorLayersArray,
} from 'store/dxfEditor';
import { useAppSelector } from 'store/store';
import LayerItem from './LayerItem';
import { LayerModelType } from '../../dxfEditor.types';
import { useDxfEditorContext } from '../DxfEditorModal/DxfEditorContext';

interface ILayerListProps {
    layersHasEmptyFields: Record<string, string>;
    height: number;
}

const filterLayers = (layers: LayerModelType[], deletedLayers: Record<string, boolean>) =>
    layers.filter(
        (layer) =>
            (layer.options.displayName.includes(LAYERS_WITH_STANDS) ||
                layer.options.name === LAYER_WITH_UNSUPPORTED_ELEMENTS) &&
            !deletedLayers?.[layer.options.name],
    ) || [];
/**
 * LayerList
 * @param {Object} props - data passed to the component
 * @param {string} props.search - the input search string
 * @param {Object} props.layersHasEmptyFields - checks that all stands of the layer have an id
 * @param {number} props.height - height of the card content
 * @returns {JSX.Element} - LayerList
 */

const LayerList: FC<ILayerListProps> = ({ layersHasEmptyFields, height }) => {
    const layers = useAppSelector(getDxfEditorLayersArray);
    const { deletedLayers } = useDxfEditorContext();

    const renderLayers = useMemo(
        () => filterLayers(layers, deletedLayers),
        [layers, deletedLayers],
    );

    return (
        <>
            {renderLayers.map((layer, i) => (
                <LayerItem
                    key={i}
                    layerName={layer.options.name}
                    height={height}
                    hasEmptyField={Boolean(layersHasEmptyFields?.[layer.options.name])}
                />
            ))}
        </>
    );
};

LayerList.propTypes = {
    layersHasEmptyFields: PropTypes.any.isRequired,
    height: PropTypes.number.isRequired,
};

export default LayerList;
