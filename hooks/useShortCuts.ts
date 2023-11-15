import { Dispatch, SetStateAction } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { DxfEditorMode } from '../components/DxfEditorModal/DxfEditorModal';

const useShortCuts = (
    setCanvasControls: Dispatch<SetStateAction<DxfEditorMode>>,
    handleDiscardEntityArgsBox: () => void,
) => {
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleWindowKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 's') {
            // Prevent the Save dialog to open
            e.preventDefault();

            setCanvasControls((prev) => {
                if (!prev.selectArea) {
                    enqueueSnackbar(t('Select area mode is on'), { variant: 'info' });
                } else {
                    enqueueSnackbar(t('Select area mode is off'), { variant: 'warning' });
                }

                return { ...prev, selectArea: !prev.selectArea };
            });

            handleDiscardEntityArgsBox();
        }

        if (e.ctrlKey && e.key === 'x') {
            e.preventDefault();

            handleDiscardEntityArgsBox();
        }
    };

    // useEffect(() => {
    //     window.addEventListener('keydown', handleWindowKeyDown);

    //     return () => {
    //         window.removeEventListener('keydown', handleWindowKeyDown);
    //     };
    // }, []);
};

export default useShortCuts;
