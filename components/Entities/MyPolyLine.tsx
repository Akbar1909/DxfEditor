import { FC } from 'react';
import { useAppSelector } from 'store/store';
import { getDxfEditorEntity } from 'store/dxfEditor';
import { PolyLineShape } from '../Shapes';
import { IPolylineEntity } from '../../dxfEditor.types';

const MyPolyLine: FC<{ handle: string }> = ({ handle }) => {
    const entity = useAppSelector<IPolylineEntity>((store) =>
        getDxfEditorEntity(store, { handle }),
    );

    return <PolyLineShape entity={entity} />;
};

export default MyPolyLine;
