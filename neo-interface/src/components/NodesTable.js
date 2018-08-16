import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class NodesTable extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { nodes } = this.props

        if (nodes.pending) {
            return (
                <div class="well"> Loading </div>
            );
        }
        return (
            <div class="container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Type</th>
                            <th>Blockheight</th>
                            <th>Mempool Size</th>
                            <th>Latency (ms)</th>
                            <th>Block Height</th>
                            <th>Peers</th>
                            <th>Stability</th>
                            <th>Version</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nodes.value.map((node, i) =>
                            <tr key={i}>
                                <td>{node.address}</td>
                                <td>RPC</td>
                                <td>{node.blockheight}</td>
                                <td>{node.mempool_size}</td>
                                <td>{node.latency}</td>
                                {node.rpc_http_status === true &&
                                    <td>Okay</td>
                                }
                                {node.rpc_http_status === false &&
                                    <td>N/A</td>
                                }
                                {node.rpc_http_status === true &&
                                    <td>Okay</td>
                                }
                                {node.rpc_http_status === false &&
                                    <td>N/A</td>
                                }
                                {node.online === true &&
                                    <td>Online</td>
                                }
                                {node.online === false &&
                                    <td>Offline</td>
                                }
                                <td>{node.rpc_http_status}</td>
                                <td>{node.rpc_https_status}</td>
                                <td>{node.connection_counts}</td>
                                <td>{node.count} pct</td>
                                <td>{node.version}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

            </div>
        );
    }
}

export default connect((props) => ({
    nodes: {
        url: config.api_url.concat(`/nodes`),
        refreshInterval: 5000
    }
}))(NodesTable)