import React from 'react';
import { Layout, Button, Input, Steps, message} from 'antd';
import {getTransactionReceipt} from '../../utils/contract';
const Search = Input.Search;

export class Deposit extends React.Component {
  async deposit(value) {
    const { account, channelId, } = this.props
    const {contract, qweb3} = account

    if (value === 0) {
      return
    }

    const txid = await contract.send('deposit', {
      amount: value * 1e8,  // 1 QTUM = 10^8 Satoshi
      methodArgs: [channelId],    // Sets the function params
      gasLimit: 1000000,  // Sets the gas limit to 1 million
      senderAddress: account.address,
    })

    console.log(txid)

    let receipt = await getTransactionReceipt(qweb3, txid.txid)
    receipt = receipt[0]
    console.log("receipt", receipt)
    if (receipt.excepted === 'None') {
      console.log("Success: deposit to channel")
      alert(`Deposited ${value} QTUM to channel`)
      this.setState({value: 0})
    } else {
      alert('deposit error')
      throw new Error("deposit error")
    }
  }
  render() {
    return <Search
        placeholder="deposit value in QTUM"
        enterButton="Deposit"
        size="large"
        onSearch={value => this.deposit(value)}
      />
  }
}
