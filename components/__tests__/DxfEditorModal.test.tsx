import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/react';
import { renderWithRedux } from 'utils/helpers/testExtensions';
import DxfEditor from '../../DxfEditor';
import mockData from '../../mock/data.json';

const image = 'https://hatrabbits.com/wp-content/uploads/2017/01/random.jpg';
const stageImage = new Image(200, 200);

stageImage.src = image;

const dxfModalTitle = 'Dxf Editor';

describe('DxfEditorModal', () => {
    test('should render without crashing', () => {
        renderWithRedux(<DxfEditor image={image} stageImage={stageImage} />, {
            initialState: { dxfEditor: mockData },
        });

        // assertions
        expect(screen.getByText(dxfModalTitle)).toBeInTheDocument();
    });

    test('modal should include Cancel and Save buttons', () => {
        renderWithRedux(<DxfEditor image={image} stageImage={stageImage} />, {
            initialState: { dxfEditor: mockData },
        });

        // assertions
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    test('it should include layers card', () => {
        renderWithRedux(<DxfEditor image={image} stageImage={stageImage} />, {
            initialState: { dxfEditor: mockData },
        });

        // assertions
        expect(screen.getByText(/layers/i)).toBeInTheDocument();
        expect(screen.getByTestId(/layers-list/i)).toBeInTheDocument();
    });

    test('Warning box should be visible', () => {
        renderWithRedux(<DxfEditor image={image} stageImage={stageImage} />, {
            initialState: { dxfEditor: mockData },
        });

        // assertions
        expect(
            screen.getByText(/Items that are not supported will not be saved and will be deleted/i),
        ).toBeInTheDocument();
    });
});
