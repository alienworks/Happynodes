import IntervalRenderer from 'react-interval-renderer';
import React, { Component } from 'react'
import { connect } from 'react-refetch'

class LastTime extends Component {
    constructor(props) {
            super(props);
            this.state = { lastblocktime: 0,
            seconds: 0 };
          }
    tick() {
            this.setState(() => ({
              seconds: (this.state.lastblocktime > 0) ? ((new Date() - new Date(Number(this.state.lastblocktime)*1000))/1000).toFixed(0) : 0
            }));
          }

  componentDidMount() {
            this.interval = setInterval(() => this.tick(), 500);
  }

  componentWillUnmount() {
            clearInterval(this.interval);
  }
    render() {
        const {lastblock} = this.props

        if (lastblock.pending) {
            return (
                <br/>
            );
        }

        this.state.lastblocktime = lastblock.value.lastblock;

        return (
            <div class="top-block pink">
            
            <h2>{this.state.seconds}s ago</h2>

             
            <p>LAST BLOCK SEEN</p></div>
        );
    }
}
  
export default connect( (props)=> ({
    lastblock: {
        url: `/lastblock`,
        refreshInterval: 3000
    }
}))(LastTime)