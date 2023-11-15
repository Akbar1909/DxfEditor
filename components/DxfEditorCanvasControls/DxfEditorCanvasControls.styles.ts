const styles = {
    root: {
        position: 'absolute',
        top: '50%',
        right: '16px',
        transform: 'translateY(-50%)',
        boxShadow: ' 0px 4px 16px rgba(51, 51, 51, 0.08), 0px 4px 4px rgba(51, 51, 51, 0.04)',
        borderRadius: 1,
        backgroundColor: 'colors.white',
        border: '1px solid',
        borderColor: '#E6E8EE',
        '&>button:not(:last-of-type)': {
            borderBottom: '1px solid',
            borderColor: '#E6E8EE',
        },
        zIndex: 100,
    },
    iconButton: {
        py: '11.8px',
        px: '7.8px',
        borderRadius: '0%',
        '&:hover': {
            cursor: 'pointer',
        },
        '& svg': {
            width: '24px',
            height: '24px',
        },
    },
    activeStyle: {
        color: '#2988FF',
    },
};

export default styles;
