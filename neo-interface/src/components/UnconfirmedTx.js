import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class UnconfirmedTx extends Component {
    static defaultProps = {
        node_id: '-1'
    }

    render() {

        const { unconfirmed, bestBlock } = this.props;

        if (unconfirmed.pending || bestBlock.pending) {
            return (
                <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                    <div className="jumbotron">
                        <h2>Loading...</h2>
                    </div></div>
            )
        } else if (unconfirmed.rejected || bestBlock.rejected) {

            return (
                <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                    <div>
                        error
                </div></div>
            )
        } else if (unconfirmed.fulfilled && bestBlock.fulfilled) {
            console.log(unconfirmed.value)

            const txs = unconfirmed.value['txs'];
            const last_block = Number(bestBlock.value.bestblock);
            const top_10_txs = txs.slice(0, 10);

            return (
                <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                    <div className="jumbotron nodes">
                        <h2>{txs.length} Unconfirmed Transactions for block {(last_block + 1).toLocaleString()}</h2>

                        <h5>Showing top 10 (ranked by node agreement)</h5>
                        <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />

                        <table className="table">
                            <thead>
                                <tr><th className="tx_td">Transaction Reference</th><th className="node_td">Node Count</th></tr></thead>

                            <tbody>
                                {top_10_txs.map((item, i) =>
                                    <tr key={i}>
                                        <td className="tx_td"><a target="_blank" href={'/unconfirmedtxinfo/' + item.tx.substring(2) + '/' + item.connection_id}>{item.tx.substring(2)}</a></td><td className="node_td">{item.node_count}</td>
                                    </tr>
                                )}
                            </tbody></table>

                    </div></div>
            )
        }
    }
}


export default connect((props) => ({
    unconfirmed: {
        url: config.api_url.concat(`/unconfirmed`),
        refreshInterval: 2000
    },
    bestBlock: {
        url: config.api_url.concat(`/bestBlock`),
        refreshInterval: 2000
    }
}))(UnconfirmedTx)