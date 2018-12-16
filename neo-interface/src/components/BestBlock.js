
import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class bestblock extends Component {
    render() {
        const {bestblock} = this.props
        if (bestblock.pending) {
            return (
               <p></p>
            );
        }
        if (bestblock.value === null || bestblock.value === 'undefined'){
            return (
                <div className="top-block blue">
                <h3>42</h3>
                <p>LATEST BLOCK</p>
                </div>
            );
        }
        return (
            <div className="top-block blue">
            <h3>{Number(bestblock.value.reply[0]).toLocaleString()}</h3>
            <p>LATEST BLOCK</p></div>
        );
    }
}
  
// export default bestblock;

export default connect( (props)=> ({
    bestblock: {
        url: config.api_url.concat(`/latestblock`),
        refreshInterval: 3000
    }
}))(bestblock)
