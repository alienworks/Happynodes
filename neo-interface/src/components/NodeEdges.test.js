import React from 'react';
import ReactDOM from 'react-dom';
import NodeEdges from './NodeEdges';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<NodeEdges />, div);
    ReactDOM.unmountComponentAtNode(div);
});


// TODO: difficult to test react-graph-vis'

// var data = [{"address_id":452,"hostname":"178.79.191.196","protocol":"http","port":10332,"address":"http://178.79.191.196:10332"},{"address_id":11,"hostname":"seed4.neo.org","protocol":"http","port":10332,"address":"http://seed4.neo.org:10332"},{"address_id":43,"hostname":"seed4.aphelion-neo.com","protocol":"http","port":10332,"address":"http://seed4.aphelion-neo.com:10332"},{"address_id":40,"hostname":"seed1.aphelion-neo.com","protocol":"http","port":10332,"address":"http://seed1.aphelion-neo.com:10332"}]
// var nodeId = 13

// describe("test against valid snapshot", ()=> {
//     it("redner as expected", ()=> {
// var nodeId = 13
// const tree = renderer.create(<NodeEdges  nodeedges={{fulfilled:true, value:data}} node_id={nodeId} />).toJSON();
//         expect(tree).toMatchSnapshot();
//     });
// });
  