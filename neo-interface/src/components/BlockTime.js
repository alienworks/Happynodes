
import React, { Component } from 'react'
import { connect } from 'react-refetch'

class BlockTime extends Component {
    render() {
        const {blocktime} = this.props

        if (blocktime.pending) {
            return (
               <p></p>
            );
        }
        return (
            <div class="top-block yellow">
            <h2>{blocktime.value.blocktime}s</h2>
            <p>AVG BLOCK TIME</p></div>
        );
    }
}
  

export default connect( (props)=> ({
    blocktime: {
        url: `/blocktime`,
        refreshInterval: 3000
    }
}))(BlockTime)