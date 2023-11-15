/* eslint-disable testing-library/no-node-access */
import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRedux } from 'utils/helpers/testExtensions';
import DxfEditor from 'components/DxfEditor/DxfEditor';
import mockData from '../../mock/data.json';

const image = 'https://hatrabbits.com/wp-content/uploads/2017/01/random.jpg';
const stageImage = new Image(200, 200);

stageImage.src = image;

const { layers } = mockData;

const render = () =>
    renderWithRedux(<DxfEditor image={image} stageImage={stageImage} />, {
        initialState: { dxfEditor: mockData },
    });

describe('LayersCard', () => {
    test('should render without crashing', () => {
        render();
        // assertions
        expect(screen.getByText(/layers/i)).toBeInTheDocument();
        expect(screen.getByTestId(/layers-list/i)).toBeInTheDocument();
    });

    test('layers action menu should open and contain 5 elements', async () => {
        render();

        // eslint-disable-next-line testing-library/no-node-access
        const button = screen.getByTestId('MoreHorizIcon').closest('div') as HTMLElement;
        await userEvent.click(button);

        // assertions
        const menuItems = [
            'Unselect layers',
            'Hide selected layers',
            'Edit selected layers',
            'Show unsupported elements',
            'Delete selected layers',
        ];
        expect(screen.getAllByRole('menu')).toHaveLength(1);

        menuItems.forEach((menuItem) => {
            expect(screen.getByText(menuItem)).toBeInTheDocument();
        });
    });

    test('Unselect layers should change to Select layers when it is clicked', async () => {
        render();

        const button = screen.getByTestId('MoreHorizIcon').closest('div') as HTMLElement;
        await userEvent.click(button);
        const currentItem = screen.getByText(/unselect layers/i);
        await userEvent.click(currentItem);

        // assertions
        expect(screen.queryByText(/unselect layers/i)).not.toBeInTheDocument();
        expect(screen.getByText(/select all layers/i)).toBeInTheDocument();
    });

    test('Hide selected layers should change to View selected layers when it is clicked', async () => {
        render();

        const button = screen.getByTestId('MoreHorizIcon').closest('div') as HTMLElement;
        await userEvent.click(button);
        const currentItem = screen.getByText(/hide selected layers/i);
        await userEvent.click(currentItem);

        // assertions
        expect(screen.queryByText(/hide selected layers/i)).not.toBeInTheDocument();
        expect(screen.getByText(/show selected layers/i)).toBeInTheDocument();
    });

    test('When Edit layers is clicked, settings card should appear', async () => {
        render();
        const button = screen.getByTestId('MoreHorizIcon').closest('div') as HTMLElement;
        await userEvent.click(button);
        const currentItem = screen.getByText(/edit selected layers/i);
        await userEvent.click(currentItem);

        // assertions
        expect(screen.queryByText(/edit selected layers/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('drag-wrapper')).toBeInTheDocument();
    });

    test('Show supported elements should change to hide unsupported elements, when it is clicked', async () => {
        render();

        const button = screen.getByTestId('MoreHorizIcon').closest('div') as HTMLElement;
        await userEvent.click(button);
        const currentItem = screen.getByText(/show unsupported elements/i);
        await userEvent.click(currentItem);

        // assertions
        expect(screen.queryByText(/show unsupported elements/i)).not.toBeInTheDocument();
        expect(screen.getByText(/hide unsupported/i)).toBeInTheDocument();
    });

    test('Delete layers', async () => {
        render();

        const button = screen.getByTestId('MoreHorizIcon').closest('div') as HTMLElement;
        await userEvent.click(button);
        const currentItem = screen.getByText(/delete selected layers/i);
        await userEvent.click(currentItem);

        // assertions
        Object.values(layers).forEach((layer) => {
            expect(screen.queryByText(layer.options.name)).not.toBeInTheDocument();
        });
    });

    test('Search input', async () => {
        render();

        const searchInput = screen.getByPlaceholderText(/search/i);

        // assertions
        expect(searchInput).toBeInTheDocument();
    });

    test('Search input should correctly work', async () => {
        render();

        const searchInput = screen.getByPlaceholderText(/search/i);
        await userEvent.type(searchInput, 'stand shape');

        // assertions
        expect(searchInput).toHaveValue('stand shape');
    });

    test('Layer Delete icon', async () => {
        render();
        const deleteButton = screen
            .getAllByTestId(/DeleteIcon/i)[0]
            .closest('button') as HTMLElement;
        await userEvent.click(deleteButton);
        const firstLayer = Object.values(layers)[0];

        // assertions
        expect(screen.queryByText(firstLayer.options.name)).not.toBeInTheDocument();
    });
});
