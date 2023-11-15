import { FC, memo, useRef, useEffect } from 'react';
import { Line } from 'react-konva';
import { DXF_EDITOR_COLORS, DXF_EDITOR_SIZES } from 'store/dxfEditor';
import Konva from 'konva';
import { IPolylineEntity } from '../../dxfEditor.types';
import { createEntityId } from '../../helpers/canvas';

/**
 * @typedef {Object} PolylineShape
 * @property {number} [x=0] - The x position of the polyline
 * @property {number} [y=0] - The y position of the polyline
 * @property {string} handle - unique property for polyline object
 * @property {number} scaleX - scaleX
 * @property {number} scaleY - scaleY
 * @property {number} [rotation=0] - The rotation of the polyline
 * @property {boolean} deleted - if deleted is true, the polyline will not be visible and be saved
 * @property {boolean} closed - if closed is true, it is valid stand
 * @property {string}[tempStrokeColor=''] - temporary stroke color
 * @property {string} [tempFillColor=''] - temporary fill color
 * @property {Array.<number[]>} points - coords of the polyline
 */

/**
 * PolylineShape component
 * @param {Object} props - data passed to the component
 * @param {PolylineShape} props.entity - the entity
 * @returns
 */

const PolyLineShape: FC<{ entity: IPolylineEntity }> = memo(({ entity }) => {
    const ref = useRef<Konva.Line | null>(null);
    const done = useRef(false);

    useEffect(() => {
        if (ref.current && !done.current) {
            done.current = true;
            ref.current.setAttr('textHandle', entity.text.handle);
            ref.current.setAttr('textLayer', entity.text.layer);
            ref.current.setAttr('layer', entity.layer);
            ref.current.setAttr('selected', true);
            ref.current.setAttr('standId', entity.text.string);
            ref.current.setAttr('realFill', DXF_EDITOR_COLORS.STAND_WITH_ID_FILL);
            ref.current.setAttr('realStroke', DXF_EDITOR_COLORS.STAND_WITH_ID_STROKE);
        }
    }, [entity]);

    return (
        <Line
            ref={ref}
            x={entity?.x ?? 0}
            y={entity?.y ?? 0}
            id={createEntityId(entity.handle)}
            scaleX={entity.scaleX}
            scaleY={entity.scaleY}
            rotation={entity.rotation ?? 0}
            name={entity.handle}
            visible={!entity.deleted}
            closed={entity.closed}
            stroke={DXF_EDITOR_COLORS.STAND_WITH_ID_STROKE}
            fill={DXF_EDITOR_COLORS.STAND_WITH_ID_FILL}
            strokeWidth={DXF_EDITOR_SIZES.STROKE_WIDTH}
            points={entity.points.flat()}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
            hitStrokeWidth={0}
        />
    );
});

PolyLineShape.displayName = 'PolylineShape';

export default PolyLineShape;
