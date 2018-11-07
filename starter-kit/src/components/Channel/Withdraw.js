import React from 'react';
import { withdraw } from '../Contract/Contract'
import { Button } from 'antd';

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
