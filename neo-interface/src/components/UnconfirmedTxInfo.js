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
        const { unconfirmTxInfo } = this.props

        if (unconfirmTxInfo.pending) {
            return (
                <br />
            );
        }

        console.log(unconfirmTxInfo)


        return (
            <div className="top-block pink">

                <h2>{this.state.seconds}s ago</h2>


                <p>LAST BLOCK SEEN</p></div>
        );
    }
}

export default connect((props) => ({
    unconfirmTxInfo: {
        method: 'POST',
        url: config.api_url.concat(`/unconfirmed/tx`),
        body: JSON.stringify({'tx': props.tx, 'url': props.url})
    }
}))(UnconfirmedTxInfo)