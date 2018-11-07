import React from 'react';
import { Button, Input, Card } from 'antd';
import {getTransactionReceipt} from '../../utils/contract'
import {isMyChannel} from './Channel'

class MakeChannel extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      address: '',
      ecRecoveryAddress: '',
    }
  }

  async makeChannel() {
    const blkNum = 100
    const {account} = this.props

    const txid = await account.contract.send('makeChannel', {
      methodArgs: [account.address, account.ecRecoveryAddress, this.state.address, this.state.ecRecoveryAddress, blkNum],    // Sets the function params
      gasLimit: 1000000,  // Sets the gas limit to 1 million
      senderAddress: account.address,
    })
    console.log(txid)

    let receipt = await getTransactionReceipt(account.qweb3, txid.txid)
    receipt = receipt[0]
    if (receipt.excepted === 'None') {
      console.log("Success: create channel")
    }

    {
      const channelId = parseInt(receipt['log'][0]['data'], 16)
      console.log("channel id:", channelId)
      this.props.handleUpdateChannelId(channelId)
    }
  }

  render() {
    return <Card title="Create a channel" bordered={false}>
      <label>Bob address</label>
      <Input onChange={(e) => this.setState({address: e.target.value})} value={this.state.address}></Input>
      <br /><br />
      <label>Bob EC recovery address</label>
      <Input onChange={(e) => this.setState({ecRecoveryAddress: e.target.value})} value={this.state.ecRecoveryAddress}></Input>
      <br /><br />
      <Button onClick={() => this.makeChannel()}>Make a channel</Button>
      <Button style={{marginLeft: '10px'}} onClick={this.props.handleBack}>Back</Button>
    </Card>
  }
}

class JoinChannel extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      channelId: '',
    }
  }

  componentDidMount() {
    this.setState({
      channelId: window.localStorage.getItem("lastJoinedChannelId")
    })
  }

  async joinChannel() {
    this.props.handleUpdateChannelId(this.state.channelId)
  }

  render() {
    return <Card title="Join a channel" bordered={false}>
      <label>channel id</label>
      <Input onChange={(e) => this.setState({channelId: e.target.value})} value={this.state.channelId}></Input>
      <br /><br />
      <Button onClick={() => this.joinChannel()}>Join</Button>
      <Button style={{marginLeft: '10px'}} onClick={this.props.handleBack}>Back</Button>
    </Card>
  }
}


export class MakeOrJoinChannel extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      showJoiningChannel: false,
      showMakeingChannel: false,
    }
  }

  joinChannel() { this.setState({showJoiningChannel: true}) }

  makeChannel() { this.setState({showMakeingChannel: true}) }

  handleBack() { this.setState({showMakeingChannel: false, showJoiningChannel: false}) }

  handleUpdateChannelId(channelId) {
    if (!isMyChannel(this.props.account, channelId)) {
      throw new Error("invalid channel id")
    }

    channelId = parseInt(channelId)
    this.props.webSocket.send(JSON.stringify({type: 0, data: { channelId }}))
    this.props.handleUpdateChannelId(channelId)
    window.localStorage.setItem("lastJoinedChannelId", channelId)
  }

  render() {
    return <div>{this.renderContent()}</div>
  }

  renderContent() {
    const { showJoiningChannel, showMakeingChannel } = this.state

    if (showJoiningChannel) {
      return <JoinChannel
        handleUpdateChannelId={(channelId) => this.handleUpdateChannelId(channelId)}
        handleBack={() => this.handleBack()}
      />
    } else if (showMakeingChannel) {
      return <MakeChannel
        handleUpdateChannelId={(channelId) => this.handleUpdateChannelId(channelId)}
        handleBack={() => this.handleBack()}
        account={this.props.account}
      />
    }

    return <Card title="Create or join a channel" bordered={false}>
      <Button onClick={() => this.makeChannel()}>Create a channel</Button>
      <br /><br />
      <Button onClick={() => this.joinChannel()}>Join a channel</Button>
    </Card>
  }
}
