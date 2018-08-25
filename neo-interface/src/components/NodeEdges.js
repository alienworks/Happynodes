import React, { Component } from 'react'
import { connect } from 'react-refetch'
import Graph from 'react-graph-vis'
import config from './config'

class NodeEdges extends Component {
    render() {
        const { nodeedges } = this.props;
        if (nodeedges.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (nodeedges.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (nodeedges.fulfilled) {

            const raw_data = nodeedges.value;
            const node_id = this.props.node_id;

            const d_edges = raw_data.map((item, i) => { return { "from": this.props.node_id, "to": item.address } });
            const d_nodes = raw_data.map((item, i) => { return { "id": item.address, label: item.address } }).concat([{ "id": this.props.node_id, label: this.props.node_id }]);

            const node_lookup = raw_data.reduce(function (map, obj) {
                map[obj.address] = obj.address_id;
                map[node_id] = node_id;
                return map;
            }, {});

            const data = {
                nodes: d_nodes,
                edges: d_edges
            };

            var options = {
                layout: {
                    hierarchical: false
                },
                edges: {
                    color: "#000000"
                },
                nodes: {
                    shape: "hexagon"
                },
                physics: {
                    stabilization: false,
                    maxVelocity: 30,
                    solver: 'forceAtlas2Based',
                }
            };

            var events = {
                select: function (event) {
                    var { nodes, edges } = event;
                    console.log(nodes, edges);
                    if (nodes.length === 1) {
                        window.location = "./" + node_lookup[nodes[0]];
                    }

                }
            }


            return (

                <div className="jumbotron nodes padgraph" style={{ 'width': '100%', 'height': '900px' }}>


                    <h2>Direct Peers</h2>
                    <hr style={{
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />

                    <Graph graph={data} options={options} events={events} />
                </div>
            )
        }
    }
}

export default connect((props) => ({
    nodeedges: { url: config.api_url.concat(`/nodes/${props.node_id}/validatedpeers`) },
}))(NodeEdges)