import { useCallback, useEffect, useRef } from 'react';
import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';
import { useAppSelector } from 'store/store';
import { getDxfEditorStatus } from 'store/dxfEditor';
import { getMainLayer, getStandsAsLines, isEntity } from '../helpers/canvas';
import dxfEditorCache from '../helpers/cache';
import useEntityArgsBox from './useEntityArgsBox';

let trCache: Konva.Node[] = [];

interface ISelectionRect {
    visible: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const useSelectArea = (
    stage: Konva.Stage,
    handleCloseEntityArgsBox: () => void,
    collectEntities: (entities: Map<string, Konva.Line>) => void,
    resetPreActiveEntity: () => void,
    openEntityArgsBox: ReturnType<typeof useEntityArgsBox>['openEntityArgsBox'],
    entityArgBoxController: ReturnType<typeof useEntityArgsBox>['entityArgBoxController'],
) => {
    const elements = useRef<Konva.Line[]>([]);
    const dxfEditorStatus = useAppSelector(getDxfEditorStatus);

    const trRef = useRef<Konva.Transformer | null>(null);
    const selectionRectRef = useRef<Konva.Rect>(null);
    const selection = useRef<ISelectionRect>({
        visible: false,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    });

    useEffect(() => {
        if (!stage || !trRef.current || dxfEditorStatus !== 'success') {
            return;
        }

        elements.current = Array.from(getStandsAsLines(stage, 'all').values());

        dxfEditorCache.setMultipleEntities(elements.current);

        trCache = elements.current;

        dxfEditorCache.setEntity<Konva.Transformer>('dxfEditor-transformer', trRef.current);

        trRef.current.nodes(trCache);
    }, [dxfEditorStatus, stage]);

    const updateSelectionRect = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            const node = selectionRectRef.current;

            if (!node || !stage) {
                return;
            }

            if (entityArgBoxController.open) {
                node.setAttrs({
                    width: 0,
                    height: 0,
                });
            }

            node.setAttr('visible', !entityArgBoxController.open);

            const scale = stage.scale()?.x || 1;

            node.setAttrs({
                visible: selection.current.visible,
                x: Math.min(selection.current.x1, selection.current.x2) / scale,
                y: Math.min(selection.current.y1, selection.current.y2) / scale,
                width: Math.abs(selection.current.x1 - selection.current.x2) / scale,
                height: Math.abs(selection.current.y1 - selection.current.y2) / scale,
                fill: 'rgba(0, 161, 255, 0.3)',
            });
            node.getLayer()?.batchDraw();
        },
        [stage, entityArgBoxController.open],
    );

    const clearTr = useCallback(() => {
        const tr = trRef.current;

        if (!tr) {
            return;
        }

        tr?.nodes([]);
        trCache = [];

        const mainLayer = getMainLayer(stage);

        if (mainLayer) {
            mainLayer.draw();
        }

        elements.current = [];
        resetPreActiveEntity();
    }, [resetPreActiveEntity, stage]);

    const onClickTap = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            const tr = trRef.current;
            const { target } = e;
            // if click on empty area - remove all selections
            if (target === stage || Boolean(target.attrs?.image)) {
                clearTr();

                return true;
            }

            if (target instanceof Konva.Line) {
                const id = target.getAttr('id') || '';

                if (isEntity(id)) {
                    tr?.nodes([target]);
                    elements.current.push(target);
                    trCache = [target];
                    const handle = target.getAttr('name');

                    openEntityArgsBox({
                        x: e.evt.clientX,
                        y: e.evt.clientY,
                        mode: 'transformer-one',
                        open: true,
                        handle,
                    });

                    collectEntities(new Map([[handle, target]]));

                    return false;
                }
            }

            if (!selectionRectRef.current) {
                return false;
            }

            selectionRectRef.current.setAttr('visible', false);

            return true;
        },
        [collectEntities, openEntityArgsBox, stage, clearTr],
    );

    const onMouseDown = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            const hasPermission = onClickTap(e);

            if (!hasPermission) {
                return;
            }

            const isElement = e.target.findAncestor('.elements-container');
            const isTransformer = e.target.findAncestor('Transformer');

            if (isElement || isTransformer || !stage) {
                return;
            }

            trRef.current?.setAttr('visible', true);

            const pos = stage.getPointerPosition() as Konva.Vector2d;
            const { x, y } = stage.attrs;

            selection.current.visible = true;
            selection.current.x1 = pos.x - x;
            selection.current.y1 = pos.y - y;
            selection.current.x2 = pos.x - x;
            selection.current.y2 = pos.y - y;

            updateSelectionRect(e);
        },
        [onClickTap, updateSelectionRect, stage],
    );

    const onMouseUp = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            try {
                if (!selection.current.visible) {
                    return;
                }

                if (elements.current.length > 0) {
                    selection.current.visible = false;
                    return;
                }

                const selBox = selectionRectRef.current?.getClientRect();

                if (!selBox) {
                    return;
                }

                dxfEditorCache.getStandsAsArray().forEach((entity: Konva.Line) => {
                    if (entity && entity.getAttr('visible')) {
                        const intersected = Konva.Util.haveIntersection(
                            selBox,
                            entity?.getClientRect(),
                        );

                        if (intersected) {
                            elements.current.push(entity);
                        }
                    }
                });

                trCache = elements.current;
                trRef.current?.nodes(elements.current);
                selection.current.visible = false;
                updateSelectionRect(e);

                if (elements.current.length) {
                    const hasOneElement = elements.current.length === 1;

                    openEntityArgsBox({
                        x: e.evt.clientX,
                        y: e.evt.clientY,
                        open: true,
                        mode: hasOneElement ? 'transformer-one' : 'transformer',
                        handle: hasOneElement
                            ? elements.current[0].getAttr('name')
                            : Math.random().toString(),
                    });

                    const preparedEntities = new Map();

                    for (const item of elements.current) {
                        preparedEntities.set(item.getAttr('name'), item);
                    }

                    collectEntities(preparedEntities);
                } else {
                    handleCloseEntityArgsBox();
                }
            } catch (error: any) {
                console.log('Error:', error);
            }
        },
        [collectEntities, handleCloseEntityArgsBox, openEntityArgsBox, updateSelectionRect],
    );

    const onMouseMove = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (!selection.current.visible || !stage) {
                return;
            }

            const pos = stage.getPointerPosition() as Vector2d;
            const { x, y } = stage.attrs;

            selection.current.x2 = pos.x - x;
            selection.current.y2 = pos.y - y;

            updateSelectionRect(e);
        },
        [updateSelectionRect, stage],
    );

    const mergeCacheToTr = useCallback(() => {
        trRef.current?.nodes(trCache);
    }, []);

    return {
        onMouseDown,
        onClickTap,
        onMouseUp,
        trRef,
        selectionRectRef,
        onMouseMove,
        mergeCacheToTr,
        clearTr,
    };
};

export default useSelectArea;
