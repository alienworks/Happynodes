import React, { Component } from 'react'
import { connect } from 'react-refetch'
import Graph from 'react-graph-vis'
import config from './config'

class NetworkGraph extends Component {
    render() {
        const { nodeedges, nodeslist } = this.props;
        if (nodeedges.pending || nodeslist.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (nodeedges.rejected || nodeslist.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (nodeedges.fulfilled || nodeslist.fulfilled) {

            const edges_data = nodeedges.value;
            const nodeslist_data = nodeslist.value;


            const d_edges = edges_data.map((item, i) => { return { "from": item.source_address_id, "to": item.validated_peers_address_id } });
            let edgeCount = {}

            for (let i = 0; i < edges_data.length; i++){               
               edgeCount[edges_data[i]['source_address_id']] = edges_data[i]['source_address_id'] in edgeCount ? 1+edgeCount[edges_data[i]['source_address_id']] : 1
            }



            const d_nodes = nodeslist_data.map((item, i) => { return { "id": item.id, label: item.address,  size: 1+(edgeCount[item.id])} });

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
                physics:{
                    stabilization: false,
                    maxVelocity: 30,
                    solver: 'forceAtlas2Based',
                  }
            };
             
            var events = {
                select: function(event) {
                    var { nodes, edges } = event;
                    console.log(nodes, edges);
                    if (nodes.length === 1){
                        window.location = "./" + nodes[0];
                    }
                    
                }
            }


            return (

                <div className="jumbotron nodes padgraph" style={{'width': '100%', 'height':'900px'}}>


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
    nodeedges: { url: config.api_url.concat(`/edges`) },
    nodeslist: { url: config.api_url.concat(`/nodeslist`) }
}))(NetworkGraph)