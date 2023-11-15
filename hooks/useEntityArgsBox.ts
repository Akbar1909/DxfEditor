import Konva from 'konva';
import { useState, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { DXF_EDITOR_COLORS } from 'store/dxfEditor';
import { createFieldName } from '../helpers/form';
import { updateCanvasEntities } from '../helpers/canvas';
import dxfEditorCache from '../helpers/cache';

const initialValues = {
    id: '',
    fillColor: '',
    strokeColor: '',
    strokeWidth: 1,
};

export type EntityArgsType = {
    x: number;
    y: number;
    open: boolean;
    mode: 'one' | 'multiple' | 'transformer' | 'transformer-one';
    handle: string;
};

const useEntityArgsBox = (stage: Konva.Stage | null) => {
    const { setValue } = useFormContext();
    const preEntitiesAttrs = useRef<
        Map<
            string,
            { fill: string; stroke: string; strokeWidth: number; handle: string; standId: string }
        >
    >(new Map());
    const currentEntities = useRef<Map<string, Konva.Line>>(new Map());

    const [entityArgBoxController, setEntityArgBoxController] = useState<EntityArgsType>({
        x: 0,
        y: 0,
        open: false,
        mode: 'one',
        handle: '',
    });

    const [values, setValues] = useState<{
        id: string;
        fillColor: string;
        strokeColor: string;
        strokeWidth: number;
    }>(initialValues);

    const collectEntities = useCallback(
        (entities: Map<string, Konva.Line>) => {
            if (!stage) {
                return;
            }

            if (entities.size === 1) {
                const [firstEl] = entities.values();
                const { standId, fill, stroke, strokeWidth } = firstEl.getAttrs();

                setValues({
                    id: standId,
                    fillColor: (fill || '').slice(1),
                    strokeColor: (stroke || '').slice(1),
                    strokeWidth: strokeWidth || 0,
                });
            } else {
                setValues({
                    id: '',
                    strokeWidth: 1,
                    fillColor: DXF_EDITOR_COLORS.STAND_WITH_ID_FILL.slice(1),
                    strokeColor: DXF_EDITOR_COLORS.STAND_WITH_ID_STROKE.slice(1),
                });
            }

            preEntitiesAttrs.current = new Map();

            entities.forEach((entity, key) => {
                preEntitiesAttrs.current.set(key, {
                    standId: entity.getAttr('standId'),
                    fill: entity.getAttr('realFill'),
                    stroke: entity.getAttr('realStroke'),
                    strokeWidth: entity.getAttr('strokeWidth'),
                    handle: entity.getAttr('name'),
                });
            });

            currentEntities.current = entities;
        },
        [stage],
    );

    const handleOnlyClose = useCallback(() => {
        setEntityArgBoxController((prev) => ({ ...prev, handle: '', open: false }));
        setValues(initialValues);
    }, []);

    const handleDiscardMultipleMode = useCallback(() => {
        if (!stage) {
            return;
        }

        if (preEntitiesAttrs.current.size === 1) {
            const [firstEl] = preEntitiesAttrs.current.values();

            const entity = dxfEditorCache.getEntity(firstEl.handle);

            if (entity) {
                const { textHandle, textLayer } = entity.getAttrs();

                setValue(createFieldName(textLayer, textHandle), firstEl.standId);
            }
        }

        updateCanvasEntities(preEntitiesAttrs.current);
        currentEntities.current = new Map();
        setValues(initialValues);
    }, [stage, setValue]);

    const handleDiscard = useCallback(() => {
        setEntityArgBoxController((prev) => ({ ...prev, mode: 'one', open: false }));

        if (
            entityArgBoxController.mode === 'multiple' ||
            entityArgBoxController.mode === 'transformer' ||
            entityArgBoxController.mode === 'transformer-one'
        ) {
            handleDiscardMultipleMode();
        }
    }, [handleDiscardMultipleMode, entityArgBoxController.mode]);

    const handleSave = () => {
        setValues(initialValues);
        setEntityArgBoxController((prev) => ({ ...prev, mode: 'one', open: false }));
    };

    const updateOneEntity = useCallback(
        ({
            entity,
            name,
            value,
        }: {
            entity: Konva.Line & { selected?: boolean };
            name: string;
            value: string;
        }) => {
            if (name === 'fillColor') {
                const tempFill = `#${value}`;
                entity.setAttrs({
                    fill: tempFill,
                    ...(tempFill !== DXF_EDITOR_COLORS.STAND_WITHOUT_ID_FILL && {
                        realFill: tempFill,
                    }),
                });
            }

            if (name === 'strokeColor') {
                const tempStroke = `#${value}`;

                entity.setAttrs({
                    stroke: tempStroke,
                    ...(tempStroke !== DXF_EDITOR_COLORS.STAND_WITHOUT_ID_STROKE && {
                        realStroke: tempStroke,
                    }),
                });
            }

            if (name === 'strokeWidth') {
                entity.strokeWidth(Number(value.match(/\d+/)?.[0] || 0));
            }
        },
        [],
    );

    const updateMultipleEntities = useCallback(
        ({ name, value }: { name: string; value: string }) => {
            if (!stage) {
                return;
            }

            currentEntities.current.forEach((entity) => updateOneEntity({ entity, name, value }));
        },
        [stage, updateOneEntity],
    );

    const handleChanges = useCallback(
        ({ name, value }: { name: string; value: string }) => {
            if (
                entityArgBoxController.mode === 'multiple' ||
                entityArgBoxController.mode === 'transformer' ||
                entityArgBoxController.mode === 'transformer-one'
            ) {
                updateMultipleEntities({ name, value });
            }

            setValues((prev) => ({ ...prev, [name]: value }));
        },
        [entityArgBoxController.mode, updateMultipleEntities],
    );

    const openEntityArgsBox = useCallback((args: EntityArgsType) => {
        setEntityArgBoxController(args);
    }, []);

    return {
        entityArgBoxController,
        setValues,
        setEntityArgBoxController,
        values,
        handleDiscard,
        handleChanges,
        handleSave,
        collectEntities,
        handleOnlyClose,
        openEntityArgsBox,
    };
};
export default useEntityArgsBox;
