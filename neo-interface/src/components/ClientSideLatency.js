import React, { Component } from 'react'
import Ping from 'ping.js';

class ClientSideLatency extends Component {
    constructor(props) {
        super(props);
        this.state = {
            latency: 0
        }
        this.getLatency = this.getLatency.bind(this);
    }

    getLatency() {
        var p = new Ping();
        const url = this.props.url;

        var t0 = Date.now();

        p.ping(url, (err, data) => {
            var t1 = Date.now();
            this.setState({ latency: (t1 - t0) });
        });
    }

    componentDidMount() {
        this.getLatency()
    }

    render() {
        return (
            <div className="infoblock">
                <h4>{(this.state.latency.toFixed(0)).toLocaleString()}</h4>
                <h5>Live Client Side Latency (ms)</h5>
            </div>
        );
    }
}

export default ClientSideLatency;