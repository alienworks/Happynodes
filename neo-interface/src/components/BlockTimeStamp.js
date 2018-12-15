
import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class blocktimestamp extends Component {

    render() {
        const {blocktimestamp} = this.props
        if (blocktimestamp.pending) {
            return (
               <p></p>
            );
        }
        if (blocktimestamp.value === null || blocktimestamp.value === 'undefined'){
            return (
                <div className="top-block grey">
                <h2>42</h2>
                <p>BLOCK TIMESTAMP</p>
                </div>
            );
        }
        var date = new Date(blocktimestamp.value.reply[3] * 1000)

        var hours = date.getHours();
        // Minutes part from the timestamp
        var minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        var seconds = "0" + date.getSeconds();

        // Will display time in 10:30:23 format
        var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

        return (
            <div className="top-block grey">
            <h2>{formattedTime}</h2>
            <p>BLOCK TIMESTAMP</p></div>
        );
    }
}
  
// export default blocktimestamp;

export default connect( (props)=> ({
    blocktimestamp: {
        url: config.api_url.concat(`/latestblock`),
        refreshInterval: 3000
    }
}))(blocktimestamp)
