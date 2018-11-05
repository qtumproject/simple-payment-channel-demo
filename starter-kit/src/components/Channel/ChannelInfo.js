import React from 'react';
import { Card } from 'antd';
import {searchLogs, getDepositValue} from '../Contract/Contract'
import { Withdraw } from './Withdraw';
import { Deposit } from './Deposit';
import { MakePayment } from './MakePayment';
import { Claim } from './Claim';

export class ChannelInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      myDepositValue:0,
      bobDepositValue:0,
      receivable:0,
      spend: 0,
      bobAddress: '',
      bobAddressHex: '0x0',
      isOpening: true,
      currentBlock: 0,
      expireBlock: 0,
      qweb3: this.props.account.qweb3,
    };

    this.fromBlock=  0
  }

  componentDidMount() {
    this.loadChannelInfo()
  }

  componentWillUnmount() {
    clearTimeout(this.timerID);
  }

  async getCurrentBlock() {
    const info = await this.state.qweb3.getBlockchainInfo()
    // console.log(info)
    return info.blocks
  }

  async getLogs() {
    const {qweb3} = this.state
    const { channelId, account } = this.props

    const logs = await searchLogs(qweb3, {
      fromBlock: this.fromBlock,
      toBlock: -1,
      addresses: [account.contract.address],
    })

    // 9f4e0d16577d705169224549bfbc339ebecaf2a6f875cdbc9268c898d57c77b1 is LogChannel event

    logs.forEach((log) => {
      log.log.forEach(async (l) => {
        switch(l._eventName) {
          case 'LogChannel':
            const channelNum = parseInt(l.channelnum.toString(16), 16)
            if (channelNum === parseInt(channelId, 10)) {
              let bobAddressHex
              if (l.bob === account.addressHex) {
                bobAddressHex = l.user
              } else if (l.user === account.addressHex) {
                bobAddressHex = l.bob
              } else {
                console.log(`you are neither Alice nor Bob of the channel ${channelId}`)
                return
              }

              const expireBlock = parseInt(l.expireblock.toString(16), 16)
              const bobAddress = await qweb3.fromHexAddress(bobAddressHex)

              this.setState({
                expireBlock,
                bobAddressHex,
                bobAddress,
              })
            }
          break;
          default:
          break;
        }
      })
    })

    if (logs.length > 0) {
      console.log(logs)
      this.fromBlock = logs[logs.length-1].blockNumber + 1
    }
  }

  async loadChannelInfo() {
    const { channelId, account } = this.props

    let receivable = window.localStorage.getItem(`receivable-${channelId}`)
    receivable = !receivable ? 0 : parseInt(receivable, 10) / 1e8
    let spend = window.localStorage.getItem(`spend-${channelId}`)
    spend = !spend ? 0 : parseInt(spend, 10) / 1e8

    const currentBlock = await this.getCurrentBlock()
    await this.getLogs()
    const bobDepositValue = await getDepositValue(account.contract, this.state.bobAddressHex, channelId) / 1e8
    const myDepositValue = await getDepositValue(account.contract, account.addressHex, channelId) / 1e8

    this.setState({
      receivable,
      spend,
      currentBlock,
      bobDepositValue,
      myDepositValue,
    })

    this.timerID = setTimeout(() => this.loadChannelInfo(), 1000)
  }

  render() {
    const {
      myDepositValue, bobDepositValue, receivable, spend, bobAddress, bobAddressHex, isOpening, currentBlock, expireBlock,
    } = this.state
    return <div style={{ background: '#ECECEC', padding: '30px' }}>
      <Card title={`channel id ${this.props.channelId}`} bordered={false}>
        <p>My deposit value: {myDepositValue} QTUM</p>
        <p>Bob deposit value: {bobDepositValue} QTUM</p>
        <p>Receivable: {receivable} QTUM</p>
        <p>Spend: {spend} QTUM</p>
        <p>Bob address: {bobAddress}</p>
        <p>Bob hex address: {bobAddressHex}</p>
        <p>Is opening: {isOpening ? 'T': 'F'}</p>
        <p>Current block: {currentBlock}</p>
        <p>Expire block: {expireBlock}</p>

        <br />
        {this.renderButtons()}
      </Card>
    </div>
  }

  renderButtons() {
    const {isOpening} = this.state
    let btns
    if (isOpening) {
      btns = <>
        <p><Deposit account={this.props.account} channelId={this.props.channelId} /></p>
        <p><MakePayment /></p>
        <p><Claim /></p>
      </>
    } else {
      btns = <p><Withdraw /></p>
    }
    return <div>{btns}</div>
  }
}
