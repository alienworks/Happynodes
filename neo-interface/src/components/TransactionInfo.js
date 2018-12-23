import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class TransactionInfo extends Component {
    render() {
        const { txinfo } = this.props;
        
        if (txinfo.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (txinfo.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (txinfo.fulfilled) {
            const data = txinfo.value.data.result[0];
            let vout = data.vout
            let vout_addrs = vout.map((v, i, arr) => {
                return v.address;
            })
            let vout_addrs_unique = new Set(vout_addrs)

            let vins = data.vin
            let vin_txs = vins.map((v, i, arr) => {
                return v.txid;
            })

            let y = JSON.stringify(txinfo.value.data.result[0], null, 4, 50)


            return (
                <div className="jumbotron nodes" style={{ display: 'inline-block', width: '100%' }}>

                    <h2 style={{ float: 'left', 'overflowWrap': 'break-word', 'width': '80%' }}>TX {data.txid}</h2>

                    <hr style={{
                        'clear': 'left',
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />

                    <h3>Transaction Summary</h3>
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
                        <h4>{data.blockindex}</h4>
                        <h5>Block Index</h5>
                    </div>
                    <div className="infoblock">
                        <h4>{data.type}</h4>
                        <h5>Type</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{data.sys_fee}</h4>
                        <h5>System Fee</h5>
                    </div>

                    <div className="infoblock">
                        <h4>{data.net_fee}</h4>
                        <h5>Network Fee</h5>
                    </div>

                    <h3 style={{ paddingTop: '4rem', clear: 'left' }}>VINs Transaction List (i.e. Preceding Linked Transactions)</h3>


                    <table className="table">
                        <tbody>
                            {vin_txs.map((item, i) =>
                                <tr key={i}>
                                    <td className="tx_td" style={{ 'padding': '1rem' }}><a href={'./' + item}>0x{item}</a></td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <h3 style={{ paddingTop: '4rem', clear: 'left' }}>Addresses Involved</h3>


                    <table className="table">
                        <tbody>
                            {Array.from(vout_addrs_unique).map((item, i) =>
                                <tr key={i}>
                                    <td className="tx_td" style={{ 'padding': '1rem' }}><a href={'../address/' + item}>{item}</a></td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <h3 style={{ paddingTop: '4rem', clear: 'left' }}>Scripts</h3>
                    <hr />

                    <div className="infoblock">
                    <p style={{ 'wordBreak': 'break-all'}}>{data.scripts.length > 0 ? data.scripts[0].invocation : ""}</p>
                    <h5>Invocation Script</h5>

                    </div>

                    <div className="infoblock">
                    <p style={{ 'wordBreak': 'break-all'}}>{data.scripts.length > 0 ? data.scripts[0].verification : ""}</p>
                    <h5>Verification Script</h5>

                    </div>

                    <h3 style={{ paddingTop: '4rem', clear: 'left' }}>Raw Info</h3>
                    <hr />

                    <pre>{y}</pre>



                </div>
            )
        }
    }
}

export default connect((props) => ({
    txinfo: { url: config.api_url.replace('/redis', '').concat(`/transaction/${props.tx_id}`) },
}))(TransactionInfo)