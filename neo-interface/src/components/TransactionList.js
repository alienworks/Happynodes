import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'


class TransactionList extends Component {
    render() {
        const { txlist } = this.props;

        if (txlist.pending) {
            return (

                    <div className="jumbotron nodes">
                        <h2>Loading...</h2>
                    </div>
            )
        } else if (txlist.rejected) {
            console.log(txlist);
            return (

                    <div>
                        error
                </div>
            )
        } else if (txlist.fulfilled) {
            console.log(txlist.value);
            let data = txlist.value.data.result;
            console.log(data)

            return (

                    <div className="jumbotron nodes">
                        <img style={{marginTop:'10px', float:'right'}} width="25px"  src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzFfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjI1NS44OTQ2IiB5MT0iNTE0LjA0OCIgeDI9IjI1NS44OTQ2IiB5Mj0iMi4yMjUxIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDEuMDAwMyAwIDAgLTEuMDAwMyAwLjAxNjkgNTE0LjIyNTgpIj4KCTxzdG9wIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzJBRjU5OCIvPgoJPHN0b3Agb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA5RUZEIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxwYXRoIHN0eWxlPSJmaWxsOnVybCgjU1ZHSURfMV8pOyIgZD0iTTI1NS45OTksNTEybC04LjEzNC0zLjYxOWMtMi4wODktMC45MjktNTEuNzQ1LTIzLjI2MS0xMDEuODkyLTY2LjA4NiAgYy0yOS44MjMtMjUuNDY5LTUzLjY3NS01Mi45NzYtNzAuODg4LTgxLjc1N2MtMjIuMDA0LTM2Ljc4OS0zMy4xNTktNzUuNjYyLTMzLjE1OS0xMTUuNTM5VjEyNC4yOSAgYzAtMjkuMDk1LDIwLjg1LTUzLjk1LDQ5LjU3Ni01OS4wOTdjNDguNTAyLTguNjkyLDkzLjE2OC0zNS4xOCwxMTUuNDc2LTUwLjE5NUMyMjEuNTUyLDUuMTg2LDIzOC41MDMsMCwyNTUuOTk5LDAgIHMzNC40NDcsNS4xODYsNDkuMDIyLDE0Ljk5NmMyMi4zMDgsMTUuMDE1LDY2Ljk3NCw0MS41MDMsMTE1LjQ3Nyw1MC4xOTVsMCwwYzI4LjcyNiw1LjE0OCw0OS41NzYsMzAuMDAyLDQ5LjU3Niw1OS4wOTd2MTIwLjcxICBjMCwzOS44NzctMTEuMTU3LDc4Ljc0OS0zMy4xNTksMTE1LjUzOWMtMTcuMjE0LDI4Ljc4MS00MS4wNjQsNTYuMjg4LTcwLjg4OCw4MS43NTdjLTUwLjE0Nyw0Mi44MjUtOTkuODAzLDY1LjE1Ny0xMDEuODkyLDY2LjA4NiAgTDI1NS45OTksNTEyeiBNMjU1Ljk5OSw0MC4wMTRjLTkuNTA1LDAtMTguNzMxLDIuODI4LTI2LjY3OCw4LjE3N2MtMjQuOTE5LDE2Ljc3My03NS4wNDMsNDYuNDAyLTEzMC43NjEsNTYuMzg3ICBjLTkuNjMsMS43MjYtMTYuNjIxLDEwLjAxNS0xNi42MjEsMTkuNzExdjEyMC43MWMwLDEyNi4zMywxMzguNjYsMjA0Ljg3OSwxNzQuMDYxLDIyMi44NjYgIGMxNS40MDEtNy44MTksNTAuMzU5LTI3LjA4NCw4NC43OTEtNTYuNjQzYzU5LjIzMy01MC44NSw4OS4yNjctMTA2Ljc3NSw4OS4yNjctMTY2LjIyNFYxMjQuMjljMC05LjY5NS02Ljk5LTE3Ljk4NS0xNi42MjEtMTkuNzExICBsMCwwYy01NS43MTgtOS45ODUtMTA1Ljg0My0zOS42MTYtMTMwLjc2MS01Ni4zODdDMjc0LjcyOSw0Mi44NDIsMjY1LjUwNCw0MC4wMTQsMjU1Ljk5OSw0MC4wMTR6IE0zODMuOTY5LDE3Ni4zMDVsLTI5Ljg2NC0yNi42MzIgIEwyMjUuMDE0LDI5NC40MzFsLTY4LjM4MS02NC4wMThsLTI3LjM0NywyOS4yMWw5OC4zMDcsOTIuMDM2TDM4My45NjksMTc2LjMwNXoiLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==" />
                        <h2>Latest Transactions</h2>
                        <hr/>


                        <table className="table">
                        <thead>
                        <th>TX ID</th>
                        <th style={{width:"15%"}}>Size</th>
                        <th>Type</th>
                        <th style={{width:"20%"}}>Block #</th>
                        </thead>
                        <tbody>
                        {data.map((item, i) =>
                        <tr key={i}>
                        <td><a href={"../transaction/"+item.txid}>{item.txid}</a></td>
                        <td>{item.size}</td>
                        <td>{item.type}</td>
                        <td>{item.blockindex}</td>

                        </tr>
                        )

                        }

                        </tbody>
                    </table>

                    </div>

            )
        }
    }
}


export default connect((props) => ({
    txlist: {
        url: config.api_url.replace('/redis', '').concat(`/transactions/30/1`),
        refreshInterval: 3000
    }
}))(TransactionList)