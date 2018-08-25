import React from 'react';
import ReactDOM from 'react-dom';
import NodeInfo from './NodeInfo';
import ClientSideLatency from './ClientSideLatency';
import renderer from 'react-test-renderer';

Date.now = jest.fn(() => 1487076708000)

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<NodeInfo />, div);
    ReactDOM.unmountComponentAtNode(div);
});


describe("test against valid snapshot", () => {
    it("redner as expected", () => {
        const tree = renderer.create(<NodeInfo nodeinfo={{ fulfilled:true ,value: { "id": 42, "hostname": "seed3.aphelion-neo.com", "protocol": "http", "port": 10332, "p2p_tcp_status": true, "p2p_ws_status": true, "address": "http://seed3.aphelion-neo.com:10332", "validated_peers_counts": 18, "stability": 100, "blockheight_score": 98, "normalised_latency_score": 87.9701137542725, "validated_peers_counts_score": 34.61538461538461, "health_score": 80.1463745924143, "latency": 240.597724914551, "rcp_https_status": true, "rcp_http_status": true, "mempool_size": 74, "connection_counts": 244, "online": true, "blockheight": 2622828, "lat": 50.1153, "long": 8.6823, "locale": "kr", "version": "/NEO:2.7.4/", "max_blockheight": 2622829 } }} />).toJSON();

        expect(tree).toMatchSnapshot();

    });
});
