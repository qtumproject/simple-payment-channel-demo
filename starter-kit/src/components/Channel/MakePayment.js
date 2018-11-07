import React from 'react';
import { Input } from 'antd';
import Web3 from 'web3'
import {sign} from '../../utils/crypto'

const Search = Input.Search;
const web3 = new Web3();

export class MakePayment extends React.Component {

  async payment(value) {
    const {bobAddressHex, channelId, account, spend, myDepositValue, receivable, onPayment} = this.props
    value = parseInt(value * 1e8 + spend)

    if (myDepositValue + receivable < value) {
      alert('you dont have enough amount')
      return
    }

    const payment = await this.createPayment(account.privateKeyHex, channelId, bobAddressHex, value)
    payment.payer = account.addressHex
    await onPayment(payment)
  }

  async createPayment(payerPrivateKey, channelId, recipient, value) {
    console.log(`Creating a payment to ${recipient} with ${value} QTUM...`)
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
