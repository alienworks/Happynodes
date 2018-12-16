
import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class notx extends Component {
    render() {
        const {notx} = this.props
        if (notx.pending) {
            return (
               <p></p>
            );
        }
        if (notx.value === null || notx.value === 'undefined'){
            return (
                <div className="top-block green">
                <h3>42</h3>
                <p>NO. TX</p>
                </div>
            );
        }
        return (
            <div className="top-block green">
            <h3>{Number(notx.value.reply[2]).toLocaleString()}</h3>
            <p>TRANSACTIONS</p></div>
        );
    }
}
  
// export default notx;

export default connect( (props)=> ({
    notx: {
        url: config.api_url.concat(`/latestblock`),
        refreshInterval: 3000
    }
}))(notx)
