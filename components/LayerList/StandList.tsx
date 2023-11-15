import { FC, memo } from 'react';
import PropTypes from 'prop-types';
import { FixedSizeList as List } from 'react-window';
import { Box } from '@mui/material';
import StandItem from './StandItem';
import { useDxfEditorContext } from '../DxfEditorModal/DxfEditorContext';

const STAND_ITEM_HEIGHT = 70;

/**
 * StandList
 * @param {Object} props - data passed to the component
 * @param {string} props.layerName - it is used to get the stand list of corresponding layer
 * @param {number} props.listFixedHeight - list height
 * @returns {JSX.Element} - StandList
 */

const StandList: FC<{ layerName: string; listFixedHeight: number }> = memo(
    ({ layerName, listFixedHeight }) => {
        const { listRef, count, whiteList } = useDxfEditorContext();

        const height =
            listFixedHeight - 40 > count * STAND_ITEM_HEIGHT
                ? count * STAND_ITEM_HEIGHT
                : listFixedHeight - 40;

        return (
            <Box id={layerName}>
                {/* @ts-ignore */}
                <List height={height} itemCount={count} ref={listRef} itemSize={STAND_ITEM_HEIGHT}>
                    {({ index, style }) => {
                        const { handle } = Array.from(whiteList.values())?.[index] || '';

                        return (
                            <Box key={index} sx={style}>
                                <StandItem
                                    key={index}
                                    lastItem={count - 1 === index}
                                    handle={handle}
                                />
                            </Box>
                        );
                    }}
                </List>
            </Box>
        );
    },
);

StandList.displayName = 'StandList';

StandList.propTypes = {
    layerName: PropTypes.string.isRequired,
    listFixedHeight: PropTypes.number.isRequired,
};

export default StandList;
