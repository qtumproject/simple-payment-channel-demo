import React from 'react';
import { Button, Card } from 'antd';

export class MyInfo extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      balance: null,
    }
  }
  componentDidMount() {
    this.loadBalance()
  }
  async loadBalance() {
    const {account} = this.props
    const info = await account.wallet.getInfo()
    this.setState({balance: info.balance})

    this.timerID = setTimeout(() => this.loadBalance(), 500)
  }
  componentWillUnmount() {
    clearTimeout(this.timerID)
  }

  render() {
    const { account } = this.props
    const {balance} = this.state
    return <>
      <Card title="My info" bordered={false}>
        <p style={{ wordWrap: 'break-word' }}>Address: {account.address}</p>
        <p style={{ wordWrap: 'break-word' }}>Address hex: {account.addressHex}</p>
        {balance === null ? null : <p>Balance: {this.state.balance}</p>}
      </Card>
      <Card title="Channels" bordered={false}>
        <p><Button onClick={this.props.onCreateOrJoinChannel}>Create / Join</Button></p>
      </Card>
    </>
  }
}
