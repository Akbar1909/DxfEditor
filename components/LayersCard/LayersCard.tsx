import { useState, useMemo, memo, FC, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useWatch, useFormContext, Controller } from 'react-hook-form';
import { Stack, Typography, Card, CardHeader, CardContent, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getDxfEditorStatus, getStandsLayer, toggleLayerAccordion } from 'store/dxfEditor';
import { useAppDispatch, useAppSelector } from 'store/store';
import LoaderPlug from 'components/layouts/LoaderPlug';
import ActionsButton from './ActionsButton';
import LayerList from '../LayerList';
import { parseFieldName } from '../../helpers/form';
import styles from './LayersCard.styles';

/**
 * LayersCard renders the list of layers coming from uploaded dxf file
 * @param {Object} props - data passed to the component
 * @param {boolean} props.entityArgsBoxOpen - if true, context menu is open
 * @returns {JSX.Element} - LayersCard
 */

const LayersCard: FC<{ entityArgsBoxOpen: boolean }> = memo(
    ({ entityArgsBoxOpen }): JSX.Element => {
        const { t } = useTranslation();
        const dispatch = useAppDispatch();
        const dxfStatus = useAppSelector(getDxfEditorStatus);
        const standsLayer = useAppSelector(getStandsLayer);
        const cardContent = useRef<HTMLDivElement>(null);

        const [cardContentHeight, setCardContentHeight] = useState(0);

        const { control } = useFormContext();

        const values = useWatch({ control });

        const layersHasEmptyFields = useMemo(() => {
            const temp: Record<string, string> = {};

            // eslint-disable-next-line guard-for-in
            for (const key in values) {
                if (!key.endsWith('main')) {
                    // eslint-disable-next-line no-continue
                    continue;
                }

                const { layer, handle } = parseFieldName(key);

                const value = values[key];

                if (!value) {
                    temp[layer] = handle;
                }

                if (value && temp?.[layer] === handle) {
                    temp[layer] = '';
                }
            }

            return temp;
        }, [values]);

        const handleSearchInputFocus = () => {
            if (standsLayer?.expanded || !standsLayer) {
                return;
            }

            dispatch(toggleLayerAccordion(standsLayer.options.name));
        };

        useEffect(() => {
            if (!cardContent.current && dxfStatus === 'success') {
                return;
            }

            setCardContentHeight(cardContent.current?.clientHeight as number);
        }, [dxfStatus]);

        const handleWindowResize = () => {
            if (!cardContent.current) {
                return;
            }

            setCardContentHeight(cardContent.current?.clientHeight as number);
        };

        useEffect(() => {
            window.addEventListener('resize', handleWindowResize);
            return () => window.removeEventListener('resize', handleWindowResize);
        }, []);

        let Content: JSX.Element;

        switch (dxfStatus) {
            case 'loading':
                Content = <LoaderPlug isLoading />;
                break;
            case 'error':
                Content = <>Something went wrong...</>;
                break;
            case 'success':
                Content = (
                    <>
                        <CardHeader
                            title={<Typography variant="h3" children={t('Layers')} />}
                            sx={styles.header}
                        />

                        <Stack
                            direction="row"
                            sx={[styles.searchBox, entityArgsBoxOpen && { pointerEvents: 'none' }]}
                        >
                            <Controller
                                name="search"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        variant="outlined"
                                        placeholder={t('Search')}
                                        InputProps={{
                                            startAdornment: (
                                                <SearchIcon
                                                    sx={{ color: 'colors.iconGrey', mr: '10px' }}
                                                />
                                            ),
                                        }}
                                        type="search"
                                        sx={styles.searchInput}
                                        size="small"
                                        {...field}
                                        onFocus={handleSearchInputFocus}
                                    />
                                )}
                            />
                            <ActionsButton />
                        </Stack>

                        <CardContent
                            ref={cardContent}
                            sx={[styles.content, entityArgsBoxOpen && { pointerEvents: 'none' }]}
                        >
                            <LayerList
                                height={cardContentHeight}
                                layersHasEmptyFields={layersHasEmptyFields}
                            />
                        </CardContent>
                    </>
                );
                break;
            default:
                Content = <></>;
                break;
        }

        return (
            <Card data-testid="layers-list" sx={styles.root}>
                {Content}
            </Card>
        );
    },
);

LayersCard.displayName = 'LayersCard';

LayersCard.propTypes = {
    entityArgsBoxOpen: PropTypes.bool.isRequired,
};

LayersCard.defaultProps = {
    entityArgsBoxOpen: false,
};

export default LayersCard;
