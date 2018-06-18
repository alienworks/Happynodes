import React, { Component } from 'react'
import { connect } from 'react-refetch'
import { Link, Redirect } from 'react-router-dom'
import { Tooltip, OverlayTrigger, Button} from 'react-bootstrap'
import { Graph } from 'react-d3-graph'

class NodeEdges extends Component {
    render() {
        const { nodeedges } = this.props;
        if (nodeedges.pending) {
            return (
             
                 <div className="jumbotron">
                    <h2>Loading...</h2>
                    </div>
            )
        }else if (nodeedges.rejected  ) {
            return (
            
                <div>
                    error
                </div>
            )
        } else if (nodeedges.fulfilled ) {
            
            const raw_data = nodeedges.value;
            const node_id = this.props.node_id;
            
            const d_edges = raw_data.map((item, i) => 
                    {return {"source":this.props.node_id, "target":item.address}});
            const d_nodes = raw_data.map((item, i) => 
                {return {"id":item.address}}).concat([{"id":this.props.node_id}]);

            const node_lookup = raw_data.reduce(function(map, obj) {
                map[obj.address] = obj.address_id;
                return map;
            }, {});

            console.log(node_lookup);


            console.log(d_edges);
            console.log(d_nodes);

            const data = {
              nodes: d_nodes,
              links: d_edges
            };
            const myConfig = {
            nodeHighlightBehavior: true,
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
              if (nodeId != node_id){
                window.location = './' + node_lookup[nodeId];
              }
                
          };


            return (
            
                <div className="jumbotron nodes">

                    
                    <h2>Direct Peers</h2>
                    <hr style={{
                        'border-color': '#78cadd', 'border-width': '3px'}}/>
                <div className="container">
                <Graph
                  id="graph-id" // id is mandatory, if no id is defined rd3g will throw an error
                  data={data}
                  config={myConfig}

                  onMouseOverNode={onMouseOverNode}
                  onClickNode={onClickNode}

              />

   
          
                </div></div>
                )
        }
    }   
}

export default connect( (props)=> ({
    nodeedges: {url:`/nodes/${props.node_id}/validatedpeers`},
}))(NodeEdges)