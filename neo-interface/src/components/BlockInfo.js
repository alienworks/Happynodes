import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class BlockInfo extends Component {
    render() {
        const { blockinfo } = this.props;
        
        if (blockinfo.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (blockinfo.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (blockinfo.fulfilled) {
            console.log("blockinfo", blockinfo.value.data.result[0])

            const data = blockinfo.value.data.result[0];

            const boxStyle = {
                backgroundColor: '#acf3ae',
                float: 'left',
                padding: '2rem',
                margin: '4px 2rem 2rem 0px',
            }

            var date_min_ts = new Date(data.min_ts * 1000);
            var date_last_ts = new Date(data.last_update_time * 1000);
            var last_ts = date_last_ts.toLocaleTimeString() + " " + date_last_ts.toLocaleDateString();
            var min_ts = date_min_ts.toLocaleTimeString() + " " + date_min_ts.toLocaleDateString();

            return (
                <div className="jumbotron nodes" style={{ display: 'inline-block', width: '100%' }}>

                    <h2 style={{ float: 'left', 'overflowWrap': 'break-word', 'width': '80%' }}>Block {data.index}</h2>
                    <a href={data.index+1} style={{float: 'right',paddingRight: '1rem'}}>Next</a>
                    <a href={data.index-1} style={{float: 'right',paddingRight: '1rem'}}>Previous</a>
                    <hr style={{
                        'clear': 'left',
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />

                    <h3>Block Summary</h3>
                    <hr />

                    <div className="infoblock">
                        <h4>{data.size}</h4>
                        <h5>Size</h5>
                    </div>
                    <div className="infoblock">
                        <h4>{data.version}</h4>
                        <h5>Version</h5>
                    </div>
                    <div className="infoblock">
                        <h4>{data.hash}</h4>
                        <h5>Blockhash</h5>
                    </div>
                    <div className="infoblock">
                        <h4>{data.previousblockhash}</h4>
                        <h5>Previous Blockhash</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{data.merkleroot}</h4>
                        <h5>Merkle Root</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{data.tx.length}</h4>
                        <h5># Transactions</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{data.time}</h4>
                        <h5>Timestamp</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{data.nonce}</h4>
                        <h5>Nonce</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{data.nextconsensus}</h4>
                        <h5>Next Consensus Address</h5>
                    </div>

                    <h3 style={{ paddingTop: '4rem', clear: 'left' }}>Scripts</h3>
                    <hr />

                    <div className="infoblock">
                    <p style={{ 'wordBreak': 'break-all'}}>{data.script.invocation}</p>
                    <h5>Invocation Script</h5>

                    </div>

                    <div className="infoblock">
                    <p style={{ 'wordBreak': 'break-all'}}>{data.script.verification}</p>
                    <h5>Verifcation Script</h5>

                    </div>

                    <h3 style={{ paddingTop: '4rem', clear: 'left' }}>Transactions</h3>
                    <hr />

                    <ul>
                    {data.tx.map((item, i) =>
                                <li key={i} >
                                    <a style={{ fontSize: '2rem'}} href={"../transaction/" + item.txid}>{item.txid}</a>
                                </li>
                            )
                            }
                    </ul>



                </div>
            )
        }
    }
}

export default connect((props) => ({
    blockinfo: { url: config.api_url.replace('/redis', '').concat(`/block/${props.block_id}`) },
}))(BlockInfo)