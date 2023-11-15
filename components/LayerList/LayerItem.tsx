import { FC, memo, MouseEvent, useRef, useState, useLayoutEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    IconButton,
    useTheme,
    Stack,
} from '@mui/material';
import Tooltip from 'components/UI/Tooltip';
import FolderIcon from '@mui/icons-material/Folder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Checkbox } from 'components/UI';
import { useAppDispatch, useAppSelector } from 'store/store';
import {
    getDxfEditorLayerByName,
    toggleLayerAccordion,
    LAYER_WITH_STAND_IDS_PREFIX,
    LAYER_WITH_UNSUPPORTED_ELEMENTS,
    togglePlaceholderImage,
    getDxfEditorShowPlaceholderImage,
} from 'store/dxfEditor';
import AlertDialog from 'components/UI/AlertDialog';
import { useTranslation } from 'react-i18next';
import WarningSvg from 'components/UI/icons/WarningSvg';
import StandList from './StandList';
import { layerListStyles as styles } from './Layer.styles';
import { useDxfEditorContext } from '../DxfEditorModal/DxfEditorContext';

interface ILayerItemProps {
    layerName: string;
    hasEmptyField: boolean;
    height: number;
}

/**
 * LayerItem
 * @param {Object} props - data passed to the component
 * @param {string} props.layerName - used to get layer full information
 * @param {boolean} props.hasEmptyField - checks that all stands of the layer have an id
 * @param {number} props.height - height of the card content
 * @returns {JSX.Element} - LayerItem
 */

