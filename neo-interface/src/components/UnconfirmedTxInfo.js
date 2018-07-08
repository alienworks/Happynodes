import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class UnconfirmedTxInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hash: 0,
            time: 0,
            networkFee: 0,
            systemFee: 0,
            size: 0
        };
    }

    render() {
        console.log(this.props.tx)
        console.log(this.props.protocol)
        console.log(this.props.hostname)
        console.log(this.props.port)
        const { unconfirmTxInfo } = this.props

        if (unconfirmTxInfo.pending) {
            return (
                <br />
            );
        }

        console.log(unconfirmTxInfo.value.data.result)


        return (
            <div className="top-block pink">
                <p>blockhash: {unconfirmTxInfo.value.data.result.blockhash}</p>
                <p>blocktime: {unconfirmTxInfo.value.data.result.blocktime}</p>
                <p>type: {unconfirmTxInfo.value.data.result.type}</p>
                <p>txid: {unconfirmTxInfo.value.data.result.txid}</p>
                <p>size: {unconfirmTxInfo.value.data.result.size} bytes </p>
                <p>gas: {unconfirmTxInfo.value.data.result.gas}</p>
                <p>net_fee: {unconfirmTxInfo.value.data.result.net_fee}</p>
                <p>sys_fee: {unconfirmTxInfo.value.data.result.sys_fee}</p>
                {/* <p>script: {unconfirmTxInfo.value.data.result.script}</p> */}
                
            </div>
        );
    }
}

export default connect((props) => ({
    unconfirmTxInfo: {
        method: 'POST',
        url: config.api_url.replace('/redis','').concat(`/unconfirmed/tx`),
        body: JSON.stringify({'tx': props.tx, 'addressid': props.addressid})
    }
}))(UnconfirmedTxInfo)