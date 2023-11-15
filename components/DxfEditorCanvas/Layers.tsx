import { memo, FC } from 'react';
import { Group } from 'react-konva';
import {
    getDxfEditorLayerByName,
    getDxfEditorLayersArray,
} from 'store/dxfEditor/dxfEditor.selectors';
import { useAppSelector } from 'store/store';
import { EntityModel, LayerModelType } from '../../dxfEditor.types';
import { MyEntity } from '../Entities';
import { createLayerId } from '../../helpers/canvas';

// in terms of optimization, we use Konva Group component instead of Layer.
// Because canvas node is created for every Layer in the dom and it is not recommended
const Layer = Group;

const LayerItem: FC<{ layerName: string }> = memo(({ layerName }) => {
    const { options, ...layer } = useAppSelector((store) =>
        getDxfEditorLayerByName(store, layerName),
    );

    return (
        <Layer
            id={createLayerId(options.name)}
            x={options.x || 0}
            y={options.y || 0}
            scaleX={options.scaleX || 1}
            scaleY={options.scaleY || 1}
            name={options.name}
            visible={layer.visible}
        >
            {Object.values(layer.entities).map((entity: EntityModel, j: number) => (
                <MyEntity key={j} type={entity.type} handle={entity.handle} />
            ))}
        </Layer>
    );
});

LayerItem.displayName = 'LayerItem';

const Layers: FC = memo(() => {
    const layersArray = useAppSelector(getDxfEditorLayersArray);

    return (
        <>
            {layersArray.map((layer: LayerModelType, i: number) => (
                <LayerItem layerName={layer.options.name} key={i} />
            ))}
        </>
    );
});

Layers.displayName = 'Layers';

export default Layers;
