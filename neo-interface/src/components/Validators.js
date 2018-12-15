import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'


class Validators extends Component {
    render() {
        const { validators } = this.props;

        if (validators.pending) {
            return (

                    <div className="jumbotron nodes">
                        <h2>Loading...</h2>
                    </div>
            )
        } else if (validators.rejected) {
            return (

                    <div>
                        error
                </div>
            )
        } else if (validators.fulfilled) {
            
            let allvalidators = validators.value.validators.replace(/\'/g, '"')
            allvalidators = allvalidators.replace(/False/g, "false")
            allvalidators = allvalidators.replace(/True/g, "true")
            console.log(allvalidators)
            let parsed_allvalidators = JSON.parse(allvalidators)

            return (

                    <div className="jumbotron nodes">
                        <h2>Validators</h2>
                        <h3>Consensus Nodes ({parsed_allvalidators.filter(item => item.active).length})</h3> <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />

                        <ol>
                        {parsed_allvalidators.filter(item => item.active).map((item, i) =>
                        <li>
                        <h6>{item.publickey}</h6>
                        <h5>Votes: {item.votes}</h5>
                        </li>
                        )

                        }

                        </ol>

                        <br />
                        <h3 style={{ clear: 'left', 'paddingTop': '2rem' }}>Candidate Nodes ({parsed_allvalidators.filter(item => !item.active).length})</h3> <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />
                        <ol>
                        {parsed_allvalidators.filter(item => !item.active).map((item, i) =>
                        <li>
                        <h6>{item.publickey}</h6>
                        <h5>Votes: {item.votes}</h5>
                        </li>
                        )

                        }</ol>
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