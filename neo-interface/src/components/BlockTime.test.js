import React from 'react';
import ReactDOM from 'react-dom';
import BlockTime from './BlockTime';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<BlockTime />, div);
    ReactDOM.unmountComponentAtNode(div);
});


describe("test against valid snapshot", ()=> {
    it("redner as expected", ()=> {
        const tree = renderer.create(<BlockTime blocktime={{value:{blocktime:1234}}} />).toJSON();

        expect(tree).toMatchSnapshot();

    });
});
  