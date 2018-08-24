import React from 'react';
import ReactDOM from 'react-dom';
import LastBlock from './LastBlock';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<LastBlock />, div);
    ReactDOM.unmountComponentAtNode(div);
});

describe("test against valid snapshot", ()=> {
    it("redner as expected", ()=> {
        const tree = renderer.create(<LastBlock lastblock={{value:{lastblock:1534363759223}}} />).toJSON();
        expect(tree).toMatchSnapshot();

    });
});

describe("test against valid snapshot", ()=> {
    it("redner as expected", ()=> {
        const tree = renderer.create(<LastBlock lastblock={{fulfilled:true, value:{lastblock:1534363759223}}} />).toJSON();
        expect(tree).toMatchSnapshot();

    });
});
  