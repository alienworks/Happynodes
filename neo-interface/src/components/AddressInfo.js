import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'


class AddressInfo extends Component {
    render() {
        const { addressinfo } = this.props;
        
        if (addressinfo.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (addressinfo.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (addressinfo.fulfilled) {
            console.log("addressinfo", addressinfo.value)
            const data = addressinfo.value;

            return (
                <div className="jumbotron nodes" style={{ display: 'inline-block', width: '100%' }}>

                    <h2 style={{ float: 'left', 'overflowWrap': 'break-word', 'width': '80%' }}>Address {data.address}</h2>

                    <hr style={{
                        'clear': 'left',
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />

                    <table className="table">
                        <thead><tr>
                        <th>Asset Name</th>
                        <th>Asset Symbol</th>
                        <th>Amount</th></tr>
                        </thead>
                        <tbody>
                        {data.balance.map((item, i) =>
                        <tr key={i}>
                        <td>{item.asset}</td>
                        <td>{item.asset_symbol}</td>
                        <td>{item.amount}</td>

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
    addressinfo: { url: "https://api.neoscan.io/api/main_net/v1/get_balance/".concat(`${props.addr}`) },
}))(AddressInfo)