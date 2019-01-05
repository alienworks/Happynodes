import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class NEP5AssetRank extends Component {
    render() {
        const { assetrank, asset_id } = this.props;
        
        if (assetrank.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (assetrank.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (assetrank.fulfilled) {
            const data = assetrank.value.data.result;
            console.log(asset_id);

            return (
                <div className="jumbotron nodes" style={{ display: 'inline-block', width: '100%' }}>

                    <h2 style={{ float: 'left', 'overflowWrap': 'break-word', 'width': '80%' }}>Top 100 Addresses for {asset_id}</h2>
                    <hr style={{
                        'clear': 'left',
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />

                    <table className="table">
                        <thead>
                        <tr>
                        <th>Rank</th>
                        <th>Address</th>
                        <th>Balance</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((item, i) =>
                        <tr key={i}>
                        <td>{i+1}</td>
                        <td><a href={"../address/"+item.addr}>{item.addr}</a></td>
                        <td>{item.balance}</td>
                        </tr>
                        )

                        }

                        </tbody>
                    </table>


                </div>
            )
        }
    }
}

export default connect((props) => ({
    assetrank: { url: config.api_url.replace('/redis', '').concat(`/balancerank/${props.asset_id}/100/1`) }
}))(NEP5AssetRank)