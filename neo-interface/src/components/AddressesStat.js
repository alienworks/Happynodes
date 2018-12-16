
import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class addressesstat extends Component {
    render() {
        const {addressesstat} = this.props
        if (addressesstat.pending) {
            return (
               <p></p>
            );
        }
        if (addressesstat.value === null || addressesstat.value === 'undefined'){
            return (
                <div className="top-block olive">
                <h3>0/0</h3>
                <p>ADDRESSES (3M Active/Total)</p>
                </div>
            );
        }
        return (
            <div className="top-block olive">
            <h3>{Number(addressesstat.value.addressesstat[0]).toLocaleString()}/{Number(addressesstat.value.addressesstat[1]).toLocaleString()}</h3>
            <p>Addresses (3M Active/Total)</p></div>
        );
    }
}
  
// export default addressesstat;

export default connect( (props)=> ({
    addressesstat: {
        url: config.api_url.concat(`/addressesstat`),
        refreshInterval: 3000
    }
}))(addressesstat)
