import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ReactResizeDetector from 'react-resize-detector';

class HistoryTest extends Component {
    render() {
        const { historytest } = this.props;


        if (historytest.pending) {
            return (
                <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <div className="jumbotron">
                        <h2>Loading...</h2>
                    </div></div>
            )
        } else if (historytest.rejected) {

            return (
                <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <div>
                        error
                </div></div>
            )
        } else if (historytest.fulfilled) {
            let rows = historytest.value['data'];

            const SpecialAreaChart = ({ width, height }) => (

                <AreaChart width={width} height={400} data={rows}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type='monotone' dataKey='total' stroke='#8884d8' fill='#8884d8' />
                    <Area type='monotone' dataKey='totalonline' stroke='#82ca9d' fill='#82ca9d' />
                </AreaChart>

            );


            return (
                <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <div className="jumbotron nodes">

                        <h2>Historic View: Online and Total Nodes Daily</h2>
                        <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />

                        <h3>We released V1.1.0 (Node Discovery) at the start of August which is why the number of nodes we know about increased significantly after that.</h3>


                        <ReactResizeDetector handleWidth handleHeight>
                            <SpecialAreaChart />
                        </ReactResizeDetector>


                    </div></div>

            )
        }
    }
}



export default connect((props) => ({
    historytest: {
        url: config.api_url.concat(`/historic/network/size/daily`)
    }
}))(HistoryTest)