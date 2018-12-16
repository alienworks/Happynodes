import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'


class NetworkStatistics extends Component {
    render() {
        const { networkstatistics } = this.props;

        if (networkstatistics.pending) {
            return (

                    <div className="jumbotron nodes">
                        <h2>Loading...</h2>
                    </div>
            )
        } else if (networkstatistics.rejected) {
            console.log(networkstatistics);
            return (

                    <div>
                        error
                </div>
            )
        } else if (networkstatistics.fulfilled) {

            var stats = networkstatistics.value.networkstatistics;
            var totaladdresses = stats[0];
            var activeaddresses = stats[1];
            var claimedgas = stats[2];
            var lastblockgas = stats[3];


            return (

                    <div className="jumbotron nodes">
                        <img style={{marginTop:'10px', float:'right'}} width="25px"  src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjUxMnB4IiB2aWV3Qm94PSIxIC0xIDUxMS45OTk5OCA1MTEiIHdpZHRoPSI1MTJweCI+PHBhdGggZD0ibTc5LjI5Njg3NSAzMDAuNzkyOTY5aC02Ni4wNjY0MDZjLTcuMzA4NTk0IDAtMTMuMjMwNDY5IDUuOTIxODc1LTEzLjIzMDQ2OSAxMy4yMzA0Njl2MTk2LjM5ODQzN2g5Mi41MjczNDR2LTE5Ni4zOTg0MzdjMC03LjMwODU5NC01LjkyNTc4Mi0xMy4yMzA0NjktMTMuMjMwNDY5LTEzLjIzMDQ2OXptMCAwIiBmaWxsPSIjNDljM2UwIi8+PHBhdGggZD0ibTQ0LjEzNjcxOSAzMDAuNzkyOTY5aC0zMC45MDYyNWMtNy4zMDg1OTQgMC0xMy4yMzA0NjkgNS45MjE4NzUtMTMuMjMwNDY5IDEzLjIzMDQ2OXYxOTYuMzk0NTMxaDMwLjkwNjI1di0xOTYuMzk0NTMxYzAtNy4zMDg1OTQgNS45MjE4NzUtMTMuMjMwNDY5IDEzLjIzMDQ2OS0xMy4yMzA0Njl6bTAgMCIgZmlsbD0iIzAwYTVjNiIvPjxwYXRoIGQ9Im0yMTkuMTIxMDk0IDI0OC45ODA0NjloLTY2LjA2NjQwNmMtNy4zMDg1OTQgMC0xMy4yMzA0NjkgNS45MjE4NzUtMTMuMjMwNDY5IDEzLjIzMDQ2OXYyNDguMjEwOTM3aDkyLjUyNzM0M3YtMjQ4LjIxMDkzN2MwLTcuMzA4NTk0LTUuOTI1NzgxLTEzLjIzMDQ2OS0xMy4yMzA0NjgtMTMuMjMwNDY5em0wIDAiIGZpbGw9IiMzYWM3YjQiLz48cGF0aCBkPSJtMTgzLjk2MDkzOCAyNDguOTgwNDY5aC0zMC45MDYyNWMtNy4zMDg1OTQgMC0xMy4yMzA0NjkgNS45MjE4NzUtMTMuMjMwNDY5IDEzLjIzMDQ2OXYyNDguMjEwOTM3aDMwLjkwNjI1di0yNDguMjEwOTM3YzAtNy4zMDg1OTQgNS45MjE4NzUtMTMuMjMwNDY5IDEzLjIzMDQ2OS0xMy4yMzA0Njl6bTAgMCIgZmlsbD0iIzAwYWQ5NCIvPjxwYXRoIGQ9Im0zNTguOTQ1MzEyIDE5Ny4xNjc5NjloLTY2LjA2NjQwNmMtNy4zMDQ2ODcgMC0xMy4yMzA0NjggNS45MjE4NzUtMTMuMjMwNDY4IDEzLjIzMDQ2OXYzMDAuMDE5NTMxaDkyLjUyNzM0M3YtMzAwLjAxOTUzMWMwLTcuMzA4NTk0LTUuOTIxODc1LTEzLjIzMDQ2OS0xMy4yMzA0NjktMTMuMjMwNDY5em0wIDAiIGZpbGw9IiNmZmNkMzgiLz48cGF0aCBkPSJtMzIzLjc4NTE1NiAxOTcuMTY3OTY5aC0zMC45MDYyNWMtNy4zMDQ2ODcgMC0xMy4yMzA0NjggNS45MjU3ODEtMTMuMjMwNDY4IDEzLjIzMDQ2OXYzMDAuMDIzNDM3aDMwLjkwNjI1di0zMDAuMDIzNDM3YzAtNy4zMDg1OTQgNS45MjU3ODEtMTMuMjMwNDY5IDEzLjIzMDQ2OC0xMy4yMzA0Njl6bTAgMCIgZmlsbD0iI2U3YjgzNSIvPjxwYXRoIGQ9Im00OTguNzY5NTMxIDE0NS4zNTU0NjloLTY2LjA2NjQwNmMtNy4zMDQ2ODcgMC0xMy4yMjY1NjMgNS45MjE4NzUtMTMuMjI2NTYzIDEzLjIzMDQ2OXYzNTEuODMyMDMxaDkyLjUyMzQzOHYtMzUxLjgzMjAzMWMwLTcuMzA4NTk0LTUuOTIxODc1LTEzLjIzMDQ2OS0xMy4yMzA0NjktMTMuMjMwNDY5em0wIDAiIGZpbGw9IiNmZjhjNTciLz48cGF0aCBkPSJtNDYzLjYwOTM3NSAxNDUuMzU1NDY5aC0zMC45MDYyNWMtNy4zMDQ2ODcgMC0xMy4yMzA0NjkgNS45MjE4NzUtMTMuMjMwNDY5IDEzLjIzMDQ2OXYzNTEuODM1OTM3aDMwLjkwNjI1di0zNTEuODM1OTM3YzAtNy4zMDg1OTQgNS45MjU3ODItMTMuMjMwNDY5IDEzLjIzMDQ2OS0xMy4yMzA0Njl6bTAgMCIgZmlsbD0iI2VjNmEzNCIvPjxwYXRoIGQ9Im00ODguMjA3MDMxIDMuNDY0ODQ0LTgzLjU4OTg0My0yLjk2MDkzOGMtNi45MTAxNTctLjI0MjE4Ny0xMS4xNDA2MjYgNy41MDM5MDYtNy4xOTUzMTMgMTMuMTg3NWwxMy40ODQzNzUgMTkuNDA2MjVjLTQ1LjM5ODQzOCAyNy4xOTkyMTktMTkwLjY3MTg3NSAxMDMuNjY0MDYzLTM4OC41NzQyMTkgMTAzLjY2NDA2M3Y1NS41MTU2MjVjMTM0LjEwOTM3NSAwIDI0NC44OTg0MzgtMzMuMjE0ODQ0IDMxNC4yMjI2NTctNjEuMDc4MTI1IDUwLjcxODc1LTIwLjM4NjcxOSA4Ny4wODIwMzEtNDAuNzg1MTU3IDEwNi4wOTM3NS01Mi4zOTg0MzhsMTEuOTU3MDMxIDE3LjIxNDg0NGMzLjk0NTMxMiA1LjY3OTY4NyAxMi42ODM1OTMgNC40MjE4NzUgMTQuODY3MTg3LTIuMTQwNjI1bDI2LjQwNjI1LTc5LjM2MzI4MWMxLjc2OTUzMi01LjMyMDMxMy0yLjA3MDMxMi0xMC44NDc2NTctNy42NzE4NzUtMTEuMDQ2ODc1em0wIDAiIGZpbGw9IiNkYTViNjUiLz48L3N2Zz4K" />
                        <h2>Network Statistics</h2>
                        <hr style={{
                        'clear': 'left',
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />
                        <div>
                        <h3>{Number(activeaddresses).toLocaleString()}</h3>
                        <p>ADDRESSES ACTIVE IN LAST 3 MONTHS</p>
                        </div>
                        <div>
                        <h3>{Number(totaladdresses).toLocaleString()}</h3>
                        <p>TOTAL ADDRESSES CREATED</p>
                        </div>
                        <div>
                        <h3>{Number(Number(claimedgas).toFixed(0)).toLocaleString()}</h3>
                        <p>TOTAL AMOUNT OF CLAIMED GAS</p></div>




                    </div>

            )
        }
    }
}


export default connect((props) => ({
    networkstatistics: {
        url: config.api_url.concat(`/networkstatistics`),
        refreshInterval: 3000
    }
}))(NetworkStatistics)