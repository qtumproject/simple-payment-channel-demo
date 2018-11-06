import React from 'react';
import { Card } from 'antd';
import { searchLogs, getDepositValue, withdraw } from '../Contract/Contract'
import { Layout, Button, Input, Steps, message } from 'antd';

export class Withdraw extends React.Component {
  async withdraw() {
    const { account, channelId } = this.props
    await withdraw(account.qweb3, account.contract, account.address, channelId)
  }

  render() {
    const { withdrawalBalance } = this.props
    return <p>
      Withdrawal balance: {withdrawalBalance/1e8} QTUM
      <Button
      style={{marginLeft: "10px"}}
      disabled={withdrawalBalance <= 0}
      type="primary"
      onClick={() => this.withdraw()}
      >Withdraw</Button>
    </p>
  }
}
