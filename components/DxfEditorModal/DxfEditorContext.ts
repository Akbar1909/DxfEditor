import { Dispatch, SetStateAction, createContext, useContext } from 'react';
import Konva from 'konva';
import useSelectArea from 'components/DxfEditor/hooks/useSelectArea';
import { ToggleEntitiesVisibilityModeType } from '../../helpers/canvas';
import useEntityArgsBox, { EntityArgsType } from '../../hooks/useEntityArgsBox';

interface IDxfEditorContext {
    canvasControls: {
        selectArea: boolean;
        drag: boolean;
    };
    highlightEntity: (handle: string) => void;
    handleEntitiesEdit: (e: MouseEvent) => void;
    handleDeleteEntity: (handle: string) => void;
    resetPreActiveEntity: () => void;
    handleSelectEntity: (handle: string) => void;
    toggleEntity: (handle: string) => void;
    handleEntitiesArgsChanges: (
        mode: ToggleEntitiesVisibilityModeType,
        selectArea?: boolean,
    ) => void;
    listRef: any;
    setEntityArgBoxController: Dispatch<SetStateAction<EntityArgsType>>;
    count: number;
    whiteList: Map<string, { layer: string; handle: string; visible: boolean; selected: boolean }>;
    toggleTrVisibility: (action: 'show' | 'hide') => void;
    checkModeRestriction: () => boolean;
    activeEntity: Konva.Line | null;
    deleteSelectedStands: () => void;
    openEntityArgsBox: ReturnType<typeof useEntityArgsBox>['openEntityArgsBox'];
    handleDeleteInvalidEntitiesLayer: () => void;
    updateDeletedLayersList: (layerName: string) => void;
    deletedLayers: Record<string, boolean>;
    setCanvasControls: Dispatch<SetStateAction<{ selectArea: boolean; drag: boolean }>>;
    selectArea: Pick<
        ReturnType<typeof useSelectArea>,
        | 'mergeCacheToTr'
        | 'onClickTap'
        | 'onMouseDown'
        | 'onMouseMove'
        | 'onMouseUp'
        | 'trRef'
        | 'selectionRectRef'
        | 'clearTr'
    >;
    closeEntityArgsBox: ReturnType<typeof useEntityArgsBox>['handleOnlyClose'];
}

// @ts-ignore
const DxfEditorContext = createContext<IDxfEditorContext>({});

const useDxfEditorContext = () => useContext(DxfEditorContext);

export { useDxfEditorContext };

export default DxfEditorContext;
