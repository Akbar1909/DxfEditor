import { FC } from 'react';
import { EntityModel, EntityTypeEnum } from '../../dxfEditor.types';
import PolylineShape from './PolyLineShape';

export const MyShape: FC<{ entity: EntityModel }> = ({ entity }) => {
    switch (entity.type) {
        case EntityTypeEnum.POLYLINE:
            return <PolylineShape key={entity.handle} entity={entity} />;
        default:
            return null;
    }
};
