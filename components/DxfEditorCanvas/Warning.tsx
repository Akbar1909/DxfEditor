import { FC } from 'react';
import PropTypes from 'prop-types';
import { Stack, Typography, useTheme, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import WarningSvg from 'components/UI/icons/WarningSvg';
import CloseIcon from '@mui/icons-material/Close';

const styles = {
    root: {
        position: 'absolute',
        top: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        mx: 'auto',
        px: '16px',
        borderLeft: '4px solid',
        borderColor: 'colors.statusPending',
        boxShadow: '0px 3.80337px 11.4101px rgba(0, 24, 71, 0.05)',
        borderRadius: '4px',
        zIndex: 10,
        backgroundColor: 'colors.white',
        width: {
            md: '43%',
            xl: 'auto',
        },
        maxWidth: '496px',
        minWidth: '496px',
        height: '48px',
    },
    gotIt: {
        color: 'colors.textSecondary',
        ml: 'auto',
        '&:hover': {
            cursor: 'pointer',
        },
    },
};

/**
 * Warning
 * @param {Object} props - data passed to the component
 * @param {function} props.handleGotIt - the handler for Got it button
 * @returns {JSX.Element} - Warning
 */

const Warning: FC<{ handleGotIt: () => void }> = ({ handleGotIt }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <Stack data-testid="warning" sx={styles.root} direction="row" alignItems="center">
            <WarningSvg
                fill={theme.palette.colors.statusPending || '#FFBB01'}
                style={{ marginRight: '8px' }}
            />
            <Typography
                children={t('Items that are not supported will not be saved and will be deleted')}
                variant="body2"
            />
            <IconButton
                onClick={handleGotIt}
                sx={{ p: 0, ml: 'auto' }}
                children={
                    <CloseIcon
                        sx={{
                            width: '20px',
                            height: '20px',
                            color: 'colors.iconGrey' || '#7D90A7',
                        }}
                    />
                }
            />
        </Stack>
    );
};

Warning.propTypes = {
    handleGotIt: PropTypes.func.isRequired,
};

export default Warning;
