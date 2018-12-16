import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class LastTime extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lastblocktime: 0,
            seconds: 0
        };
    }
    tick() {
        if (this.props.lastblock.fulfilled) {

            this.setState(() => ({
                lastblocktime: this.props.lastblock.value.lastblock,
                seconds: (this.state.lastblocktime > 0) ? ((new Date() - new Date(Number(this.state.lastblocktime) * 1000)) / 1000).toFixed(0) : 0
            }));
        }
    }

    componentDidMount() {
        this.interval = setInterval(() => this.tick(), 500);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }
    render() {
        const { lastblock } = this.props

        if (lastblock.pending) {
            return (
                <br />
            );
        }


        return (
            <div className="top-block pink">

                <h3>{this.state.seconds}s ago</h3>


                <p>LAST BLOCK SEEN</p></div>
        );
    }
}

export default connect((props) => ({
    lastblock: {
        url: config.api_url.concat(`/lastblock`),
        refreshInterval: 1000
    }
}))(LastTime)