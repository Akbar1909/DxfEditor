const layersCardStyles = {
    root: {
        boxShadow: '0px 3.80337px 11.4101px rgba(0, 24, 71, 0.05)',
        height: '100%',
        maxHeight: '100% !important',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
    },
    header: {
        py: '16px',
        px: '24px',
        backgroundColor: 'colors.backgroundGreyLight',
        borderBottom: '1px solid',
        borderColor: 'colors.borderGreyLight',
        borderRadius: '8px 8px 0px 0px',
    },
    content: {
        overflow: 'auto',
        flex: 1,
        px: '24px',
        pt: '16px',
        pb: '0px !important',
    },
    searchBox: {
        height: '42px',
        width: '100%',
        px: '24px',
        mt: '24px',
    },
    searchInput: {
        mr: '16px',
        flexGrow: 1,
        '&>div.MuiInputBase-root': {
            height: '100%',
        },
    },
    actionBtn: {
        py: '12px',
        borderRadius: '4px',
    },
};

export default layersCardStyles;
