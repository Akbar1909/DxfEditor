import { useMemo, useEffect, FC, useRef } from 'react';
import PropTypes from 'prop-types';
import { getDxfEditorLayers } from 'store/dxfEditor';
import { useAppSelector } from 'store/store';
import { useForm, FormProvider } from 'react-hook-form';
import {
    createSelectFieldName,
    createDeleteFieldName,
    createFieldName,
    createVisibilityFieldName,
} from './helpers/form';
import DxfEditorModal from './components/DxfEditorModal';
import { DxfEditorStateType } from './dxfEditor.types';
import dxfEditorCache from './helpers/cache';

const prepareDefaultValues = (layers: DxfEditorStateType['layers']) =>
    Object.values(layers).reduce(
        (acc, cur) => ({
            ...acc,
            ...Object.values(cur.standNameEntities).reduce((innerAcc, innerCur) => {
                const {
                    options: { name },
                } = cur;
                const textFieldName = createFieldName(name, innerCur.handle);
                const selectedFieldName = createSelectFieldName(name, innerCur.handle);
                const visibilityFieldName = createVisibilityFieldName(name, innerCur.handle);
                const deleteFieldName = createDeleteFieldName(name, innerCur.handle);
                return {
                    ...innerAcc,
                    [textFieldName]: innerCur.string,
                    [selectedFieldName]: true,
                    [visibilityFieldName]: true,
                    [deleteFieldName]: false,
                };
            }, {}),
        }),
        {},
    );

/**
 * DxfEditor component
 * @param {Object} props - data passed to the component
 * @param {string} image - hall image
 * @param {HTMLElement} stageImage - hall image is used as a src in Konva.Image
 * @returns {JSX.Element} - DxfEditor
 */

const DxfEditor: FC<{ image: string; stageImage?: HTMLImageElement }> = ({ image, stageImage }) => {
    const layers = useAppSelector(getDxfEditorLayers);
    const defaultValuesInitialized = useRef(false);

    const { reset, ...methods } = useForm<Record<string, string | boolean>>();

    const defaultValues: Record<string, string> = useMemo(
        () => prepareDefaultValues(layers),
        [layers],
    );

    useEffect(() => {
        if (defaultValuesInitialized.current || Object.keys(defaultValues).length === 0) {
            return;
        }

        defaultValuesInitialized.current = true;
        reset({ ...defaultValues, search: '' });
    }, [defaultValues, reset]);

    useEffect(() => () => dxfEditorCache.clear(), []);

    return (
        <FormProvider reset={reset} {...methods}>
            <DxfEditorModal image={image} stageImage={stageImage} />
        </FormProvider>
    );
};

DxfEditor.propTypes = {
    image: PropTypes.string.isRequired,
    stageImage: PropTypes.any,
};

export default DxfEditor;
