import { ChangeEvent, useRef, useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import PrimaryButton from 'components/UI/PrimaryButton';
import { useAppDispatch, useAppSelector } from 'store/store';
import { getDxfEditorStatus, uploadDxfFile } from 'store/dxfEditor';
import AlertDialog from 'components/UI/AlertDialog';
import WarningIcon from '@mui/icons-material/Warning';

/**
 * FileUploaderButton
 * @description render button which serve as a input[type="file"]
 * @returns {JSX.Element}
 */

const FileUploaderButton = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const dxfStatus = useAppSelector(getDxfEditorStatus);
    const inputRef = useRef<HTMLInputElement>(null);

    const [openAlert, setOpenAlert] = useState(false);

    const onHandleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;

        if (files) {
            dispatch(uploadDxfFile(files[0]));
        }
    };

    const handleOpenAlert = () => setOpenAlert(!openAlert);

    const handleInputClick = () => {
        inputRef.current?.click();
    };

    useEffect(() => {
        if (dxfStatus === 'idle' && inputRef.current) {
            inputRef.current.value = '';
        }
    }, [dxfStatus]);

    return (
        <>
            <PrimaryButton
                bgcolor={theme.palette.colors.adminBrand2}
                sx={{ height: '32px', cursor: 'pointer' }}
                children={t('Upload DXF')}
                startIcon={<CloudDownloadOutlinedIcon />}
                onClick={handleInputClick}
            />
            <input ref={inputRef} accept=".dxf" type="file" onChange={onHandleFileChange} hidden />
            <AlertDialog
                open={openAlert}
                handleCancel={handleOpenAlert}
                handleConfirm={() => inputRef.current?.click()}
                title={t('All stands will be removed')}
                subtitle={t(
                    'Are you sure you want to upload a new file? All stands that already created for this hall will be deleted.',
                )}
                cancelText={t('Cancel')}
                confirmText={t('Upload')}
                color={theme.palette.colors.statusPending}
                alertIcon={<WarningIcon />}
                renderConfirm={(btn) => (
                    <>
                        {btn}
                        <input ref={inputRef} type="file" onChange={onHandleFileChange} hidden />
                    </>
                )}
            />
        </>
    );
};

export default FileUploaderButton;
