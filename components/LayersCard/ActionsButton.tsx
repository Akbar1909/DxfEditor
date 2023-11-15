import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Menu, MenuItem, Typography, MenuProps, SxProps, useTheme } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AlertDialog from 'components/UI/AlertDialog';
import WarningIcon from '@mui/icons-material/Warning';
import { useDxfEditorContext } from '../DxfEditorModal/DxfEditorContext';

const styles = {
    root: {
        backgroundColor: 'colors.statusNeutralLight',
        color: 'colors.textPrimary',
        borderRadius: '3px',
        width: 42,
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuPaper: {
        '&.MuiPaper-rounded': {
            borderRadius: '5px',
        },
        '& .MuiMenuItem-root+.MuiDivider-root': {
            my: 0,
        },
    },
    menuItem: {
        px: 2,
        py: 1.25,
    },
};

const menuProps: Partial<MenuProps> = {
    MenuListProps: {
        'aria-labelledby': 'hall-setting-button',
    },
    PaperProps: {
        sx: styles.menuPaper,
    },
    anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
    },
    transformOrigin: {
        vertical: 'top',
        horizontal: 'right',
    },
};

enum LayerActionTypes {
    SHOW_STANDS_WITHOUT_ID = 'showStandsWithoutId',
    HIDE_SELECTED_ENTITIES = 'hideSelectedEntities',
    SHOW_SELECTED_ENTITIES = 'showSelectedEntities',
    EDIT_SELECTED_ENTITIES = 'editSelectedEntities',
    DELETE_SELECTED_ENTITIES = 'deleteSelectedEntities',
}

const ActionsButton = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const {
        handleEntitiesEdit,
        handleEntitiesArgsChanges,
        whiteList,
        checkModeRestriction,
        deleteSelectedStands,
    } = useDxfEditorContext();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteAlertDialog, setDeleteAlertDialog] = useState(false);
    const open = Boolean(anchorEl);

    const allVisible = useMemo(() => {
        for (const value of whiteList.values()) {
            if (!value.visible) {
                return false;
            }
        }

        return true;
    }, [whiteList]);

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleOpenMenu = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleEdit = (e: MouseEvent) => {
        handleEntitiesEdit(e);
        handleCloseMenu();
    };

    const handleMenuItemClick = (action: string, e: any) => {
        const hasPermission = checkModeRestriction();

        if (!hasPermission) {
            return;
        }

        switch (action) {
            case LayerActionTypes.EDIT_SELECTED_ENTITIES:
                handleEdit(e);
                break;
            case LayerActionTypes.DELETE_SELECTED_ENTITIES:
                handleOpenDeleteAlert();
                break;
            case LayerActionTypes.HIDE_SELECTED_ENTITIES:
                handleEntitiesArgsChanges('hide-all');
                break;
            case LayerActionTypes.SHOW_SELECTED_ENTITIES:
                handleEntitiesArgsChanges('show-all');
                break;
            default:
                break;
        }
    };

    const menuItems: Array<{ label: string; sx?: SxProps; action: string }> = [
        {
            label: !allVisible ? t('Show selected stands') : t('Hide selected stands'),
            action: !allVisible
                ? LayerActionTypes.SHOW_SELECTED_ENTITIES
                : LayerActionTypes.HIDE_SELECTED_ENTITIES,
        },
        {
            label: t('Edit selected stands'),
            action: LayerActionTypes.EDIT_SELECTED_ENTITIES,
        },
        {
            label: t('Delete selected stands'),
            action: LayerActionTypes.DELETE_SELECTED_ENTITIES,
            sx: {
                color: 'colors.statusCancelled',
            },
        },
    ];

    const toggleDeleteAlert = () => {
        const hasPermission = checkModeRestriction();

        if (!deleteAlertDialog && !hasPermission) {
            return;
        }

        setDeleteAlertDialog(!deleteAlertDialog);
    };

    const handleOpenDeleteAlert = () => {
        toggleDeleteAlert();
    };

    const handleSelectedStands = () => {
        deleteSelectedStands();
        toggleDeleteAlert();
        setAnchorEl(null);
    };

    return (
        <>
            <Box sx={[styles.root, { cursor: 'pointer' }]} onClick={handleOpenMenu}>
                <MoreHorizIcon />
            </Box>
            <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu} {...menuProps}>
                {menuItems.map((menuItem, i) => (
                    <MenuItem
                        sx={styles.menuItem}
                        key={i}
                        // @ts-ignore
                        onClick={handleMenuItemClick.bind(null, menuItem.action)}
                    >
                        <Typography sx={menuItem.sx} variant="body2" children={menuItem.label} />
                    </MenuItem>
                ))}
            </Menu>

            {deleteAlertDialog && (
                <AlertDialog
                    open={deleteAlertDialog}
                    handleCancel={toggleDeleteAlert}
                    handleConfirm={handleSelectedStands}
                    title={t('All selected stands will be removed')}
                    subtitle={t('Are you sure you want to remove all selected stand')}
                    cancelText={t('Cancel')}
                    confirmText={t('Delete')}
                    color={theme.palette.colors.statusPending}
                    alertIcon={<WarningIcon />}
                />
            )}
        </>
    );
};

export default ActionsButton;
