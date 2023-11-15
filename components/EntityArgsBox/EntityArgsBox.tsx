import { ChangeEvent, FC, memo, useState, useMemo } from 'react';
import { Box, Stack, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import TextField from 'components/UI/TextField';
import ColorPicker from 'components/floorplan/ColorPicker';
import { ColorResult } from 'react-color';
import { Button, Counter } from 'components/UI';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LineWeightIcon from '@mui/icons-material/LineWeight';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import { hexToRGB, rgbToHex } from 'components/DxfEditor/helpers/color';
import { DEFAULT_SHAPE_COLOR_OBJECT } from 'store/floorplan/floorplan.constants';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import WarningIcon from '@mui/icons-material/Warning';
import AlertDialog from 'components/UI/AlertDialog';
import dxfEditorCache from 'components/DxfEditor/helpers/cache';
import { warnStand } from 'components/DxfEditor/helpers/canvas';
import { DXF_EDITOR_COLORS } from 'store/dxfEditor';
import UndoIcon from '@mui/icons-material/Undo';
import { createFieldName } from 'components/DxfEditor/helpers/form';
import useDrag from 'hooks/useDrag';
import styles from './EntityArgsBox.styles';
import Header from './Header';

interface IEntityArgsBoxProps {
    values: {
        id: string;
        fillColor: string;
        strokeColor: string;
        strokeWidth: number;
    };
    x: number;
    y: number;
    handleDiscard: () => void;
    handleChanges: ({ name, value }: { name: string; value: string }) => void;
    handleSave: () => void;
    isBulkEdit?: boolean;
    handleEntityArgBoxHide: (action?: 'show' | 'hide') => void;
    handleEntityArgBoxDelete: () => void;
    stand: string;
    handleOnlyClose: () => void;
}

const prepareColor = (value: string) => {
    if (!value) {
        return DEFAULT_SHAPE_COLOR_OBJECT;
    }

    return hexToRGB(value).obj;
};

/**
 * EntityArgsBox component is used to edit entity attributes (fillColor,strokeColor,strokeWidth)
 * @param {Object} props - data passed to the component
 * @param {number} props.x - x position of the card
 * @param {number} props.y - y position of the card
 * @param {Object} props.values - default values for the current entity
 * @param {function} props.handleDiscard - to close the card, all changes is discarded
 * @param {function} props.handleChanges - the controller of the fields
 * @param {function} props.handleSave - to save all changes
 * @param {boolean} [props.isBulkEdit=false] - if it is true, the card doesn't include id field
 * @param {function} props.handleEntityArgBoxHide- handler of hide button
 * @param {function} props.handleEntityArgBoxDelete - handler of delete button
 * @param {string} props.stand - click stand id (handle)
 * @param {func} props.handleOnlyClose - to close the entity args box
 * @returns {JSX.Element} - EntityArgsBox
 */

const EntityArgsBox: FC<IEntityArgsBoxProps> = memo(
    ({
        x,
        y,
        values,
        handleChanges,
        handleDiscard,
        isBulkEdit = false,
        handleEntityArgBoxHide,
        handleEntityArgBoxDelete,
        stand,
        handleOnlyClose,
    }) => {
        const { t } = useTranslation();
        const theme = useTheme();
        const [touched, setTouched] = useState(false);
        const [visible, setVisible] = useState(false);
        const { control, getValues } = useFormContext();
        const [deleteAlertDialog, setDeleteAlertDialog] = useState(false);

        const { draggableElRef, onHandleDragMouseDown, style } = useDrag<HTMLDivElement>({
            top: y,
            left: x,
        });

        const { fieldName } = useMemo(() => {
            if (!isBulkEdit) {
                const entity = dxfEditorCache.getEntity(stand);

                if (!entity) {
                    return {
                        fieldName: '',
                        handle: '',
                    };
                }

                const { textHandle = '', textLayer = '', name = '' } = entity.getAttrs();

                return {
                    fieldName: createFieldName(textLayer, textHandle),
                    handle: name,
                };
            }

            return {
                fieldName: '',
                handle: '',
            };
        }, [isBulkEdit, stand]);

        const handleChange = (name: string, e: ColorResult) => {
            setTouched(true);
            const { rgb } = e;

            const value = rgbToHex(rgb);

            handleChanges({ name, value });
        };

        const handleInputChange = ({ target: { value, name } }: ChangeEvent<HTMLInputElement>) => {
            setTouched(true);
            handleChanges({ name, value });
        };

        const toggleDeleteAlert = () => setDeleteAlertDialog(!deleteAlertDialog);

        const handleVisibility = () => {
            setVisible(!visible);

            setTouched(true);

            handleEntityArgBoxHide(!visible ? 'hide' : 'show');
        };

        const EyeIcon = !visible ? VisibilityIcon : VisibilityOffIcon;

        return (
            <>
                <Box
                    ref={draggableElRef}
                    sx={[
                        styles.root,
                        {
                            position: 'fixed',
                            top: 'var(--drag-top)',
                            left: 'var(--drag-left)',
                            zIndex: 10000,
                        },
                    ]}
                    data-testid="drag-wrapper"
                    className="drag-wrapper"
                >
                    <Header
                        onHandleDragMouseDown={onHandleDragMouseDown}
                        onClose={handleOnlyClose}
                    />
                    <Stack sx={styles.content} rowGap="8px">
                        {!isBulkEdit && (
                            <Box>
                                <Controller
                                    control={control}
                                    name={fieldName}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            value={getValues(fieldName)}
                                            error={!field.value}
                                            sx={{ width: '100%' }}
                                            label="ID"
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                setTouched(true);

                                                const activeEntity =
                                                    dxfEditorCache.getEntity(stand);
                                                if (activeEntity) {
                                                    activeEntity.setAttr('standId', e.target.value);

                                                    if (!e.target.value) {
                                                        warnStand(activeEntity);
                                                        handleChanges({
                                                            name: 'fillColor',
                                                            // eslint-disable-next-line max-len
                                                            value: DXF_EDITOR_COLORS.STAND_WITHOUT_ID_FILL.slice(
                                                                1,
                                                            ),
                                                        });
                                                        handleChanges({
                                                            name: 'strokeColor',
                                                            // eslint-disable-next-line max-len
                                                            value: DXF_EDITOR_COLORS.STAND_WITHOUT_ID_STROKE.slice(
                                                                1,
                                                            ),
                                                        });
                                                    } else {
                                                        const { realFill = '', realStroke = '' } =
                                                            activeEntity.getAttrs();

                                                        activeEntity.setAttrs({
                                                            fill: realFill,
                                                            stroke: realStroke,
                                                        });

                                                        handleChanges({
                                                            name: 'fillColor',
                                                            value: realFill.slice(1),
                                                        });
                                                        handleChanges({
                                                            name: 'strokeColor',
                                                            value: realStroke.slice(1),
                                                        });
                                                    }
                                                }

                                                field.onChange(e);
                                            }}
                                        />
                                    )}
                                />
                            </Box>
                        )}
                        <Stack direction="row" alignItems="end" columnGap="8px">
                            <TextField
                                name="fillColor"
                                value={values.fillColor}
                                label="Fill color"
                                InputProps={{
                                    startAdornment: '#',
                                    endAdornment: (
                                        <FormatColorFillIcon sx={{ marginRight: '8px' }} />
                                    ),
                                }}
                                sx={{ flex: 1 }}
                                onChange={handleInputChange}
                                maxLength={8}
                            />
                            <ColorPicker
                                shape="circle"
                                // @ts-ignore
                                onChange={handleChange.bind(null, 'fillColor')}
                                color={prepareColor(values.fillColor)}
                                popoverSx={{ left: '100%', top: '100%' }}
                            />
                        </Stack>
                        <Stack direction="row" alignItems="end" columnGap="8px">
                            <TextField
                                name="strokeColor"
                                value={values.strokeColor}
                                label="Stroke color"
                                InputProps={{
                                    startAdornment: '#',
                                    endAdornment: (
                                        <FormatColorFillIcon sx={{ marginRight: '8px' }} />
                                    ),
                                }}
                                sx={{ flex: 1 }}
                                onChange={handleInputChange}
                                maxLength={8}
                            />
                            <ColorPicker
                                shape="circle"
                                // @ts-ignore
                                onChange={handleChange.bind(null, 'strokeColor')}
                                color={prepareColor(values.strokeColor)}
                                popoverSx={{ left: '100%', top: '100%' }}
                            />
                        </Stack>
                        <Box>
                            <Counter
                                value={values.strokeWidth}
                                StartIcon={<LineWeightIcon />}
                                sx={{ width: '96px' }}
                                onChange={(e) => {
                                    setTouched(true);
                                    handleChanges({ name: 'strokeWidth', value: e });
                                }}
                                label={t('Thickness')}
                                min={0}
                                key={Date.now()}
                            />
                        </Box>
                    </Stack>

                    <Stack direction="row" columnGap={'8px'} alignItems="center" p="16px">
                        <Button
                            onClick={handleDiscard}
                            sx={[styles.cancelButton, styles.button]}
                            icon={<UndoIcon sx={{ width: '18px', height: '18px' }} />}
                            buttonText="Discard"
                            size="large"
                            disabled={!touched}
                        />
                        <Button
                            sx={[styles.hideButton, styles.button]}
                            onClick={handleVisibility}
                            size="large"
                            icon={
                                <EyeIcon
                                    fontSize="small"
                                    sx={{
                                        color: 'colors.iconGrey' || '#7D90A7',
                                        width: '18px',
                                        height: '18px',
                                    }}
                                />
                            }
                            buttonText={t('Hide stand')}
                        />
                    </Stack>

                    <style>{`body { cursor: ${style.cursor}; --drag-left: ${style.left}; --drag-top: ${style.top}; } `}</style>
                </Box>

                {deleteAlertDialog && (
                    <AlertDialog
                        open={deleteAlertDialog}
                        handleCancel={toggleDeleteAlert}
                        handleConfirm={handleEntityArgBoxDelete}
                        title={
                            isBulkEdit ? t('Stands will be removed') : t('Stand will be removed')
                        }
                        subtitle={
                            isBulkEdit
                                ? t('Are you sure you want to remove the stands')
                                : t('Are you sure you want to remove the stand')
                        }
                        cancelText={t('Cancel')}
                        confirmText={t('Delete')}
                        color={theme.palette.colors.statusPending}
                        alertIcon={<WarningIcon />}
                    />
                )}
            </>
        );
    },
);

EntityArgsBox.displayName = 'EntityArgsBox';

EntityArgsBox.propTypes = {
    values: PropTypes.shape({
        id: PropTypes.string.isRequired,
        fillColor: PropTypes.string.isRequired,
        strokeColor: PropTypes.string.isRequired,
        strokeWidth: PropTypes.number.isRequired,
    }).isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    handleDiscard: PropTypes.func.isRequired,
    handleChanges: PropTypes.func.isRequired,
    handleSave: PropTypes.func.isRequired,
    isBulkEdit: PropTypes.bool,
    handleEntityArgBoxHide: PropTypes.func.isRequired,
    stand: PropTypes.string.isRequired,
};

export default EntityArgsBox;
