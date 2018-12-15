import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'


class Validators extends Component {
    render() {
        const { validators } = this.props;

        if (validators.pending) {
            return (
                <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                    <div className="jumbotron">
                        <h2>Loading...</h2>
                    </div></div>
            )
        } else if (validators.rejected) {
            return (
                <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                    <div>
                        error
                </div></div>
            )
        } else if (validators.fulfilled) {
            
            let allvalidators = validators.value.validators.replace(/\'/g, '"')
            allvalidators = allvalidators.replace(/False/g, "false")
            allvalidators = allvalidators.replace(/True/g, "true")
            console.log(allvalidators)
            let parsed_allvalidators = JSON.parse(allvalidators)

            return (
                <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
                    <div className="jumbotron nodes">
                        <h2>Validators</h2>
                        <h3>Consensus </h3> <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />

                        {parsed_allvalidators.filter(item => item.active).map((item, i) => <h4>Address: {item.publickey }</h4> )
                        }
                        
                        <br />
                        <h3 style={{ clear: 'left', 'paddingTop': '2rem' }}>Candidate </h3> <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />
                        {parsed_allvalidators.filter(item => !item.active).map((item, i) => <h4>Address: {item.publickey } </h4> )
                        }
                        }
                    </div>
                </div>
            )
        }
    }
}


export default connect((props) => ({
    validators: {
        url: config.api_url.concat(`/validators`),
        refreshInterval: 3000
    }
}))(Validators)