const LayerItem: FC<ILayerItemProps> = memo(({ layerName, hasEmptyField, height }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const layer = useAppSelector((store) => getDxfEditorLayerByName(store, layerName));
    const showPlaceholderImage = useAppSelector(getDxfEditorShowPlaceholderImage);
    const [collapseHeaderHeight, setCollapseHeaderHeight] = useState(0);
    const {
        whiteList,
        toggleTrVisibility,
        handleDeleteInvalidEntitiesLayer,
        updateDeletedLayersList,
        deletedLayers,
        ...actions
    } = useDxfEditorContext();
    const layerItemRef = useRef<HTMLDivElement | null>(null);
    const [deleteAlertDialog, setDeleteAlertDialog] = useState(false);

    const formattedName = String(layerName).toLowerCase().trim();
    const isUnsupportedElementsLayer = layer.options.name === LAYER_WITH_UNSUPPORTED_ELEMENTS;

    const listFixedHeight = useMemo(
        () =>
            // eslint-disable-next-line operator-linebreak
            height -
            (deletedLayers?.[LAYER_WITH_UNSUPPORTED_ELEMENTS] ? 1 : 2) * collapseHeaderHeight,
        [height, collapseHeaderHeight, deletedLayers],
    );

    const expanded = Boolean(layer.expanded);

    const allSelected = useMemo(() => {
        for (const [, value] of whiteList) {
            if (!value.selected) {
                return false;
            }
        }

        return true;
    }, [whiteList]);

    const atLeastOneSelected = useMemo(() => {
        if (whiteList.size === 0) {
            return true;
        }

        for (const [, value] of whiteList) {
            if (value.selected) {
                return true;
            }
        }

        return false;
    }, [whiteList]);

    const hasExpandedIcon = formattedName.includes(LAYER_WITH_STAND_IDS_PREFIX);

    const handleCheckboxChange = () => {
        actions.handleEntitiesArgsChanges(!allSelected ? 'select-all' : 'unselect-all');
    };

    const handleAccordionChange = () => {
        dispatch(toggleLayerAccordion(layerName));
    };

    const handleDeleteLayer = () => {
        updateDeletedLayersList(layer.options.name);
        handleDeleteInvalidEntitiesLayer();
        toggleTrVisibility('hide');
        handleCancelDeleteAlert();
    };

    const handleLayerVisibility = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        dispatch(togglePlaceholderImage());
    };

    const handleCancelDeleteAlert = () => setDeleteAlertDialog(false);

    const handleOpenDeleteAlert = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        setDeleteAlertDialog(true);
    };

    const EyeIcon = showPlaceholderImage ? VisibilityIcon : VisibilityOffIcon;

    useLayoutEffect(() => {
        if (!layerItemRef.current) {
            return;
        }

        setCollapseHeaderHeight(layerItemRef.current.children[0].clientHeight);
    }, []);

    return (
        <>
            <Accordion
                ref={layerItemRef}
                expanded={expanded}
                sx={[
                    styles.root,
                    expanded && {
                        '&&&.MuiPaper-root': {
                            borderBottomRightRadius: '0px',
                            borderBottomLeftRadius: '0px',
                        },
                    },
                ]}
                onChange={handleAccordionChange}
                TransitionProps={{ unmountOnExit: true }}
            >
                <AccordionSummary
                    aria-controls="panel1a-content"
                    sx={[
                        styles.summary,
                        isUnsupportedElementsLayer && {
                            pointerEvents: 'none',
                        },
                        expanded && {
                            backgroundColor: 'rgba(57, 163, 219, 0.1)',
                            borderBottomRightRadius: '0px',
                            borderBottomLeftRadius: '0px',
                        },
                    ]}
                >
                    <Stack sx={styles.nameBlock} columnGap={'8px'} direction="row">
                        {isUnsupportedElementsLayer && (
                            <Tooltip
                                isDark
                                arrow
                                text={t(
                                    'Items that are not supported will not be saved and will be excluded',
                                )}
                                placement="top-start"
                            >
                                <Box display="flex">
                                    <WarningSvg
                                        pointerEvents="auto"
                                        fill={theme.palette.colors.statusPending || '#FB4A59'}
                                    />
                                </Box>
                            </Tooltip>
                        )}

                        {!isUnsupportedElementsLayer && (
                            <Box sx={styles.checkboxContainer}>
                                <Checkbox
                                    indeterminate={!allSelected}
                                    checked={atLeastOneSelected}
                                    onChange={handleCheckboxChange}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Box>
                        )}
                        {hasExpandedIcon && (
                            <FolderIcon sx={{ color: 'colors.iconGrey' || '#7D90A7' }} />
                        )}

                        {hasEmptyField && !isUnsupportedElementsLayer && (
                            <Tooltip
                                text={t('This layer have stand without name')}
                                arrow
                                placement="bottom"
                                isDark
                            >
                                <Box display="flex">
                                    <WarningSvg
                                        fill={theme.palette.colors.statusCancelled || '#FB4A59'}
                                    />
                                </Box>
                            </Tooltip>
                        )}
                        <Typography sx={{ mr: 1 }} variant="h4">
                            {layer.options?.displayName}
                        </Typography>

                        {hasExpandedIcon && (
                            <IconButton
                                sx={styles.toggleIconButton}
                                children={
                                    <KeyboardArrowRightIcon
                                        sx={[
                                            styles.icon,
                                            expanded && { transform: 'rotateZ(90deg)' },
                                        ]}
                                    />
                                }
                            />
                        )}
                    </Stack>
                    {isUnsupportedElementsLayer && (
                        <Stack
                            columnGap="16px"
                            direction="row"
                            alignItems="center"
                            sx={styles.actions}
                        >
                            <IconButton
                                onClick={handleLayerVisibility}
                                children={
                                    <EyeIcon
                                        sx={{
                                            pointerEvents: 'auto',
                                            color: 'colors.iconGrey' || '#7D90A7',
                                        }}
                                    />
                                }
                            />

                            <IconButton
                                onClick={handleOpenDeleteAlert}
                                children={
                                    <DeleteIcon
                                        sx={{
                                            pointerEvents: 'auto',
                                            color: 'colors.statusCancelled' || '#FB4A59',
                                        }}
                                    />
                                }
                            />
                        </Stack>
                    )}
                </AccordionSummary>
                {!isUnsupportedElementsLayer && (
                    <AccordionDetails sx={styles.accordionDetails}>
                        <StandList listFixedHeight={listFixedHeight} layerName={layerName} />
                    </AccordionDetails>
                )}
            </Accordion>
            {deleteAlertDialog && (
                <AlertDialog
                    open={deleteAlertDialog}
                    handleCancel={handleCancelDeleteAlert}
                    handleConfirm={handleDeleteLayer}
                    title={t('Unsupported elements will be removed')}
                    subtitle={t('Are you sure you want to delete the unsupported elements')}
                    cancelText={t('Cancel')}
                    confirmText={t('Delete')}
                    color={theme.palette.colors.statusCancelled}
                    alertIcon={<DeleteIcon />}
                    contentSx={{ width: '424px' }}
                />
            )}
        </>
    );
});

LayerItem.displayName = 'LayerItem';

LayerItem.propTypes = {
    layerName: PropTypes.string.isRequired,
    hasEmptyField: PropTypes.bool.isRequired,
    height: PropTypes.number.isRequired,
};

export default LayerItem;
