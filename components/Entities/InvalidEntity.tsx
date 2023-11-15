import { Context } from 'konva/lib/Context';
import { memo } from 'react';
import { Shape } from 'react-konva';
import { getDxfEditorInvalidEntities, getDxfEditorLayers } from 'store/dxfEditor';
import { useAppSelector } from 'store/store';
import { drawEntityOnNativeCanvas } from '../../helpers/parser';
import { EntityModel } from '../../dxfEditor.types';

const InvalidEntity = memo(() => {
    const invalidEntities = useAppSelector<EntityModel[]>(getDxfEditorInvalidEntities);
    const layers = useAppSelector(getDxfEditorLayers);

    return (
        <Shape
            sceneFunc={(ctx: Context) => {
                invalidEntities.forEach((invalidEntity) => {
                    if (!layers[invalidEntity.layer]?.visible) {
                        return;
                    }
                    drawEntityOnNativeCanvas(ctx, invalidEntity);
                });
            }}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
            hitStrokeWidth={0}
        />
    );
});

InvalidEntity.displayName = 'InvalidEntity';

export default InvalidEntity;
