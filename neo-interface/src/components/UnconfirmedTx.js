import React, { Component } from 'react'
import { connect } from 'react-refetch'
import { Link } from 'react-router-dom'
import { Tooltip, OverlayTrigger, Button} from 'react-bootstrap'


class UnconfirmedTx extends Component {
    static defaultProps = {
        node_id: '-1'
    }

    render() {
        
        const { unconfirmed } = this.props;

        if (unconfirmed.pending) {
            return (
             <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                 <div className="jumbotron">
                    <h2>Loading...</h2>
                    </div></div>
            )
        }else if (unconfirmed.rejected  ) {
            return (
            <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                <div>
                    error
                </div></div>
            )
        } else if (unconfirmed.fulfilled ) {
            
            const txs = unconfirmed.value['txs'];
            const last_block = Number(unconfirmed.value['last_blockheight']);
            const top_10_txs = txs.slice(0,10);

            return (
            <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                <div className="jumbotron nodes">
                    <h2>{txs.length} Unconfirmed Transactions for block {last_block+1}</h2>

                    <h5>Showing top 10 (ranked by node agreement)</h5>
                    <hr style={{
                        'border-color': '#78cadd', 'border-width': '3px'}}/>

                    <table className="table">
                    <thead>
                    <tr><th className="tx_td">Transaction Reference</th><th className="node_td">Node Count</th></tr></thead>

                   <tbody>
                    {top_10_txs.map((item,i) => 
                        
                        <tr>    
                        <td className="tx_td"><a target="_blank" href={'https://neotracker.io/tx/'+item.tx.substring(2)}>{item.tx.substring(2)}</a></td><td className="node_td">{item.node_count}</td>
                        </tr>
                        
                    
                                    )
                                }
                          </tbody>      </table>

                </div></div>
                )
        }
    }   
}



export default connect( (props)=> ({
    unconfirmed: {url:`/unconfirmed`,
    refreshInterval: 1000}

}))(UnconfirmedTx)