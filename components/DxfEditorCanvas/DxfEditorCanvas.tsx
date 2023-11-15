import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    forwardRef,
    RefObject,
    memo,
} from 'react';
import { Provider, ReactReduxContext } from 'react-redux';
import { Box } from '@mui/material';
import Konva from 'konva';
import { Image, Layer, Stage, Transformer, Rect, Group } from 'react-konva';
import {
    setStageOptions,
    ZOOM_FACTOR,
    MAX_ZOOM,
    MIN_ZOOM,
    getDxfEditorShowPlaceholderImage,
    getDxfEditorSaveStatus,
} from 'store/dxfEditor';
import { useAppDispatch, useAppSelector } from 'store/store';
import { Point2D } from 'dxf/Common';
import InvalidEntity from 'components/DxfEditor/components/Entities/InvalidEntity';
import { Vector2d } from 'konva/lib/types';
import { changeCursorStyle } from 'utils/helpers/floorplan';
import Layers from './Layers';
import DxfEditorCanvasControls from '../DxfEditorCanvasControls';
import styles from './DxfEditorCanvas.styles';
import Warning from './Warning';
import ZoomControls from './ZoomControls';
import useCaptureWheelFinish from '../../hooks/useCaptureWheelFinish';
import { useDxfEditorContext } from '../DxfEditorModal/DxfEditorContext';

interface DxfEditorCanvasProps {
    stageImage?: HTMLImageElement;
    handleClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * This component will draw the halls or stands to the canvas
 * @param {DxfEditorCanvas} props
 * @param {string} props.stageImage - hall or stand image to show
 * @returns {JSX.Element} FloorPlanCanvas
 */

const DxfEditorCanvas = forwardRef<Konva.Stage, DxfEditorCanvasProps>(
    ({ handleClick, stageImage }, externalRef): JSX.Element => {
        const dispatch = useAppDispatch();
        const showPlaceholderImage = useAppSelector(getDxfEditorShowPlaceholderImage);
        const saveStatus = useAppSelector(getDxfEditorSaveStatus);
        const ref = useRef<HTMLDivElement>(null);
        const stageRef = externalRef as unknown as RefObject<Konva.Stage>;

        const {
            selectArea: {
                mergeCacheToTr,
                onMouseDown,
                onMouseUp,
                onMouseMove,
                trRef,
                selectionRectRef,
            },
            canvasControls,
        } = useDxfEditorContext();

        const [warningBox, setWarningBox] = useState(true);

        const { lastWheelEventTimestampRef, setIsWheeling } = useCaptureWheelFinish(mergeCacheToTr);

        useLayoutEffect(() => {
            const handleResize = () => {
                if (!ref?.current || !stageImage || !stageRef.current) {
                    return;
                }

                const size = {
                    width: ref.current.clientWidth,
                    height: ref.current.clientHeight,
                };

                stageRef.current.setAttrs(size);

                stageRef.current.batchDraw();
            };

            // Debounced render during windows resizing
            window.addEventListener('resize', handleResize);
            handleResize();
            return () => window.removeEventListener('resize', handleResize);
        }, [stageImage, dispatch]);

        const onFitCanvas = useCallback(() => {
            if (!stageImage || !stageRef.current) {
                return;
            }

            const { width, height } = stageRef.current.attrs;
            const minZoomLevel = Math.min(width / stageImage.width, height / stageImage.height);

            const newWidth = width - stageImage.width * minZoomLevel;
            const newHeight = height - stageImage.height * minZoomLevel;

            const position = {
                x: newWidth < 0 ? 0 : newWidth / 2,
                y: newHeight < 0 ? 0 : newHeight / 2,
            };

            dispatch(setStageOptions({ ...position, scale: minZoomLevel }));

            stageRef.current.x(position.x);
            stageRef.current.y(position.y);
            stageRef.current.scale({ x: minZoomLevel, y: minZoomLevel });

            stageRef.current.batchDraw();
        }, [stageImage, dispatch]);

        useEffect(() => {
            if (saveStatus === 'error') {
                onFitCanvas();
            }
        }, [saveStatus, onFitCanvas]);

        // Scale and Locate to fit & center Stage
        useEffect(() => {
            onFitCanvas();
        }, [onFitCanvas]);

        const zoomToPoint = (deltaY: number, pointer: Vector2d) => {
            const stage = stageRef.current as Konva.Stage;
            const oldScale = stage.scaleX();

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };
            const newScale = deltaY > 0 ? oldScale / ZOOM_FACTOR : oldScale * ZOOM_FACTOR;
            const constrainedScale = Math.max(Math.min(newScale, MAX_ZOOM), MIN_ZOOM);

            const newPos = {
                x: pointer.x - mousePointTo.x * constrainedScale,
                y: pointer.y - mousePointTo.y * constrainedScale,
            };

            dispatch(setStageOptions({ ...newPos, scale: newScale }));
            stage.scale({ x: constrainedScale, y: constrainedScale });
            stage.position(newPos);
            stage.batchDraw();
        };

        const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
            e.evt.preventDefault();
            if (canvasControls.selectArea) {
                lastWheelEventTimestampRef.current = Date.now();
                setIsWheeling(true);
                trRef.current?.nodes([]);
            }

            const stage = stageRef.current as Konva.Stage;

            const pointer = stage.getPointerPosition() as Point2D;

            zoomToPoint(e.evt.deltaY, pointer);
        };

