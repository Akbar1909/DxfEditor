import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRedux } from 'utils/helpers/testExtensions';
import DxfEditorCanvasControls from '../DxfEditorCanvasControls';
import mockData from '../../mock/data.json';

describe('DxfEditorCanvasControls', () => {
    test('should render without crashing', () => {
        renderWithRedux(
            <DxfEditorCanvasControls
                canvasControls={{ selectArea: false }}
                handleCanvasControls={() => {}}
            />,
            {
                initialState: { dxfEditor: mockData },
            },
        );

        // assertions
        expect(screen.getByTestId(/HighlightAltOutlinedIcon/i)).toBeInTheDocument();
    });

    test('handleCanvasControls should be called 1 time', async () => {
        const handleCanvasControls = jest.fn();
        renderWithRedux(
            <DxfEditorCanvasControls
                canvasControls={{ selectArea: false }}
                handleCanvasControls={handleCanvasControls}
            />,
        );

        // eslint-disable-next-line testing-library/no-node-access
        const iconButton = screen.getByTestId(/HighlightAltOutlinedIcon/i).closest('button');
        await userEvent.click(iconButton as HTMLElement);

        // assertions
        expect(handleCanvasControls.mock.calls.length).toBe(1);
    });
});
