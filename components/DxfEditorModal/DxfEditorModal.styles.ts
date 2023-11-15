const styles = {
    modal: {
        '& .MuiPaper-root': {
            maxHeight: '100% !important',
        },
        '& .MuiDialogActions-root': {
            p: '0px',
        },
    },
    container: {
        height: '75vh',
        p: '24px',
        background: '#F9FBFE',
    },
    actionButtonsContainer: {
        background: '#F9FBFE',
        boxShadow: 'inset 0px 1px 0px #F0F0F0',
        py: '16px',
        '&>.MuiButtonBase-root': {
            width: '172px',
            py: '11.5px',
        },
    },
    cancelButton: {
        backgroundColor: '#F5F5F6',
        color: '#333645',
        border: 'none',
        '&:hover': { border: 'none' },
    },
};

export default styles;
