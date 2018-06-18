import React, { Component } from 'react'
import { connect } from 'react-refetch'
import { Link } from 'react-router-dom'
import { Tooltip, OverlayTrigger, Button} from 'react-bootstrap'
import Map from 'pigeon-maps'
import Marker from 'pigeon-marker'
import Overlay from 'pigeon-overlay'
import emojiFlags from 'emoji-flags';

class NodeInfo extends Component {
    render() {
        const { nodeinfo } = this.props;
        if (nodeinfo.pending) {
            return (
             
                 <div className="jumbotron">
                    <h2>Loading...</h2>
                    </div>
            )
        }else if (nodeinfo.rejected  ) {
            return (
            
                <div>
                    error
                </div>
            )
        } else if (nodeinfo.fulfilled ) {
            
            const data = nodeinfo.value;
            console.log(data);


            function LinkWithTooltip({ key, id, health, children, href, tooltip }) {
                console.log(health);
        const aStyle = {
            'background-color':'hsl('+health+',100%,50%)'
        }

  return (
    <OverlayTrigger
      overlay={<Tooltip id={id}>{tooltip}</Tooltip>}
      placement="top"
      delayShow={100}
      delayHide={150}
    >

      <div class="node-box" style={aStyle}></div>
    </OverlayTrigger>
  );
}
const center = [data.lat,data.long];
const boxStyle = {
            'background-color':'hsl('+data.health_score+',100%,50%)',
            'float':'left',
            float: 'left',
            padding: '2rem',
            margin: '4px 2rem 2rem 0px',
        }
         const gap = (data.max_blockheight > data.blockheight) ? "(" + (data.blockheight - data.max_blockheight)  + ")": "";

        console.log(emojiFlags.countryCode(data.locale))
            return (
                
            
                <div className="jumbotron nodes" style={{display:'inline-block',width:'100%'}}>
                    <div class="node-box" style={boxStyle}><p>{Number(data.health_score.toFixed(0))}</p></div>
                    <h2 style={{float:'left'}}>{data.address}</h2>
                   
                    <hr style={{'clear': 'left',
                        'border-color': '#78cadd', 'border-width': '3px'}}/>

                    <h3>Node Status Information</h3>
                    <hr/>

                    <div className="infoblock">
                       <h4>RPC</h4>
                        <h5>Type</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{Number(data.blockheight).toLocaleString()} {gap}</h4>
                        <h5>Current Block</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{(Number(data.connection_counts)).toLocaleString()}</h4>
                        <h5>Peer Nodes</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{Number((Number(data.latency)*1000).toFixed(0)).toLocaleString()}</h4>
                        <h5>Live Latency (ms)</h5>
                    </div>

                    <div className="infoblock">
                       <h4>{data.version}</h4>
                        <h5>Version</h5>
                    </div>
                    <div className="infoblock" style={{clear:'left'}}>
                       <h4>{data.mempool_size}</h4>
                        <h5>Unconfirmed Transactions</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{data.stability}%</h4>
                        <h5>Stability (Last 100 pings)</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{data.validated_peers_counts}</h4>
                        <h5>Validated Peers</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{emojiFlags.countryCode(data.locale).name} ({emojiFlags.countryCode(data.locale).emoji})</h4>
                        <h5>Country</h5>
                    </div>
             
                    <h3 style={{paddingTop: '4rem', clear:'left'}}>Happynodes Score</h3>
                     <h5>Score is calculated by taking the average of four metrics</h5>
                    <hr/>

                    <div className="infoblock">
                       <h4>{Number(data.health_score.toFixed(0))}%</h4>
                        <h5>Health Score</h5>
                    </div>

                    <div className="infoblock">
                       <h4>:</h4>
                        
                    </div>

                    <div className="infoblock">
                       <h4>{Number(data.blockheight_score).toFixed(0)}%</h4>
                        <h5>Blockheight Lag</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{Number(data.validated_peers_counts_score).toFixed(0)}%</h4>
                        <h5>Validated Peers</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{Number(data.stability).toFixed(0)}%</h4>
                        <h5>Stability (100 pings)</h5>
                    </div>
                    <div className="infoblock">
                       <h4>{Number(data.normalised_latency_score.toFixed(0))}%</h4>
                        <h5>Latency</h5>
                    </div>

                   
                </div>
                )
        }
    }   
}

export default connect( (props)=> ({
    nodeinfo: {url:`/nodes/${props.node_id}`},
}))(NodeInfo)