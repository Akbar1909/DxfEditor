import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRedux } from 'utils/helpers/testExtensions';
import FileUploaderButton from '../FileUploaderButton';

describe('FileUploaderButton', () => {
    test('it should render without crashing', () => {
        renderWithRedux(<FileUploaderButton />);

        // assertions
        expect(screen.getByText(/upload dxf/i)).toBeInTheDocument();
    });

    test('when it clicked warning modal should be open', async () => {
        renderWithRedux(<FileUploaderButton />);

        const button = screen.getByText(/upload dxf/i);
        await userEvent.click(button);

        // assertions
        expect(screen.getByText(/All stands will be removed/i)).toBeInTheDocument();
    });
});
