import React from 'react';
import { Button, Input } from 'antd';
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
    return <>
      <label>Bob address:</label>
      <Input onChange={(e) => this.setState({address: e.target.value})} value={this.state.address}></Input>
      <label>Bob EC recovery address:</label>
      <Input onChange={(e) => this.setState({ecRecoveryAddress: e.target.value})} value={this.state.ecRecoveryAddress}></Input>
      <Button onClick={() => this.makeChannel()}>Make a channel</Button>
      <Button onClick={this.props.handleBack}>Back</Button>
    </>
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
    window.localStorage.setItem("lastJoinedChannelId", this.state.channelId)
  }

  render() {
    return <>
      <label>channel id:</label>
      <Input onChange={(e) => this.setState({channelId: e.target.value})} value={this.state.channelId}></Input>
      <Button onClick={() => this.joinChannel()}>Join</Button>
      <Button onClick={this.props.handleBack}>Back</Button>
    </>
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

  render() { return <div>{this.renderContent()}</div> }

  handleUpdateChannelId(channelId) {
    if (!isMyChannel(this.props.account, channelId)) {
      throw new Error("invalid channel id")
    }
    console.log("channelId:", channelId)

    channelId = parseInt(channelId)
    this.props.webSocket.send(JSON.stringify({type: 0, data: { channelId }}))
    this.props.handleUpdateChannelId(channelId)
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

    return <>
      <Button onClick={() => this.makeChannel()}>Create</Button>
      /
      <Button onClick={() => this.joinChannel()}>Join</Button>
      a channel
    </>
  }
}
