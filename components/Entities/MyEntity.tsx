import { FC } from 'react';
import { EntityTypeEnum } from '../../dxfEditor.types';
import MyPolyLine from './MyPolyLine';

interface IMyEntityProps {
    handle: string;
    type: EntityTypeEnum;
}
const MyEntity: FC<IMyEntityProps> = ({ type, ...props }) => {
    switch (type) {
        case EntityTypeEnum.POLYLINE:
            return <MyPolyLine {...props} />;
        default:
            return null;
    }
};

export default MyEntity;
