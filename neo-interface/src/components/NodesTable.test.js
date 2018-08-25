import React from 'react';
import ReactDOM from 'react-dom';
import NodesTable from './NodesTable';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<NodesTable />, div);
    ReactDOM.unmountComponentAtNode(div);
});

var data = [  
       {  
          "id":37,
          "hostname":"pyrpc2.narrative.org",
          "protocol":"https",
          "port":443,
          "p2p_tcp_status":false,
          "p2p_ws_status":false,
          "address":"https://pyrpc2.narrative.org:443",
          "validated_peers_counts":29,
          "stability":100,
          "blockheight_score":96,
          "normalised_latency_score":87.1326684951782,
          "validated_peers_counts_score":59.183673469387756,
          "health_score":85.5790854911415,
          "latency":257.346630096436,
          "rcp_https_status":true,
          "rcp_http_status":true,
          "mempool_size":15,
          "connection_counts":116,
          "online":true,
          "blockheight":2624393,
          "lat":40.7904,
          "long":-74.0247,
          "locale":"us",
          "version":"/NEO-PYTHON:0.7.6/",
          "max_blockheight":2624395
       }
    ]

describe("test against valid snapshot", ()=> {
    it("redner as expected", ()=> {
        const tree = renderer.create(<NodesTable nodes={{value:data}} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});