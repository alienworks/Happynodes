
import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class blocksize extends Component {
    render() {
        const {blocksize} = this.props
        if (blocksize.pending) {
            return (
               <p></p>
            );
        }
        if (blocksize.value === null || blocksize.value === 'undefined'){
            return (
                <div className="top-block orange">
                <h3>42</h3>
                <p>BLOCK SIZE</p>
                </div>
            );
        }
        return (
            <div className="top-block orange">
            <h3>{Number(blocksize.value.reply[1]).toLocaleString()}</h3>
            <p>BLOCK SIZE</p></div>
        );
    }
}
  
// export default blocksize;

export default connect( (props)=> ({
    blocksize: {
        url: config.api_url.concat(`/latestblock`),
        refreshInterval: 3000
    }
}))(blocksize)
