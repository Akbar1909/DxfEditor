import { FC, useRef, useCallback, useState, useEffect } from 'react';
import { Box, Stack, Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { ModalWindow, Button } from 'components/UI';
import { useAppDispatch, useAppSelector } from 'store/store';
import { DXF_EDITOR_COLORS, getDxfEditorSaveStatus, resetDxfEditor } from 'store/dxfEditor';
import { useFormContext } from 'react-hook-form';
import { addMultipleStands } from 'store/floorplan';
import Konva from 'konva';
import useEntityArgsBox, { EntityArgsType } from 'components/DxfEditor/hooks/useEntityArgsBox';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import {
    createDeleteFieldName,
    createVisibilityFieldName,
    WhiteListValue,
    filterStandIds,
    prepareStands,
} from 'components/DxfEditor/helpers/form';
import useShortCuts from 'components/DxfEditor/hooks/useShortCuts';
import dxfEditorCache from 'components/DxfEditor/helpers/cache';
import useSelectArea from 'components/DxfEditor/hooks/useSelectArea';
import styles from './DxfEditorModal.styles';
import LayersCard from '../LayersCard/LayersCard';
import DxfEditorCanvas from '../DxfEditorCanvas';
import DxfEditorContext from './DxfEditorContext';
import {
    getStandsAsLines,
    getStandsOutOfStage,
    isEntity,
    toggleEntitiesVisibility,
    centerAndFitShape,
    ToggleEntitiesVisibilityModeType,
    wait,
    activateStand,
    warnStand,
} from '../../helpers/canvas';
import EntityArgsBox from '../EntityArgsBox';

interface IDxfEditorModalProps {
    image: string;
    stageImage?: HTMLImageElement;
}

export type DxfEditorMode = {
    selectArea: boolean;
    drag: boolean;
};

export const dxfEditorControlInitial: DxfEditorMode = {
    selectArea: true,
    drag: false,
};

export const updateCanvasControlsState = (prev: DxfEditorMode, mode: keyof DxfEditorMode) => {
    const newValue: DxfEditorMode = { ...prev };

    for (const key in prev) {
        if (mode === key) {
            newValue[mode] = !prev[mode];
        } else {
            newValue[key as keyof DxfEditorMode] = prev[mode];
        }
    }

    return newValue;
};

/**
 * DxfEditorModal component
 * @param {Object} props - data passed to the component
 * @param {string} image - hall image
 * @param {HTMLElement} stageImage - hall image is used as a src in Konva.Image
 * @returns {JSX.Element} - DxfEditorModal
 */

const DxfEditorModal: FC<IDxfEditorModalProps> = ({ stageImage }) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const stageRef = useRef<Konva.Stage>(null);
    const listRef = useRef<any>(null);
    const saveStatus = useAppSelector(getDxfEditorSaveStatus);
    const { getValues, watch, setValue } = useFormContext();
    const search = watch('search');

    const preActiveEntity = useRef<{
        fill: string;
        stroke: string;
        handle: string;
        entity: Konva.Line | null;
    }>({
        fill: '',
        stroke: '',
        handle: '',
        entity: null,
    });

    const [canvasControls, setCanvasControls] = useState<DxfEditorMode>(dxfEditorControlInitial);

    const [formState, setFormState] = useState<ReturnType<typeof filterStandIds>>({
        count: 0,
        whiteList: new Map<string, WhiteListValue>(),
    });

    const [deletedLayers, setDeletedLayers] = useState<Record<string, boolean>>({});

    const { count, whiteList } = formState;

    const {
        setEntityArgBoxController,
        entityArgBoxController,
        values,
        handleDiscard: handleDiscardEntityArgsBox,
        handleChanges: handleEntityArgsBoxChanges,
        handleSave,
        collectEntities,
        handleOnlyClose,
        openEntityArgsBox,
    } = useEntityArgsBox(stageRef.current);

    const resetPreActiveEntity = useCallback(() => {
        const { entity, handle } = preActiveEntity.current;
        if (!handle || !entity || !entity.getAttr('standId')) {
            return;
        }

        const { realFill = '', realStroke = '' } = entity.getAttrs();

        entity.setAttrs({
            fill: realFill,
            stroke: realStroke,
            realFill: '',
            realStroke: '',
        });
        preActiveEntity.current.entity = null;
    }, []);

    const { trRef, ...selectAreaArgs } = useSelectArea(
        stageRef.current as Konva.Stage,
        handleOnlyClose,
        collectEntities,
        resetPreActiveEntity,
        openEntityArgsBox,
        entityArgBoxController,
    );

    useEffect(() => {
        setFormState(filterStandIds(getValues(), search));
    }, [getValues, search]);

    useShortCuts(setCanvasControls, handleDiscardEntityArgsBox);

    const { handleSubmit } = useFormContext();

    const onSubmit = handleSubmit((result: any) => {
        if (!stageRef.current) {
            return;
        }

        const stage = stageRef.current;
        resetPreActiveEntity();

        const canvasStands = getStandsOutOfStage(stage);

        const { stands, hasStandWithoutId } = prepareStands(canvasStands, result);

        if (hasStandWithoutId) {
            enqueueSnackbar(t('Please provide ids for all stands'), { variant: 'warning' });
            return;
        }

        dispatch(addMultipleStands(stands));
    });

    const updateDeletedLayersList = useCallback((layerName: string) => {
        setDeletedLayers((prev) => ({ ...prev, [layerName]: true }));
    }, []);

    useEffect(() => {
        if (saveStatus === 'error' && stageRef.current) {
            enqueueSnackbar(t('Something went wrong'), { variant: 'error' });

            const canvasStands = getStandsAsLines(stageRef.current, 'visible');

            for (const value of canvasStands.values()) {
                const { stroke, fill, standId } = value.getAttrs();

                if (!standId) {
                    value.setAttrs({
                        fill: DXF_EDITOR_COLORS.STAND_WITHOUT_ID_FILL,
                        stroke: DXF_EDITOR_COLORS.STAND_WITHOUT_ID_STROKE,
                        realFill: fill,
                        realStroke: stroke,
                    });
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveStatus, t]);

    const checkModeRestriction = useCallback(() => {
        if (trRef.current && Number(trRef.current.nodes().length) > 0) {
            enqueueSnackbar(t('Please disable select area mode'), { variant: 'warning' });
            return false;
        }

        return true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    const toggleTrVisibility = useCallback((action: 'show' | 'hide') => {
        const tr = trRef.current;
        if (!tr) {
            return;
        }

        tr.setAttr('visible', action === 'show');
        setCanvasControls({ drag: action !== 'show', selectArea: action === 'show' });
    }, []);

    const highlightEntity = useCallback(
        (handle: string) => {
            if (!stageRef.current) {
                return;
            }

            const entity = dxfEditorCache.getEntity(handle);

            if (!entity) {
                return;
            }

            if (preActiveEntity.current.handle !== handle) {
                resetPreActiveEntity();
            }

            const { realFill = '', realStroke = '', standId = '' } = entity.getAttrs();

            preActiveEntity.current = {
                fill: realFill,
                stroke: realStroke,
                handle,
                entity,
            };

            if (standId) {
                activateStand(entity);
            } else {
                warnStand(entity);
            }
            centerAndFitShape(stageRef.current, entity, 20);
        },
        [resetPreActiveEntity],
    );

    const handleSelectEntity = (handle: string) => {
        const entity = dxfEditorCache.getEntity(handle);

        if (!entity) {
            return;
        }

        const selected = entity.getAttr('selected');
        entity.setAttr('selected', !selected);

        const newWhiteList = new Map(whiteList);

        const textHandle = entity.getAttr('textHandle');

        newWhiteList.set(textHandle, {
            ...(whiteList.get(textHandle) as WhiteListValue),
            selected: !selected,
        });

        setFormState((prev) => ({ ...prev, whiteList: newWhiteList }));
    };

    const handleEntitiesArgsChanges = useCallback(
        (mode: ToggleEntitiesVisibilityModeType, selectArea = false) => {
            if (!stageRef.current) {
                return;
            }

            if (mode === 'select-all' || mode === 'unselect-all') {
                const newWhiteList = new Map(whiteList);
                for (const [key, value] of newWhiteList) {
                    newWhiteList.set(key, { ...value, selected: mode === 'select-all' });
                }

                setFormState((prev) => ({ ...prev, whiteList: newWhiteList }));
            }

            if (mode === 'hide-all' || mode === 'show-all') {
                const newWhiteList = new Map(whiteList);
                for (const [key, value] of newWhiteList) {
                    newWhiteList.set(key, { ...value, visible: mode === 'show-all' });
                }

                setFormState((prev) => ({ ...prev, whiteList: newWhiteList }));
            }

            setCanvasControls((prev) => updateCanvasControlsState(prev, 'selectArea'));

            toggleEntitiesVisibility(stageRef.current, mode, whiteList, setValue);
        },
        [whiteList, setValue],
    );

    const handleClick = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (canvasControls.selectArea) {
                return;
            }

            const id = (e.target.attrs?.id || '') as string;

            if (!id) {
                return;
            }

            if (isEntity(id)) {
                const { name } = e.target.attrs;

                const selectedEntity = e.target as Konva.Line;

                if (preActiveEntity.current.handle !== name) {
                    resetPreActiveEntity();
                }

                if (!selectedEntity) {
                    return;
                }

                const { fill, stroke, realFill = '', realStroke = '' } = selectedEntity.getAttrs();

                selectedEntity.setAttrs({
                    realFill: realFill || fill,
                    realStroke: realStroke || stroke,
                });

                const handle = selectedEntity.getAttr('name');

                // @ts-ignore
                collectEntities(new Map([[handle, selectedEntity]]));

                setEntityArgBoxController({
                    x: e.evt.clientX,
                    y: e.evt.clientY,
                    open: true,
                    mode: 'transformer-one',
                    handle,
                });

                setCanvasControls((prev) => updateCanvasControlsState(prev, 'selectArea'));

                trRef.current?.nodes([selectedEntity]);
            }
        },
        [canvasControls, resetPreActiveEntity, setEntityArgBoxController, collectEntities, trRef],
    );

    const handleEntitiesEdit = useCallback(
        (e: MouseEvent) => {
            if (!stageRef.current) {
                return;
            }

            setEntityArgBoxController((prev: EntityArgsType) => ({
                x: e.clientX,
                y: e.clientY,
                mode: 'multiple',
                open: !prev.open,
                handle: 'edit-selected-stands',
            }));

            const entities = getStandsAsLines(stageRef.current, 'selected-and-visible', whiteList);

            collectEntities(entities);
        },
        [collectEntities, setEntityArgBoxController, whiteList],
    );

    const handleDeleteEntity = useCallback(
        async (handle: string) => {
            const entity = dxfEditorCache.getEntity(handle);

            if (!entity) {
                return;
            }

            dxfEditorCache.deleteEntity(handle);

            const { textHandle, textLayer } = entity.getAttrs();

            const deleteFieldName = createDeleteFieldName(textLayer, textHandle);

            setValue(deleteFieldName, true);

            const newWhiteList = new Map(whiteList);

            newWhiteList.delete(textHandle);
            setFormState({ count: count - 1, whiteList: newWhiteList });

            centerAndFitShape(stageRef.current as Konva.Stage, entity, 20);

            await wait(300);

            entity.destroy();
        },
        [setValue, whiteList, count],
    );

    const toggleEntity = useCallback(
        async (handle: string) => {
            const entity = dxfEditorCache.getEntity(handle);

            if (!entity) {
                return;
            }

            const { visible, textHandle } = entity.getAttrs();

            const newWhiteList = new Map(whiteList);

            newWhiteList.set(textHandle, {
                ...(whiteList.get(textHandle) as WhiteListValue),
                visible: !visible,
            });

            setFormState((prev) => ({ ...prev, whiteList: newWhiteList }));

            centerAndFitShape(stageRef.current as Konva.Stage, entity, 20);
            await wait(300);
            entity.setAttr('visible', !visible);
        },
        [whiteList],
    );

    const disableSelectAreaMode = useCallback(() => {
        setEntityArgBoxController((prev) => ({ ...prev, open: false }));
        handleDiscardEntityArgsBox();
    }, [handleDiscardEntityArgsBox, setEntityArgBoxController]);

    const handleEntityArgBoxHide = useCallback(
        (action?: 'hide' | 'show') => {
            if (!stageRef.current) {
                return;
            }

            if (entityArgBoxController.handle === 'edit-selected-stands') {
                toggleEntitiesVisibility(
                    stageRef.current,
                    action === 'hide' ? 'hide-all' : 'show-all',
                    whiteList,
                    setValue,
                );

                return;
            }

            const tr = trRef.current;

            if (!tr) {
                return;
            }

            const newWhiteList = new Map(whiteList);

            tr.nodes().forEach((node) => {
                const { textHandle, textLayer } = node.getAttrs();
                newWhiteList.set(textHandle, {
                    ...(whiteList.get(textHandle) as WhiteListValue),
                    visible: !node.getAttr('visible'),
                });
                setValue(
                    createVisibilityFieldName(textLayer, textHandle),
                    !node.getAttr('visible'),
                );
                node.setAttr('visible', !node.getAttr('visible'));
            });

            setFormState((prev) => ({ ...prev, whiteList: newWhiteList }));
        },
        [entityArgBoxController, setValue, whiteList, trRef],
    );

    const handleEntityArgBoxDelete = useCallback(() => {
        if (!stageRef.current) {
            return;
        }

        handleDiscardEntityArgsBox();

        if (entityArgBoxController.handle === 'edit-selected-stands') {
            toggleEntitiesVisibility(
                stageRef.current,
                'delete-selected-entity',
                whiteList,
                setValue,
            );

            const newWhiteList = new Map(whiteList);

            for (const [key, value] of newWhiteList) {
                if (value.selected) {
                    newWhiteList.delete(key);
                }
            }

            setFormState({ count: newWhiteList.size, whiteList: newWhiteList });

            disableSelectAreaMode();
            return;
        }

        const tr = trRef.current;

        if (!tr) {
            return;
        }

        tr.nodes().forEach((node) => {
            const { textHandle, textLayer } = node.getAttrs();
            setValue(createDeleteFieldName(textLayer, textHandle), true);
            node.destroy();
        });

        tr.setAttr('visible', false);
        disableSelectAreaMode();
    }, [
        entityArgBoxController,
        setValue,
        handleDiscardEntityArgsBox,
        disableSelectAreaMode,
        whiteList,
        trRef,
    ]);

    const deleteSelectedStands = useCallback(() => {
        const newWhiteList = new Map(whiteList);

        for (const [key, value] of newWhiteList) {
            if (value.selected) {
                newWhiteList.delete(key);
            }
        }

        setFormState({ count: newWhiteList.size, whiteList: newWhiteList });
        handleEntitiesArgsChanges('delete-selected-entity');
    }, [whiteList, handleEntitiesArgsChanges]);

    const handleCloseModal = () => {
        dispatch(resetDxfEditor());
    };

    const handleDeleteInvalidEntitiesLayer = useCallback(() => {
        if (!stageRef.current) {
            return;
        }

        const layer = stageRef.current.findOne('#invalid-entities-layer') as Konva.Layer;

        if (!layer) {
            return;
        }

        layer.destroy();
    }, []);

    return (
        <>
            <ModalWindow
                open={true}
                // @ts-ignore
                onClose={(e: any, reason: string) => {
                    if (reason !== 'backdropClick' && saveStatus !== 'loading') {
                        handleCloseModal();
                    }
                }}
                variant="brand"
                title="DXF Editor"
                sx={styles.modal}
                ActionButtons={
                    <Stack
                        direction="row"
                        width="100%"
                        alignItems="center"
                        justifyContent="center"
                        sx={styles.actionButtonsContainer}
                        columnGap={3}
                    >
                        <Button
                            disabled={saveStatus === 'loading'}
                            sx={styles.cancelButton}
                            variant="outlined"
                            buttonText="Cancel"
                            onClick={handleCloseModal}
                        />
                        <Button
                            disabled={saveStatus === 'loading'}
                            onClick={onSubmit}
                            variant="contained"
                            buttonText={`${saveStatus === 'loading' ? 'Saving...' : 'Save'}`}
                        />
                    </Stack>
                }
            >
                <DxfEditorContext.Provider
                    value={{
                        closeEntityArgsBox: handleOnlyClose,
                        canvasControls,
                        highlightEntity,
                        handleEntitiesEdit,
                        handleDeleteEntity,
                        resetPreActiveEntity,
                        handleSelectEntity,
                        toggleEntity,
                        handleEntitiesArgsChanges,
                        listRef,
                        setEntityArgBoxController,
                        count,
                        whiteList,
                        toggleTrVisibility,
                        checkModeRestriction,
                        activeEntity: preActiveEntity.current.entity,
                        deleteSelectedStands,
                        openEntityArgsBox,
                        handleDeleteInvalidEntitiesLayer,
                        updateDeletedLayersList,
                        deletedLayers,
                        setCanvasControls,
                        selectArea: {
                            ...selectAreaArgs,
                            trRef,
                        },
                    }}
                >
                    <Box sx={styles.container}>
                        <Grid
                            container
                            columnSpacing={3}
                            display="flex"
                            sx={{
                                height: '100%',
                                minHeight: '100%',
                                maxHeight: '100%',
                            }}
                        >
                            <Grid item md={4} height="100%">
                                <form style={{ height: '100%' }} onSubmit={onSubmit}>
                                    <LayersCard entityArgsBoxOpen={entityArgBoxController.open} />
                                </form>
                            </Grid>
                            <Grid item md={8}>
                                <DxfEditorCanvas
                                    handleClick={handleClick}
                                    stageImage={stageImage}
                                    ref={stageRef}
                                />
                                {entityArgBoxController.open && (
                                    <EntityArgsBox
                                        key={entityArgBoxController.handle}
                                        stand={entityArgBoxController.handle}
                                        values={values}
                                        x={entityArgBoxController.x}
                                        y={entityArgBoxController.y}
                                        handleDiscard={handleDiscardEntityArgsBox}
                                        handleChanges={handleEntityArgsBoxChanges}
                                        handleSave={handleSave}
                                        isBulkEdit={
                                            entityArgBoxController.mode === 'multiple' ||
                                            entityArgBoxController.mode === 'transformer'
                                        }
                                        handleEntityArgBoxHide={handleEntityArgBoxHide}
                                        handleEntityArgBoxDelete={handleEntityArgBoxDelete}
                                        handleOnlyClose={handleOnlyClose}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                </DxfEditorContext.Provider>
            </ModalWindow>
        </>
    );
};

DxfEditorModal.propTypes = {
    image: PropTypes.string.isRequired,
    stageImage: PropTypes.any,
};

export default DxfEditorModal;
