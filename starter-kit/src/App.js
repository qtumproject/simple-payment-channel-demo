import React, { Component } from 'react';
import 'antd/dist/antd.css';
import './App.css';
import DuplexChannelArtifact from './DuplexChannel.json';
import { Qweb3 } from 'qweb3'

import { Layout, Button, Input, Steps, message} from 'antd';
const { Header, Footer, Sider, Content } = Layout;

const Step = Steps.Step;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      qweb3: null,
      contract: null,
      account: null,

      current: 0,

      // create a channel form
      myAddress: '',
      myECRecoveryAddress: '0x6Fd56E72373a34bA39Bf4167aF82e7A411BFED47',
      counterpartAddress: 'qLn9vqbr2Gx3TsVR9QyTVB5mrMoh4x43Uf',
      counterpartECRecoveryAddress: '0x0CF28703ECc9C7dB28F3d496e41666445b0A4EAF',
      //

    };

    this.handleQryptoInstalledOrUpdated = this.handleQryptoInstalledOrUpdated.bind(this)
    this.handleQryptoAcctChanged = this.handleQryptoAcctChanged.bind(this)

    this.handleCounterpartAddressChange = this.handleCounterpartAddressChange.bind(this);
    this.handleCounterpartECRecoveryAddressChange = this.handleCounterpartECRecoveryAddressChange.bind(this);
    this.handlemyECRecoveryAddressChange = this.handlemyECRecoveryAddressChange.bind(this);

    this.getECRecoveryAddress = this.getECRecoveryAddress.bind(this);
  }

  handleCounterpartAddressChange(e) { this.setState({ counterpartAddress: e.target.value }) }
  handleCounterpartECRecoveryAddressChange(e) { this.setState({ counterpartECRecoveryAddress: e.target.value }) }
  handlemyECRecoveryAddressChange(e) { this.setState({ myECRecoveryAddress: e.target.value }) }
  getECRecoveryAddress(e) {
    this.setState({myECRecoveryAddress: ''})
  }

  componentWillMount() {
    window.postMessage({ message: { type: 'CONNECT_QRYPTO' } }, '*')
    window.addEventListener('message', this.handleQryptoInstalledOrUpdated, false);
    window.addEventListener('message', this.handleQryptoAcctChanged, false);
  }


  async componentDidMount() {
    await this.initContract()
  }

  async makeChannel() {
    const myAddress = this.state.account.address
    const {
      myECRecoveryAddress, counterpartAddress, counterpartECRecoveryAddress,
      contract
    }  = this.state

    const blkNum = 100

    const tx = await contract.send('makeChannel', {
      methodArgs: [myAddress, myECRecoveryAddress, counterpartAddress, counterpartECRecoveryAddress, blkNum],    // Sets the function params
      gasLimit: 1000000,  // Sets the gas limit to 1 million
      senderAddress: myAddress,
    })
    console.log(tx)
  }

  async next() {
    let func

    switch(this.state.current) {
      case 0:
      func = () => { return this.makeChannel() }
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

  async initContract() {
    const qweb3 = await this.getQweb3()
    const account = window.qrypto.account

    const contractAddress = DuplexChannelArtifact["networks"]["regtest"]["address"]
    const contractAbi = DuplexChannelArtifact["abi"]
    const contract = qweb3.Contract(contractAddress, contractAbi)

    this.setState({qweb3, contract, account})
    console.log(this.state)
  }

  async getQweb3() {
    while (!window.qrypto) {
      await sleep(100)
    }

    return new Qweb3(window.qrypto.rpcProvider)
  }

  handleQryptoAcctChanged(event) {
    if (event.data.message && event.data.message.type === "QRYPTO_ACCOUNT_CHANGED") {
      if (event.data.message.payload.error) {
        // handle error
      }
      this.setState({account: event.data.message.payload.account})
      console.log("account:", event.data.message.payload.account)
    }
  }

  handleQryptoInstalledOrUpdated(event) {
    if (event.data.message && event.data.message.type === 'QRYPTO_INSTALLED_OR_UPDATED') {
      // Refresh the page
      window.location.reload()
    }
  }

  render() {

    const { current, account } = this.state;

    let content
    if (account && account.loggedIn) {
      const steps = [{
        title: 'Create a Channel',
        content: <div>
          <p>Your QTUM Address: {account.address}</p>
          {/* <p><Button type="primary" onClick={this.getECRecoveryAddress}>sign a message</Button> to get my ECRecovery address</p> */}
          <p><label>Your ECRecovery address</label><Input onChange={this.handlemyECRecoveryAddressChange} value={this.state.myECRecoveryAddress}></Input></p>
          <p><label>Counterpart QTUM Address</label><Input onChange={this.handleCounterpartAddressChange} value={this.state.counterpartAddress}></Input></p>
          <p><label>Counterpart ECRecovery Address</label><Input onChange={this.handleCounterpartECRecoveryAddressChange} value={this.state.counterpartECRecoveryAddress}></Input></p>
        </div>,
      }, {
        title: 'Second',
        content: 'Second-content',
      }, {
        title: 'Last',
        content: 'Last-content',
      }];
      content = (<><Steps current={current}>
                {steps.map(item => <Step key={item.title} title={item.title} />)}
              </Steps>
              <div className="steps-content">{steps[current].content}</div>
              <div className="steps-action">
                {
                  current < steps.length - 1
                  && <Button type="primary" onClick={() => this.next()}>Next</Button>
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
    } else {
      content = <p>Please login your account</p>
    }

    return (
      <Layout>
        <Header className="header"><h1>Starter kit <span>a State Channel demo in QTUM</span></h1></Header>
        <Layout>
          <Content>{content}</Content>
        </Layout>
        <Footer>Starter kit ©2018 Created by <a href="https://github.com/dcb9">dcb9</a></Footer>
      </Layout>
    );
  }
}

export default App;
