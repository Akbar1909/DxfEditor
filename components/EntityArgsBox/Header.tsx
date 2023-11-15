import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import useDrag from 'hooks/useDrag';
import styles from './EntityArgsBox.styles';

interface ITempHeader {
    onHandleDragMouseDown: ReturnType<typeof useDrag>['onHandleDragMouseDown'];
    onClose: () => void;
}

const Header: FC<ITempHeader> = ({ onClose, onHandleDragMouseDown }) => {
    const { t } = useTranslation();

    return (
        <Box onMouseDown={onHandleDragMouseDown}>
            <Box sx={styles.snackBar} />
            <Box sx={styles.header}>
                <DragIndicatorIcon sx={{ p: '0px', color: 'colors.iconGrey' || '#7D90A7' }} />
                <Typography variant="h4" children={t('Edit')} />
                <IconButton
                    sx={{ ml: 'auto', p: 0 }}
                    children={
                        <CloseIcon
                            sx={{
                                color: 'colors.textPrimary' || '#333645',
                            }}
                        />
                    }
                    onClick={onClose}
                />
            </Box>
        </Box>
    );
};

export default memo(Header);
