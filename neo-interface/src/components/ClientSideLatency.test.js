import React from 'react';
import ReactDOM from 'react-dom';
import ClientSideLatency from './ClientSideLatency';
import renderer from 'react-test-renderer';

Date.now = jest.fn(() => 1487076708000)

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<ClientSideLatency />, div);
    ReactDOM.unmountComponentAtNode(div);
});

describe("test against valid snapshot", ()=> {
    it("redner as expected", ()=> {
        const tree = renderer.create(<ClientSideLatency url="http://api.otcgo.cn:10332" />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
  