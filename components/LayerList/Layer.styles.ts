const layerListStyles = {
    root: {
        boxShadow: 'none',

        '&::before': {
            backgroundColor: 'colors.borderGreyLight' || '#EAEAEA',
        },
        '&&&.MuiPaper-root': {
            mt: '0px',
            mb: '12px',
            borderRadius: '5px',
        },
        maxHeight: '100% !important',
        overflow: 'auto',
    },
    summary: {
        borderRadius: '5px',
        p: '16px',
        border: '1px solid',
        borderColor: 'colors.borderGreyLight' || '#EAEAEA',
        '&>div.MuiAccordionSummary-content': {
            display: 'flex',
            justifyContent: 'space-between',
            m: '0px',
        },
    },
    nameBlock: {
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        // Checkbox
        '&>label.MuiFormControlLabel-root': {
            mr: '2px',
        },
        '& span.MuiButtonBase-root.Mui-checked': {
            color: 'colors.adminBrand1',
        },
    },
    toggleIconButton: {
        width: '20px',
        height: '20px',
        p: '0px',
        ml: 'auto',
    },
    icon: {
        color: '#7D90A7',
        fontWeight: 'bold',
        fontSize: '1.1rem',
    },
    actions: {
        display: 'flex',
        '&>.MuiIconButton-root': {
            p: 0,
        },
    },
    checkboxContainer: {
        p: 0,
        m: 0,
        width: '20px',
    },
    accordionDetails: {
        p: 0,
        border: '1px solid',
        borderColor: 'colors.borderGreyLight' || '#EAEAEA',
        borderTop: 'none',
    },
};

const standItemStyles = {
    root: {
        display: 'flex',
        '& .MuiFormControl-root': {
            flexGrow: 1,
        },

        borderBottom: '1px solid',
        borderColor: 'colors.borderGreyLight' || '#EAEAEA',
        py: '12px',
        pl: {
            md: '24px',
            lg: '47px',
        },
        pr: '16px',
        '&>label.MuiFormControlLabel-root': {
            mr: 0.25,
        },
        '& .Mui-checked': {
            color: 'colors.adminBrand1',
        },
    },
    selectedStyle: {
        backgroundColor: 'rgba(57, 163, 219, 0.1)',
    },
    checkboxContainer: {
        p: 0,
        m: 0,
        width: '20px',
    },
    actions: {
        display: 'flex',
        pointerEvents: 'auto',
        '&>.MuiIconButton-root': {
            p: 0,
        },
    },
};

export { layerListStyles, standItemStyles };
