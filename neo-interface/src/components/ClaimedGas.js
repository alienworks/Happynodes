
import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class claimedgas extends Component {
    render() {
        const {claimedgas} = this.props
        if (claimedgas.pending) {
            return (
               <p></p>
            );
        }
        if (claimedgas.value === null || claimedgas.value === 'undefined'){
            return (
                <div className="top-block green">
                <h3>0.0</h3>
                <p>CLAIMED GAS</p>
                </div>
            );
        }
        return (
            <div className="top-block green">
            <h3>{Number(Number(claimedgas.value.last_updated_tot_gas).toFixed(0)).toLocaleString()}</h3>
            <p>CLAIMED GAS</p></div>
        );
    }
}
  
// export default claimedgas;

export default connect( (props)=> ({
    claimedgas: {
        url: config.api_url.concat(`/lastupdatedtotgas`),
        refreshInterval: 3000
    }
}))(claimedgas)
