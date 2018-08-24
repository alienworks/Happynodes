import React from 'react';
import ReactDOM from 'react-dom';
import UnconfirmedTx from './UnconfirmedTx';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<UnconfirmedTx />, div);
    ReactDOM.unmountComponentAtNode(div);
});


// describe("test against valid snapshot", ()=> {
//     it("redner as expected", async ()=> {
//         const tree = renderer
//         .create(<UnconfirmedTx bestblock={{fulfilled:true, value:{bestblock:1234}}} unconfirmed={{fulfilled:true, value:{"txs":[]} }}  />)
//         .toJSON();

//         expect(tree).toMatchSnapshot();

//     });
// });