
import React, { Component } from 'react'
import { connect } from 'react-refetch'

class BestBlock extends Component {
    render() {
        const {bestBlock} = this.props

        if (bestBlock.pending) {
            return (
               <p></p>
            );
        }
        return (
            <div class="top-block blue">
            <h2>{Number(bestBlock.value.bestblock).toLocaleString()}</h2>
            <p>BEST BLOCK</p></div>
        );
    }
}
  
// export default BestBlock;

export default connect( (props)=> ({
    bestBlock: {
        url: `/bestblock`,
        refreshInterval: 3000
    }
}))(BestBlock)
