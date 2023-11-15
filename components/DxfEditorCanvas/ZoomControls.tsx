import { FC, memo } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Stack } from '@mui/material';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { useAppSelector } from 'store/store';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_FACTOR, getDxfEditorScale } from 'store/dxfEditor';
import Slider from 'components/UI/Slider';

const sxProps = {
    zoomControl: {
        display: 'flex',
        justifyContent: 'center',
        flex: 1,
        mb: 'auto',
    },
    fitButton: { height: 32, ml: '-19px', mt: '-2px' },
};
interface ZoomControlsProps {
    onFitCanvas: () => void;
    onHandleZoomLevelChange: (newScale: number) => void;
}

/**
 *  This component will render canvas controls
 * @param {ZoomControlsProps} props - component props
 * @param {function} props.onFitCanvas - fit canvas handler
 * @param {function} props.onHandleZoomLevelChange - the handler of slider change event
 * @return {JSX.Element} ZoomControls
 */

const ZoomControls: FC<ZoomControlsProps> = memo((props) => {
    const {
        onFitCanvas,

        onHandleZoomLevelChange,
    } = props;

    const scale = useAppSelector(getDxfEditorScale);

    const onHandleZoomOut = () => {
        const newScale = Math.max(scale / ZOOM_FACTOR, MIN_ZOOM);
        onHandleZoomLevelChange(newScale);
    };

    const onHandleZoomIn = () => {
        const newScale = Math.min(scale * ZOOM_FACTOR, MAX_ZOOM);
        onHandleZoomLevelChange(newScale);
    };

    // Handle Zoom Level
    const handleZoomLevelChange = (event: Event | null, newValue: number | number[]) =>
        onHandleZoomLevelChange(newValue as number);

    return (
        <Stack direction="column">
            <Box data-testid="ZoomControls" sx={sxProps.zoomControl}>
                <Box flex={1} maxWidth={500}>
                    <Slider
                        id="slider"
                        value={scale}
                        onChange={handleZoomLevelChange}
                        step={0.1}
                        max={3}
                        min={0.1}
                        handleZoomIn={onHandleZoomIn}
                        handleZoomOut={onHandleZoomOut}
                    />
                </Box>
                <IconButton onClick={onFitCanvas} sx={sxProps.fitButton}>
                    <ZoomOutMapIcon sx={{ fontSize: 16, my: 0.4 }} />
                </IconButton>
            </Box>
        </Stack>
    );
});

ZoomControls.displayName = 'ZoomControls';

ZoomControls.propTypes = {
    onFitCanvas: PropTypes.func.isRequired,
    onHandleZoomLevelChange: PropTypes.func.isRequired,
};

export default ZoomControls;
