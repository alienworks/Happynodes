import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class UnconfirmedTxInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ajaxdone: false
        };
    }

    render() {
        const { unconfirmTxInfo } = this.props


        if (unconfirmTxInfo.pending) {
            return (
                <br />
            );
        }

        if (unconfirmTxInfo.fulfilled) {
            let vins = unconfirmTxInfo.value.data.result.vin
            let vin_txs = vins.map((v, i, arr) => {
                return v.txid.length === 66 ? v.txid.substring(2) : v.txid;
            })
            console.log(vin_txs);
            let y = JSON.stringify(unconfirmTxInfo.value, null, 4, 50)
            //let pretty_json = y.replace(/\"txid\": \"0x(\w+)\"/g,"\"txid\":\"&lt;a href=\"../$1\"&gt;$1&lt;/a&gt;")

            return (
                <div className="jumbotron">
                    <h2>Transaction Info for {unconfirmTxInfo.value.data.result.txid}</h2>
                    <hr style={{
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />
                    <table className="table">
                        <thead>
                            <tr><th className="tx_td">VINs Transaction List (i.e. Preceding linked Transactions)</th></tr></thead>
                        <tbody>
                            {vin_txs.map((item, i) =>
                                <tr key={i}>
                                    <td className="tx_td" style={{ 'padding': '1rem' }}><a href={'./' + item}>0x{item}</a></td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <pre>{y}</pre>


                </div>
            );
        }
    }
}

export default connect((props) => ({
    unconfirmTxInfo: {
        method: 'POST',
        url: config.api_url.replace('/redis', '').concat(`/unconfirmed/tx/`).concat(props.connection_id).concat('/').concat(props.tx)
    }
}))(UnconfirmedTxInfo)