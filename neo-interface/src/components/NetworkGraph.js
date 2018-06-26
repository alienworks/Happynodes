import React, { Component } from 'react'
import { connect } from 'react-refetch'
import { Graph } from 'react-d3-graph'

class NetworkGraph extends Component {
    render() {
        const { nodeedges, nodeslist } = this.props;
        if (nodeedges.pending || nodeslist.pending) {
            return (
             
                 <div className="jumbotron">
                    <h2>Loading...</h2>
                    </div>
            )
        }else if (nodeedges.rejected || nodeslist.rejected  ) {
            return (
            
                <div>
                    error
                </div>
            )
        } else if (nodeedges.fulfilled || nodeslist.fulfilled) {
            
            const edges_data = nodeedges.value;
            const nodeslist_data = nodeslist.value;
            

            const d_edges = edges_data.map((item, i) => 
                    {return {"source":item.source_address, "target":item.validated_peers_address}});
            const d_nodes = nodeslist_data.map((item, i) => 
                {return {"id":item.address}});

            const node_lookup = nodeslist_data.reduce(function(map, obj) {
                map[obj.address] = obj.id;
                return map;
            }, {});

            const data = {
              nodes: d_nodes,
              links: d_edges
            };
            const myConfig = {
            nodeHighlightBehavior: true,
            automaticRearrangeAfterDropNode: true,
            linkHighlightBehavior: true,
            panAndZoom: true,
            width: '500',
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

           const onClickNode = function(nodeId) {
              window.location = './' + node_lookup[nodeId];
              
                
          };


            return (
            
                <div className="jumbotron nodes">

                    
                    <h2>Direct Peers</h2>
                    <hr style={{
                        'borderColor': '#78cadd', 'borderWidth': '3px'}}/>
                <div style={{width: '500px'}}>

                <Graph
                  id="graph-id" // id is mandatory, if no id is defined rd3g will throw an error
                  data={data}
                  config={myConfig}
                  restartSimulation

                  onMouseOverNode={onMouseOverNode}
                  onClickNode={onClickNode}

              />

   
          
                </div></div>
                )
        }
    }   
}

export default connect( (props)=> ({
    nodeedges: {url:`/edges`},
    nodeslist: {url:`/nodeslist`}
}))(NetworkGraph)