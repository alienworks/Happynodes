import React, { Component } from 'react'
import { connect } from 'react-refetch'
import axios from 'axios';
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

        const assettable = {"0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b":"NEO",
                           "0X602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7":"GAS"}

        if (unconfirmTxInfo.pending) {
            return (
                <br />
            );
        }
        let vins = unconfirmTxInfo.value.data.result.vin


        if (!this.state.ajaxdone) {
            let i
            for (i in vins) {
                console.log("vin", vins[i])
                let vin = vins[i]
                let txid = vin.txid.substring(2)
                let voutidx = vin.vout
                console.log("txid", txid)
                axios.get(`https://neoscan.io/api/main_net/v1/get_transaction/` + txid)
                    .then(res => {
                        console.log(res.data.vouts[voutidx]);
                        let addr = res.data.vouts[voutidx].address_hash
                        let value = res.data.vouts[voutidx].value
                        let asset = res.data.vouts[voutidx].asset

                        unconfirmTxInfo.value.data.result.vin[i].addr = addr
                        unconfirmTxInfo.value.data.result.vin[i].value = value
                        unconfirmTxInfo.value.data.result.vin[i].asset = asset
                        if (i == vins.length - 1) {
                            this.setState({ ajaxdone: true })
                        }
                    })
            }
        }


        console.log("vin", unconfirmTxInfo.value.data.result.vout)

        return (
            <div className="top-block pink">
                <p>blockhash: {unconfirmTxInfo.value.data.result.blockhash}</p>
                <p>blocktime: {unconfirmTxInfo.value.data.result.blocktime}</p>
                <p>type: {unconfirmTxInfo.value.data.result.type}</p>
                {unconfirmTxInfo.value.data.result.vin.map(v => <p key={v.txid} >  vin: {v.addr} {v.value} {v.asset} </p>)}
                {unconfirmTxInfo.value.data.result.vout.map(v => <p key={v.txid} >  vout: {v.address} {v.value} {assettable[v.asset]} </p>)}

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
        url: config.api_url.replace('/redis', '').concat(`/unconfirmed/tx`),
        body: JSON.stringify({ 'tx': props.tx, 'addressid': props.addressid })
    }
}))(UnconfirmedTxInfo)