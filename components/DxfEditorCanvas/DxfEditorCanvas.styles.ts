import { Theme } from '@mui/material';

const styles = {
    root: {
        width: '100%',
        position: 'relative',
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pb: '27.5px',
        px: 3,
        pt: 3,
        boxShadow: '0px 3.80337px 11.4101px rgba(0, 24, 71, 0.05)',
        borderRadius: '12px',
    },
    canvasContainer: {
        position: 'relative',
        '& .konvajs-content': {
            width: '100% !important',
        },
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        border: '1px solid transparent',
        borderColor: (theme: Theme) => theme.palette.colors.borderGreyLight,
        borderRadius: 4,
        mb: '27px',
    },
};

export default styles;
