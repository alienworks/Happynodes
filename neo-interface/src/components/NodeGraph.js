import React, { Component } from 'react'
import { connect } from 'react-refetch'
import { Graph } from 'react-d3-graph'

class NodeGraph extends Component {

    render() {
        const {nodes} = this.props
        const data = {
            nodes: [{ id: 'seed1.neo.org' }, { id: 'seed1.cityofzion.io' }, { id: 'seed0.bridgeprotocol.io' }],
            links: [{ source: 'seed1.neo.org', target: 'seed1.cityofzion.io' }, { source: 'seed1.neo.org', target: 'seed0.bridgeprotocol.io' }]
        };
        const myConfig = {
            nodeHighlightBehavior: true,
            node: {
                color: '#1FB6FF',
                size: 120,
                highlightStrokeColor: '#1FB6FF'
            },
            link: {
                highlightColor: 'lightblue'
            }
        };
        const onMouseOverNode = function(nodeId) {
            //window.alert(`Mouse over node ${nodeId}`);
        };

            if (nodes.pending) {
                return (
                    <div class="well"> Loading </div>
                );
            }
            console.log(nodes)
        return (
            <div class="container">
                <Graph
    id="graph-id" // id is mandatory, if no id is defined rd3g will throw an error
    data={data}
    config={myConfig}

    onMouseOverNode={onMouseOverNode}

/>

          </div>
        );
    }
}

export default connect( (props)=> ({
    nodes: {
        url: `http://api.happynodes-integration.f27.ventures/nodes`,
        refreshInterval: 5000
    }
}))(NodeGraph)