        const onHandleZoomLevelChange = (newScale: number) => {
            const stage: any = stageRef.current;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            dispatch(setStageOptions({ ...newPos, scale: newScale }));
            stage.scale({ x: newScale, y: newScale });
            stage.position(newPos);
            stage.batchDraw();
        };

        const onHandleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (canvasControls.selectArea) {
                onMouseDown(e);
            }
        };

        const onHandleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (canvasControls.selectArea) {
                onMouseUp(e);
            }
        };

        const onHandleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (canvasControls.selectArea) {
                onMouseMove(e);
            }
        };

        const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
            const stage = stageRef.current;

            if (!stage) {
                return;
            }

            if (!canvasControls.selectArea) {
                changeCursorStyle(e, 'default');
                return;
            }

            stage.container().style.cursor = 'crosshair';
        };

        const handleDragEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (!canvasControls.selectArea) {
                changeCursorStyle(e, 'initial');
            }
        };

        const handleGotIt = () => {
            setWarningBox(false);
        };

        const MainContent = (
            <>
                {warningBox && <Warning handleGotIt={handleGotIt} />}

                <Box id="dxf-editor" ref={ref} sx={styles.canvasContainer}>
                    <ReactReduxContext.Consumer>
                        {({ store }) => (
                            <Stage
                                ref={stageRef}
                                container={'dxf-editor'}
                                onWheel={handleWheel}
                                onMouseDown={onHandleMouseDown}
                                onMouseUp={onHandleMouseUp}
                                onMouseMove={onHandleMouseMove}
                                draggable={!canvasControls.selectArea}
                                onDragStart={(e) => changeCursorStyle(e, 'grab')}
                                onDragEnd={handleDragEnd}
                                onMouseEnter={handleMouseEnter}
                                onClick={handleClick}
                            >
                                {/* @ts-ignore */}
                                <Provider store={store}>
                                    <Layer id="dxfEditor-main-layer">
                                        <Image image={stageImage} layout="fill" />

                                        <Layers />

                                        {canvasControls.selectArea && (
                                            <>
                                                <Transformer
                                                    id="dxfEditor-transformer"
                                                    ref={trRef}
                                                    boundBoxFunc={(oldBox, newBox) => {
                                                        if (newBox.width < 5 || newBox.height < 5) {
                                                            return oldBox;
                                                        }
                                                        return newBox;
                                                    }}
                                                    rotateEnabled={true}
                                                    shouldOverdrawWholeArea
                                                    onDragStart={(e) =>
                                                        changeCursorStyle(e, 'grab')
                                                    }
                                                    onMouseEnter={(e) =>
                                                        changeCursorStyle(e, 'default')
                                                    }
                                                    onDragEnd={(e) =>
                                                        changeCursorStyle(e, 'default')
                                                    }
                                                    onMouseLeave={(e) => {
                                                        changeCursorStyle(e, 'crosshair');
                                                    }}
                                                />
                                                <Rect ref={selectionRectRef} />
                                            </>
                                        )}
                                        <Group
                                            visible={showPlaceholderImage}
                                            draggable={false}
                                            id="invalid-entities-layer"
                                        >
                                            <InvalidEntity />
                                        </Group>
                                    </Layer>
                                </Provider>
                            </Stage>
                        )}
                    </ReactReduxContext.Consumer>

                    <DxfEditorCanvasControls />
                </Box>

                <Box>
                    <ZoomControls
                        onFitCanvas={onFitCanvas}
                        onHandleZoomLevelChange={onHandleZoomLevelChange}
                    />
                </Box>
            </>
        );

        return <Box sx={styles.root}>{MainContent}</Box>;
    },
);

DxfEditorCanvas.displayName = 'DxfEditorCanvas';

export default memo(DxfEditorCanvas);
