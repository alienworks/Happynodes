
import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class BlockTime extends Component {
    render() {
        const {blocktime} = this.props

        if (blocktime.pending) {
            return (
               <p></p>
            );
        }
        
        if (blocktime.value === null || blocktime.value === 'undefined'){
            return (
                <div className="top-block yellow">
                <h2>0s</h2>
                <p>AVG BLOCK TIME</p></div>
            );
        }
        return (
            <div className="top-block yellow">
            <h2>{blocktime.value.blocktime}s</h2>
            <p>AVG BLOCK TIME</p></div>
        );
    }
}
  

export default connect( (props)=> ({
    blocktime: {
        url: config.api_url.concat(`/blocktime`),
        refreshInterval: 3000
    }
}))(BlockTime)