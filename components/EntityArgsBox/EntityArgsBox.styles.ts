const entityArgsBoxStyles = {
    root: {
        width: '272px',
        borderRadius: '5px',
        backgroundColor: 'colors.white',
        border: '1px solid',
        borderColor: '#EAEAEA',
        boxShadow: '0px 5px 15px rgba(0, 24, 71, 0.05)',
        zIndex: 10000,
    },
    content: {
        p: '16px',
        pb: '0',
    },
    textField: {
        '& .MuiInputBase-formControl': {
            minHeight: '30px',
        },
    },
    button: {
        width: '50%',
        backgroundColor: 'colors.white',
        border: '1px solid',
        borderColor: 'colors.borderGreyLight',
        borderRadius: '4px',
        '&>.MuiButton-startIcon': {
            mr: '4px',
        },
    },
    cancelButton: {
        color: 'colors.adminBrand2' || '#1D2B7E',
    },
    hideButton: {
        color: 'colors.textPrimary' || '#333645',
    },
    snackBar: {
        width: '100%',
        height: '12px',
        borderRadius: '4px 4px 0px 0px',
        backgroundColor: 'colors.adminBrand2' || '#1D2B7E',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        p: '16px',
        borderBottom: '1px solid',
        borderColor: 'colors.borderGreyLight' || '#EAEAEA',
    },
};

export default entityArgsBoxStyles;
