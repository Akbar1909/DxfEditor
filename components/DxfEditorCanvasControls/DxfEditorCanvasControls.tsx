import { FC } from 'react';
import { Stack, IconButton } from '@mui/material';
import HighlightAltOutlinedIcon from '@mui/icons-material/HighlightAltOutlined';
import PanToolIcon from '@mui/icons-material/PanTool';
import Tooltip from 'components/UI/Tooltip';
import { useTranslation } from 'react-i18next';
import styles from './DxfEditorCanvasControls.styles';
import { useDxfEditorContext } from '../DxfEditorModal/DxfEditorContext';
import { DxfEditorMode, updateCanvasControlsState } from '../DxfEditorModal/DxfEditorModal';

const DxfEditorCanvasControls: FC = () => {
    const { t } = useTranslation();

    const {
        setCanvasControls,
        canvasControls,
        selectArea: { clearTr },
        closeEntityArgsBox,
    } = useDxfEditorContext();

    const handleCanvasControls = (mode: keyof DxfEditorMode) => {
        if (mode === 'drag') {
            clearTr();
            closeEntityArgsBox();
        }

        setCanvasControls((prev) => updateCanvasControlsState(prev, mode));
    };

    return (
        <Stack sx={styles.root}>
            <Tooltip text={t('Pan Tool')} arrow placement="left" isDark>
                <IconButton
                    sx={styles.iconButton}
                    onClick={handleCanvasControls.bind(null, 'drag')}
                    children={
                        <PanToolIcon
                            sx={[{ color: '#7D90A7' }, canvasControls.drag && styles.activeStyle]}
                        />
                    }
                />
            </Tooltip>
            <Tooltip text={t('Select area')} arrow placement="left" isDark>
                <IconButton
                    sx={styles.iconButton}
                    onClick={handleCanvasControls.bind(null, 'selectArea')}
                    children={
                        <HighlightAltOutlinedIcon
                            sx={[
                                { color: '#7D90A7' },
                                canvasControls.selectArea && styles.activeStyle,
                            ]}
                        />
                    }
                />
            </Tooltip>
        </Stack>
    );
};

export default DxfEditorCanvasControls;
