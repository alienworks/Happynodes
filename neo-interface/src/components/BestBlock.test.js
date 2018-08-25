import React from 'react';
import ReactDOM from 'react-dom';
import BestBlock from './BestBlock';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<BestBlock />, div);
    ReactDOM.unmountComponentAtNode(div);
});


describe("test against valid snapshot", ()=> {
    it("redner as expected", ()=> {
        const tree = renderer.create(<BestBlock bestblock={{value:{bestblock:1234}}} />).toJSON();

        expect(tree).toMatchSnapshot();

    });
});
  