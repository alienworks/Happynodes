import axios from 'axios'
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

        var t0 = performance.now();

        p.ping(url, (err, data) => {
        // Also display error if err is returned.
        if (err) {
            console.log("error loading resource")
            data = data + " " + err;
        }
        console.log("data", data);
        var t1 = performance.now();
        this.setState({ latency: (t1 - t0) });
        });

        // var xhttp = new XMLHttpRequest();
        // const url = this.props.url;

        // var t0 = performance.now();

        // axios.get(url, {
        //     timeout: 60000
        //   })
        //     .then((response) => {
        //         var t1 = performance.now();
        //         this.setState({ latency: (t1 - t0) });
        //     })
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