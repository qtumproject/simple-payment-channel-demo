import React, { Component } from 'react';
import 'antd/dist/antd.css';
import './App.css';
import { PrivateKey, Networks } from 'qtumcore-lib';
import Web3 from 'web3'
import { networks, Wallet } from "qtumjs-wallet"
import {sleep } from './utils/time'
import {sign } from './utils/crypto'
import {MakeOrJoinChannel} from './components/Channel/MakeOrJoinChannel'

import { Layout, Button, Input, Steps, message} from 'antd';
import { ImportWIF, importWIF } from './components/Wallet/ImportWIF';
import { ChannelInfo } from './components/Channel/ChannelInfo';
const { Header, Footer, Sider, Content } = Layout;

const Step = Steps.Step;

const web3 = new Web3();

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      account: null,
      channelId: null,
      webSocket: null,
    };

    this.handleCounterpartAddressChange = this.handleCounterpartAddressChange.bind(this);
    this.handleCounterpartECRecoveryAddressChange = this.handleCounterpartECRecoveryAddressChange.bind(this);
    this.handlemyECRecoveryAddressChange = this.handlemyECRecoveryAddressChange.bind(this);
    this.handleDepositValueChange = this.handleDepositValueChange.bind(this);
    this.handlePaymentValueChange = this.handlePaymentValueChange.bind(this);

    this.getECRecoveryAddress = this.getECRecoveryAddress.bind(this);
  }


  handlePaymentValueChange(e) { this.setState({ paymentValue: e.target.value }) }
  handleDepositValueChange(e) { this.setState({ depositValue: e.target.value }) }
  handleCounterpartAddressChange(e) { this.setState({ counterpartAddress: e.target.value }) }
  handleCounterpartECRecoveryAddressChange(e) { this.setState({ counterpartECRecoveryAddress: e.target.value }) }
  handlemyECRecoveryAddressChange(e) { this.setState({ myECRecoveryAddress: e.target.value }) }
  getECRecoveryAddress(e) {
    this.setState({myECRecoveryAddress: ''})
  }

  componentWillMount() {
  }

  async componentDidMount() {
    const webSocket = new WebSocket("ws://localhost:8080/ws");
    webSocket.addEventListener('open', (event) => {
      this.setState({webSocket})
    })
  }

  async makeChannel() {
    const {
      myAddress, myECRecoveryAddress,
      counterpartAddress, counterpartECRecoveryAddress,
      contract, qweb3, channelId,
    } = this.state

    if (channelId) {
      await this.getMyDepositValue(channelId)
      return
    }

    const blkNum = 100

    const txid = await contract.send('makeChannel', {
      methodArgs: [myAddress, myECRecoveryAddress, counterpartAddress, counterpartECRecoveryAddress, blkNum],    // Sets the function params
      gasLimit: 1000000,  // Sets the gas limit to 1 million
      senderAddress: myAddress,
    })
    console.log(txid)

    let receipt = await this.getTransactionReceipt(txid.txid)
    receipt = receipt[0]
    if (receipt.excepted === 'None') {
      console.log("Success: create channel")
    }

    {
      const channelId = parseInt(receipt['log'][0]['data'], 16)
      this.setState({channelId})
      console.log("channel id:", channelId)
    }
  }



  async next() {
    let func

    switch(this.state.current) {
      case 0:
      func = () =>  this.importPrivateKey()
      break;
      case 1:
      func = () => this.makeChannel()
      break;
      case 2:
      func = () => this.deposit()
      break;
      case 3:
      func = () => this.payment()
      break;
      default:
      return false
    }

    const err = await func()
    if (err) {
      alert(err)
      return
    }

    const current = this.state.current + 1;
    this.setState({ current });
  }

  prev() {
    const current = this.state.current - 1;
    this.setState({ current });
  }

  handlePrivateKeyChange = (e) => {
    this.setState({ myPrivateKey: e.target.value })
  }

  render() {

    /*
    const { current, myAddress, myECRecoveryAddress } = this.state;

    let content
    const steps = [{
      title: 'Import private key',
      content: <div>
        <p><label>Private Key</label><Input onChange={this.handlePrivateKeyChange} value={this.state.myPrivateKey}></Input></p>
      </div>,
    },{
      title: 'Create a Channel',
      content: <div>
        <p>Your QTUM Address: {myAddress}</p>
        <p>Your ECRecovery address: {myECRecoveryAddress}</p>

        <p><label>Counterpart QTUM Address</label><Input onChange={this.handleCounterpartAddressChange} value={this.state.counterpartAddress}></Input></p>
        <p><label>Counterpart ECRecovery Address</label><Input onChange={this.handleCounterpartECRecoveryAddressChange} value={this.state.counterpartECRecoveryAddress}></Input></p>
      </div>,
    }, {
      title: 'Deposit to channel',
      content: <>
      <p>deposit value: {this.state.myDepositValue} QTUM</p>
      <p><Input onChange={this.handleDepositValueChange} value={this.state.depositValue} /></p>
      </>,
    }, {
      title: 'Create a payment',
      content: <>
      <p><Input onChange={this.handlePaymentValueChange} value={this.state.paymentValue} /></p>
      </>,
    }, {
      title: 'Claim',
      content: 'claim',
    }, {
      title: 'Withdraw',
      content: 'Withdraw',
    }];
    content = (<><Steps current={current}>
              {steps.map(item => <Step key={item.title} title={item.title} />)}
            </Steps>
            <div className="steps-content">{steps[current].content}</div>
            <div className="steps-action">
              {
                current < steps.length - 1
                && <Button type="primary" onClick={() => this.next()}>
                  Next
                </Button>
              }
              {
                current === steps.length - 1
                && <Button type="primary" onClick={() => message.success('Processing complete!')}>Done</Button>
              }
              {
                current > 0
                && (
                  <Button style={{ marginLeft: 8 }} onClick={() => this.prev()}>
                    Previous
          </Button>
                )
              }
            </div></>)

    */



    return (
      <Layout>
        <Header className="header"><h1>Starter kit <span>a State Channel demo in QTUM</span></h1></Header>
        <Layout>
          <Content>{this.renderContent()}</Content>
        </Layout>
        <Footer>Starter kit ©2018 Created by <a href="https://github.com/dcb9">dcb9</a></Footer>
      </Layout>
    );
  }

  renderContent() {
    const {account, channelId, webSocket} = this.state
    if (!account) {
      return <ImportWIF handleUpdateAccount={(acc) => this.handleUpdateAccount(acc)} />
    }

    if (!channelId) {
      return <MakeOrJoinChannel
        handleUpdateChannelId={(channelId) => this.handleUpdateChannelId(channelId)}
        account={account}
        webSocket={webSocket}
      />
    }

    return <ChannelInfo
      channelId={channelId}
      account={account}
      webSocket={webSocket}
    />
  }

  handleUpdateChannelId(channelId) {
    console.log(channelId)
    this.setState({channelId})
  }

  handleUpdateAccount(account) {
    this.setState({account})
  }
}

export default App;
