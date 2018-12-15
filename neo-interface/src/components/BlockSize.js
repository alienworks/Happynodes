
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
                <h2>42</h2>
                <p>BEST BLOCK</p>
                </div>
            );
        }
        return (
            <div className="top-block orange">
            <h2>{Number(blocksize.value.reply[1]).toLocaleString()}</h2>
            <p>BEST BLOCK</p></div>
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
