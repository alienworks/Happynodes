import React, { Component } from 'react'
import { connect } from 'react-refetch'
import emojiFlags from 'emoji-flags';
import ClientSideLatency from './ClientSideLatency';
import config from './config'

class NodeInfo extends Component {
    render() {
        const { nodeinfo } = this.props;
        
        if (nodeinfo.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (nodeinfo.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (nodeinfo.fulfilled) {
            console.log("nodeinfo", nodeinfo)

            const data = nodeinfo.value;

            const boxStyle = {
                'backgroundColor': 'hsl(' + data.health_score + ',100%,50%)',
                'float': 'left',
                padding: '2rem',
                margin: '4px 2rem 2rem 0px',
            }
            const gap = (data.max_blockheight > data.blockheight) ? "(" + (data.blockheight - data.max_blockheight) + ")" : "";

            var date_min_ts = new Date(data.min_ts * 1000);
            var date_last_ts = new Date(data.last_update_time * 1000);
            var last_ts = date_last_ts.toLocaleTimeString() + " " + date_last_ts.toLocaleDateString();
            var min_ts = date_min_ts.toLocaleTimeString() + " " + date_min_ts.toLocaleDateString();

            return (
                <div className="jumbotron nodes" style={{ display: 'inline-block', width: '100%' }}>
                    <div className="node-box" style={boxStyle}><p>{Number(data.health_score.toFixed(0))}</p></div>
                    <h2 style={{ float: 'left', 'overflowWrap': 'break-word', 'width': '80%' }}>{data.address}</h2>

                    <hr style={{
                        'clear': 'left',
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />

                    <h3>Node Status Information</h3>
                    <hr />

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
                        <h4>{Number((Number(data.latency)).toFixed(0)).toLocaleString()}</h4>
                        <h5>Server Side Latency (ms)</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{Number((Number(data.average_latency)).toFixed(0)).toLocaleString()}</h4>
                        <h5>Avg Latency (ms) (Last 200 pings)</h5>
                    </div>

                    <ClientSideLatency url={data.address} />

                    <div className="infoblock">
                        <h4>{data.version}</h4>
                        <h5>Version</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{min_ts}</h4>
                        <h5>First Recorded</h5>
                    </div>

                    {data.wallet_status ? (
                        <div className="infoblock">
                            <h4>open</h4>
                            <h5>Wallet Status</h5>
                        </div>
                    ) : (
                            <div className="infoblock">
                                <h4>closed</h4>
                                <h5>Wallet Status</h5>
                            </div>
                        )}

                    {data.p2p_tcp_status ? (
                        <div className="infoblock">
                            <h4>online</h4>
                            <h5>P2P TCP Status</h5>
                        </div>
                    ) : (
                            <div className="infoblock">
                                <h4>offline</h4>
                                <h5>P2P TCP Status</h5>
                            </div>
                        )}

                    {data.p2p_ws_status ? (
                        <div className="infoblock">
                            <h4>online</h4>
                            <h5>P2P WS Status</h5>
                        </div>
                    ) : (
                            <div className="infoblock">
                                <h4>offline</h4>
                                <h5>P2P WS Status</h5>
                            </div>
                        )}


                    {data.rcp_http_status ? (
                        <div className="infoblock">
                            <h4>online</h4>
                            <h5>RPC HTTP Status</h5>
                        </div>
                    ) : (
                            <div className="infoblock">
                                <h4>offline</h4>
                                <h5>RPC HTTP Status</h5>
                            </div>
                        )}

                    {data.rcp_https_status ? (
                        <div className="infoblock">
                            <h4>online</h4>
                            <h5>RPC HTTPS Status</h5>
                        </div>
                    ) : (
                            <div className="infoblock">
                                <h4>offline</h4>
                                <h5>RPC HTTPS Status</h5>
                            </div>
                        )}

                    <div className="infoblock" style={{ clear: 'left' }}>
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

                    <div className="infoblock">
                        <h4>{last_ts}</h4>
                        <h5>Last Update Time</h5>
                    </div>

                    <h3 style={{ paddingTop: '4rem', clear: 'left' }}>Happynodes Score</h3>
                    <h5>Score is calculated by taking the average of four metrics</h5>
                    <hr />

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

export default connect((props) => ({
    nodeinfo: { url: config.api_url.concat(`/nodes/${props.node_id}`) },
}))(NodeInfo)