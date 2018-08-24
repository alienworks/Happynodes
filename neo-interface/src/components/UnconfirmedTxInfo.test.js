import React from 'react';
import ReactDOM from 'react-dom';
import UnconfirmedTxInfo from './UnconfirmedTxInfo';
import renderer from 'react-test-renderer';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<UnconfirmedTxInfo />, div);
    ReactDOM.unmountComponentAtNode(div);
});

var data = {"data":{"jsonrpc":"2.0","id":1,"result":{"txid":"0x0f2db24bf1fd93c4da75d390fc5733fdc5a8e9c04a966a30bc9195a4448519e0","size":202,"type":"ContractTransaction","version":0,"attributes":[],"vin":[{"txid":"0x550ac998ce924810fca35739dd609a2cbd295d490d370f20bbd4b117a8f7550e","vout":1}],"vout":[{"n":0,"asset":"0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b","value":"1","address":"AWH581PR16ARnu7sPWdx8Gzvpb7hWXcj64"}],"sys_fee":"0","net_fee":"0","scripts":[{"invocation":"407f697652e095575b5b63ff4fbf86bb7b6fc79ce150e17e344ee8a0213500a46f912c8b5078c34a13e4eaa985e1a9c99786b82e57a6086699963af80c94655c43","verification":"2103279039fa598ab5ca11e47d0f1b957666eaa989cb729c426344e66cb60910136dac"}]}}}


describe("test against valid snapshot", ()=> {
    it("redner as expected", ()=> {
        const tree = renderer.create(<UnconfirmedTxInfo unconfirmTxInfo={{fulfilled:true,value:data}} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
  