import React from 'react';
import { Input } from 'antd';
import Web3 from 'web3'
import {sign} from '../../utils/crypto'

const Search = Input.Search;
const web3 = new Web3();

export class MakePayment extends React.Component {

// receivable={receivable}
// myDepositValue={myDepositValue}
// spend={spend}
// account={account}
// channelId={channelId}

  async payment(value) {
    const {bobAddressHex, channelId, account, spend, myDepositValue, receivable, onPayment} = this.props
    if (value * 1e8 < spend) {
      alert('value must be larger than latest payment')
      return
    }

    if (myDepositValue + receivable < value) {
      alert('invalid value')
      return
    }

    const payment = await this.createPayment(account.privateKeyHex, channelId, bobAddressHex, value)
    payment.payer = account.addressHex
    await onPayment(payment)
  }

  async createPayment(payerPrivateKey, channelId, recipient, value) {
    console.log(`Creating a payment to ${recipient} with ${value} QTUM...`)
    value = parseInt(value * 1e8)
    const paymentHash = await web3.utils.soliditySha3(channelId, recipient, value)
    const timestamp = parseInt(new Date().getTime() / 1000);
    const payment = {
      sig: await sign(web3, paymentHash, payerPrivateKey),
      value: value,
      channelId,
      recipient,
      timestamp,
    }
    console.log("Payment:", payment)
    console.log()
    return payment
  }

  render() {
    return <Search
      placeholder="value in QTUM"
      enterButton="Make a payment"
      size="large"
      onSearch={value => this.payment(value)}
    />
  }
}
