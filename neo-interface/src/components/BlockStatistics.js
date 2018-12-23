import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ReactResizeDetector from 'react-resize-detector';
import moment from 'moment';

class BlockStatistics extends Component {
    render() {
        const { blockstats } = this.props;


        if (blockstats.pending) {
            return (
                <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <div className="jumbotron">
                        <h2>Loading...</h2>
                    </div></div>
            )
        } else if (blockstats.rejected) {

            return (
                <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <div>
                        error
                </div></div>
            )
        } else if (blockstats.fulfilled) {
            let rows = JSON.parse(blockstats.value['data']);

            const SpecialAreaChart = ({ width, height }) => (

                <AreaChart width={width} height={400} data={rows}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis domain = {['dataMin', 'dataMax']} dataKey="name" tickFormatter = {(unixTime) => moment(unixTime*1000).format('YYYY-MM-DD')}
        type = 'number'/>
                    <YAxis />
                    <Tooltip labelFormatter = {(value, name, props) => moment(value*1000).format('YYYY-MM-DD')}/>
                    <Area type='monotone' dataKey='blocks' stroke='#8884d8' fill='#8884d8' />
                </AreaChart>

            );

            const SpecialAreaChart2 = ({ width, height }) => (

                <AreaChart width={width} height={400} data={rows}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis domain = {['dataMin', 'dataMax']} dataKey="name" tickFormatter = {(unixTime) => moment(unixTime*1000).format('YYYY-MM-DD')}
        type = 'number'/>
                    <YAxis />
                    <Tooltip labelFormatter = {(value, name, props) => moment(value*1000).format('YYYY-MM-DD')}/>
                    <Area type='monotone' dataKey='txs' stroke='#8884d8' fill='#8884d8' />
                </AreaChart>

            );

            const SpecialAreaChart3 = ({ width, height }) => (

                <AreaChart width={width} height={400} data={rows}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis domain = {['dataMin', 'dataMax']} dataKey="name" tickFormatter = {(unixTime) => moment(unixTime*1000).format('YYYY-MM-DD')}
        type = 'number'/>
                    <YAxis />
                    <Tooltip labelFormatter = {(value, name, props) => moment(value*1000).format('YYYY-MM-DD')}/>
                    <Area type='monotone' dataKey='txs_per_block' stroke='#8884d8' fill='#8884d8' />
                </AreaChart>

            );

            const SpecialAreaChart4 = ({ width, height }) => (

                <AreaChart width={width} height={400} data={rows}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis domain = {['dataMin', 'dataMax']} dataKey="name" tickFormatter = {(unixTime) => moment(unixTime*1000).format('YYYY-MM-DD')}
        type = 'number'/>
                    <YAxis />
                    <Tooltip labelFormatter = {(value, name, props) => moment(value*1000).format('YYYY-MM-DD')}/>
                    <Area type='monotone' dataKey='size' stroke='#8884d8' fill='#8884d8' />
                </AreaChart>

            );

            return (
                <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <div className="jumbotron nodes">

                        <h2>Blockchain Statistics (Daily)</h2>
                        <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />

                        <h3># Blocks</h3>


                        <ReactResizeDetector handleWidth handleHeight>
                            <SpecialAreaChart />
                        </ReactResizeDetector>

                        <h3># Transactions</h3>


                        <ReactResizeDetector handleWidth handleHeight>
                            <SpecialAreaChart2 />
                        </ReactResizeDetector>

                        <h3>Txs per Block</h3>


                        <ReactResizeDetector handleWidth handleHeight>
                            <SpecialAreaChart3 />
                        </ReactResizeDetector>

                        <h3>Average Block Size</h3>


                        <ReactResizeDetector handleWidth handleHeight>
                            <SpecialAreaChart4 />
                        </ReactResizeDetector>


                    </div></div>

            )
        }
    }
}



export default connect((props) => ({
    blockstats: {
        url: config.api_url.concat(`/blockstatistics/day`)
    }
}))(BlockStatistics)