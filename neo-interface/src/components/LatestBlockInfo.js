
import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class latestblockinfo extends Component {
    render() {
        const {latestblockinfo} = this.props
        if (latestblockinfo.pending) {
            return (
               <p></p>
            );
        }
        if (latestblockinfo.value === null || latestblockinfo.value === 'undefined'){
            return (
            <div>
                <div className="top-block red">
                <h3>0</h3>
                <p>BLOCK TIMESTAMP</p>
                </div>
                <div className="top-block green">
                <h3>0</h3>
                <p>NO. TX</p>
                </div>
                <div className="top-block orange">
                <h3>0</h3>
                <p>BLOCK SIZE</p>
                </div>
                <div className="top-block blue">
                <h3>42</h3>
                <p>LATEST BLOCK</p>
                </div>
                </div>

            );
        }

        var date = new Date(latestblockinfo.value.reply[3] * 1000)

        var hours = date.getHours();
        // Minutes part from the timestamp
        var minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        var seconds = "0" + date.getSeconds();

        // Will display time in 10:30:23 format
        var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

        return (
        <div>

            <div className="top-block red">
            <h3>{formattedTime}</h3>
            <p>BLOCK TIMESTAMP</p></div>



            <div className="top-block green">
            <h3>{Number(latestblockinfo.value.reply[2]).toLocaleString()}</h3>
            <p>TRANSACTIONS</p></div>

            <div className="top-block orange">
            <h3>{Number(latestblockinfo.value.reply[1]).toLocaleString()}</h3>
            <p>BLOCK SIZE</p></div>

            <div className="top-block blue">
            <h3>{Number(latestblockinfo.value.reply[0]).toLocaleString()}</h3>
            <p>LATEST BLOCK</p>
            </div>
            </div>
        );
    }
}
  
// export default LatestBlockInfo;

export default connect( (props)=> ({
    latestblockinfo: {
        url: config.api_url.concat(`/latestblock`),
        refreshInterval: 3000
    }
}))(latestblockinfo)
