import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/react';
import { renderWithRedux } from 'utils/helpers/testExtensions';
import ZoomControls from '../DxfEditorCanvas/ZoomControls';

describe('ZoomControls', () => {
    test('it should render without crashing', () => {
        renderWithRedux(<ZoomControls onFitCanvas={() => {}} onHandleZoomLevelChange={() => {}} />);

        // assertions
        expect(screen.getByTestId('slider-zoom-out-icon')).toBeInTheDocument();
        expect(screen.getByTestId('slider-zoom-in-icon')).toBeInTheDocument();
        expect(screen.getByTestId('ZoomOutMapIcon')).toBeInTheDocument();
    });
});
