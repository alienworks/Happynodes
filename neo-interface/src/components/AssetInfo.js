import React, { Component } from 'react'
import { connect } from 'react-refetch'
import config from './config'

class AssetInfo extends Component {
    render() {
        const { assetinfo } = this.props;
        
        if (assetinfo.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (assetinfo.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (assetinfo.fulfilled) {
            console.log("assetinfo", assetinfo.value.data.result[0])

            const data = assetinfo.value.data.result[0];

            const boxStyle = {
                backgroundColor: '#acf3ae',
                float: 'left',
                padding: '2rem',
                margin: '4px 2rem 2rem 0px',
            }

            return (
                <div className="jumbotron nodes" style={{ display: 'inline-block', width: '100%' }}>

                    <h2 style={{ float: 'left', 'overflowWrap': 'break-word', 'width': '80%' }}>Asset {data.id}</h2>
                    <hr style={{
                        'clear': 'left',
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />

                    <div className="infoblock">
                        <h4>{data.amount}</h4>
                        <h5>Amount</h5>
                    </div>
                    <div className="infoblock">
                        <h4>{data.admin}</h4>
                        <h5>Admin Address</h5>
                    </div>
                    <div className="infoblock">
                        <h4>{data.issuer}</h4>
                        <h5>Issuer Address</h5>
                    </div>
                    <div className="infoblock">
                        <h4>{data.type}</h4>
                        <h5>Type</h5>
                    </div>

                    <h3 style={{ paddingTop: '4rem', clear: 'left' }}>Names</h3>
                    <hr />

                    <ul>
                    {data.name.map((item, i) =>
                                <li key={i} >
                                    {item.name}
                                </li>
                            )
                            }
                    </ul>



                </div>
            )
        }
    }
}

export default connect((props) => ({
    assetinfo: { url: config.api_url.replace('/redis', '').concat(`/asset/${props.asset_id}`) },
}))(AssetInfo)