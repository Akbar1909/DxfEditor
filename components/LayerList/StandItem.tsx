import { FC, useRef, memo, SyntheticEvent, useState, ChangeEvent } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Stack, useTheme } from '@mui/material';
import { Checkbox, TextField } from 'components/UI';
import { getDxfEditorTextEntity } from 'store/dxfEditor';
import { useFormContext, Controller } from 'react-hook-form';
import { useAppSelector } from 'store/store';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import AlertDialog from 'components/UI/AlertDialog';
import { useTranslation } from 'react-i18next';
import {
    createSelectFieldName,
    createFieldName,
    createVisibilityFieldName,
} from '../../helpers/form';
import { standItemStyles as styles } from './Layer.styles';
import { useDxfEditorContext } from '../DxfEditorModal/DxfEditorContext';
import { activateStand, warnStand } from '../../helpers/canvas';
import dxfEditorCache from '../../helpers/cache';

interface IStandItemProps {
    handle: string;
    lastItem: boolean;
}

/**
 * StandItem
 * @param {Object} props - data passed to the component
 * @param {Object} props.handle - textEntity handle
 * @returns {JSX.Element} - StandItem
 */

const StandItem: FC<IStandItemProps> = memo(({ handle, lastItem }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const standRef = useRef<HTMLDivElement | null>(null);
    const [deleteAlertDialog, setDeleteAlertDialog] = useState(false);
    const { layer, highLighted, ...textEntityFullInfo } = useAppSelector((store) =>
        getDxfEditorTextEntity(store, { handle }),
    );
    const { control, setValue, watch } = useFormContext();

    const fieldName = createFieldName(layer, handle);
    const selectFieldName = createSelectFieldName(layer, handle);
    const visibilityFieldName = createVisibilityFieldName(layer, handle);

    const visible = watch(visibilityFieldName);

    const {
        highlightEntity,
        handleDeleteEntity,
        resetPreActiveEntity,
        handleSelectEntity,
        toggleEntity,
        checkModeRestriction,
        canvasControls: { selectArea },
    } = useDxfEditorContext();

    const handleFocus = () => {
        const hasPermission = checkModeRestriction();

        if (!hasPermission) {
            return;
        }

        highlightEntity(textEntityFullInfo.stand);
    };

    const handleBlur = () => {
        resetPreActiveEntity();
    };

    const handleDeleteStand = () => {
        const hasPermission = checkModeRestriction();

        if (!hasPermission) {
            return;
        }

        toggleDeleteAlert();
        handleDeleteEntity(textEntityFullInfo.stand);
    };

    const EyeIcon = visible ? VisibilityIcon : VisibilityOffIcon;

    const handleVisibility = () => {
        const hasPermission = checkModeRestriction();

        if (!hasPermission) {
            return;
        }

        setValue(visibilityFieldName, !visible);
        toggleEntity(textEntityFullInfo.stand);
    };

    const toggleDeleteAlert = () => {
        const hasPermission = checkModeRestriction();

        if (!deleteAlertDialog && !hasPermission) {
            return;
        }

        setDeleteAlertDialog(!deleteAlertDialog);
    };

    return (
        <>
            <Box
                sx={[
                    styles.root,
                    Boolean(highLighted) && styles.selectedStyle,
                    lastItem && { borderBottom: 'none' },
                ]}
                id={handle}
                ref={standRef}
            >
                <Stack flex={1} mr="16px" direction="row" columnGap="8px" alignItems="center">
                    <Box sx={styles.checkboxContainer}>
                        <Controller
                            control={control}
                            name={selectFieldName}
                            render={({ field }) => (
                                <Checkbox
                                    {...field}
                                    onChange={(e: SyntheticEvent<Element, Event>) => {
                                        // @ts-ignore
                                        setValue(selectFieldName, e.target.checked);
                                        handleSelectEntity(textEntityFullInfo.stand);
                                    }}
                                    checked={field.value}
                                    sx={{ mx: '0px' }}
                                />
                            )}
                        />
                    </Box>

                    <Controller
                        control={control}
                        name={fieldName}
                        render={({ field: { onBlur, ...rest } }) => (
                            <TextField
                                onFocus={handleFocus}
                                error={!rest.value}
                                {...rest}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    if (selectArea) {
                                        return;
                                    }

                                    const activeEntity = dxfEditorCache.getEntity(
                                        textEntityFullInfo.stand,
                                    );
                                    if (activeEntity) {
                                        activeEntity.setAttr('standId', e.target.value);

                                        if (!e.target.value) {
                                            warnStand(activeEntity);
                                        } else {
                                            activateStand(activeEntity);
                                        }
                                    }

                                    rest.onChange(e);
                                }}
                                onBlur={() => {
                                    onBlur();
                                    handleBlur();
                                }}
                            />
                        )}
                    />
                </Stack>

                <Stack direction="row" alignItems="center" columnGap="16px" sx={styles.actions}>
                    <IconButton
                        onClick={handleVisibility}
                        children={
                            <EyeIcon
                                sx={{
                                    color: 'colors.iconGrey' || '#7D90A7',
                                }}
                            />
                        }
                    />

                    <IconButton
                        onClick={toggleDeleteAlert}
                        children={
                            <DeleteIcon sx={{ color: 'colors.statusCancelled' || '#FB4A59' }} />
                        }
                    />
                </Stack>
            </Box>

            {deleteAlertDialog && (
                <AlertDialog
                    open={deleteAlertDialog}
                    handleCancel={toggleDeleteAlert}
                    handleConfirm={handleDeleteStand}
                    title={t('Stand will be deleted')}
                    subtitle={t('Are you sure you want to delete the stand')}
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

StandItem.displayName = 'StandItem';

StandItem.propTypes = {
    handle: PropTypes.string.isRequired,
    lastItem: PropTypes.bool.isRequired,
};

export default StandItem;
