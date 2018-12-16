import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { textFilter, selectFilter } from 'react-bootstrap-table2-filter';

class NetworkTable extends Component {
  render() {
    const { networktable, addr_filter, version_filter, blockheight_filter } = this.props;

    if (networktable.pending) {
      return (
        <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <div className="jumbotron">
            <h2>Loading...</h2>
          </div>
        </div>
      )
    } else if (networktable.rejected) {
      return (
        <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <div>
            error
                </div>
        </div>
      )
    } else if (networktable.fulfilled) {
      let rows = networktable.value;
      let max_bh = networktable.value[0].max_blockheight;

      const selectOptions = {
        true: "true",
        false: "false"
      };

      function hyperlinkFormatter(cell, row){
        return (
          <a href={"/" + cell}>{cell}</a>
        )
      }

      const columns = [{
        dataField: 'id',
        text: 'ID',
        sort: true,
        formatter: hyperlinkFormatter
      }, {
        dataField: 'health_score',
        text: 'Health Score',
        sort: true,
        formatter: (cell) => { return parseFloat(cell).toFixed(2) }
      }, {
        dataField: 'blockheight',
        text: 'Blockheight',
        sort: true,
        filter: textFilter({
          defaultValue: blockheight_filter
        }),
        formatter: (cell) => { return max_bh - cell > 0 ? String(cell) + " (-" + (max_bh - cell) + ")" : cell }
      }, {
        dataField: 'address',
        text: 'Address',
        sort: true,
        filter: textFilter({
                defaultValue: addr_filter
              })
      }, {
        dataField: 'online',
        text: 'Online',
        sort: true,
        filter: selectFilter({
          options: selectOptions
        })
      }, {
        dataField: 'stability',
        text: 'Stability',
        sort: true
      }, {
        dataField: 'wallet_status',
        text: 'Wallet Open',
        sort: true,
        formatter: cell => selectOptions[cell],
        filter: selectFilter({
          options: selectOptions
        })
      }, {
        dataField: 'p2p_tcp_status',
        text: 'P2P',
        sort: true,
        formatter: cell => selectOptions[cell],
        filter: selectFilter({
          options: selectOptions
        })
      }, {
        dataField: 'p2p_ws_status',
        text: 'Websocket',
        sort: true,
        formatter: cell => selectOptions[cell],
        filter: selectFilter({
          options: selectOptions
        })
      }, {
        dataField: 'connection_counts',
        text: 'Connections',
        sort: true
      }, {
        dataField: 'version',
        text: 'Version',
        sort: true,
        filter: textFilter({
                defaultValue: version_filter
              })
      }, {
        dataField: 'latency',
        text: 'Latency',
        sort: true,
        formatter: (cell) => { return cell === 200 ? "Can't be reached" : parseFloat(cell).toFixed(2) }
      }, {
        dataField: 'average_latency',
        text: 'Avg Latency',
        sort: true,
        formatter: (cell) => { return cell === 200 ? "Can't be reached" : parseFloat(cell).toFixed(2) }
      }, {
        dataField: 'mempool_size',
        text: 'Unconfirmed Tx',
        sort: true
      }, {
        dataField: 'min_ts',
        text: 'Date first Seen',
        sort: true,
        formatter: (cell) => { return new Date(cell * 1000).toLocaleTimeString() + " " + new Date(cell * 1000).toLocaleDateString()}

      }, {
        dataField: 'last_update_time',
        text: 'Last Updated',
        sort: true,
        formatter: (cell) => { return new Date(cell * 1000).toLocaleTimeString() + " " + new Date(cell * 1000).toLocaleDateString()}
      }
      ];


      const defaultSorted = [{
        dataField: 'blockheight',
        order: 'desc'
      }];

      window.setInterval(() => { document.getElementById("row_count").innerText = document.getElementById("network_table").rows.length - 1 }, 100);


      return (
        <div className="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <div className="jumbotron nodes">

            <h2>Table View</h2>
            <hr style={{
              'borderColor': '#78cadd', 'borderWidth': '3px'
            }} />

            <h3>Rows: <span id="row_count"></span></h3>

            <BootstrapTable id="network_table" keyField='id' data={rows} columns={columns}
              ref="network_table"
              defaultSorted={defaultSorted}
              striped
              hover
              condensed
              filter={filterFactory()}/>
            </div>
          </div>

      )
    }
  }
}



export default connect((props) => ({
  networktable: {
    url: config.api_url.concat(`/nodes_flat`),
    refreshInterval: 1000
  }
}))(NetworkTable)
