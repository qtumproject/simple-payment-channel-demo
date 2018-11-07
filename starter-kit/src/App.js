import React, { Component } from 'react';
import 'antd/dist/antd.css';
import './App.css';
import {MakeOrJoinChannel} from './components/Channel/MakeOrJoinChannel'
import { Layout } from 'antd';
import { ImportWIF } from './components/Wallet/ImportWIF';
import { ChannelInfo } from './components/Channel/ChannelInfo';
import { MyInfo } from './components/MyInfo';
const { Header, Footer, Sider, Content } = Layout;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      account: null,
      channelId: null,
      webSocket: null,
    };
  }

  async componentDidMount() {
    const webSocket = new WebSocket("ws://localhost:3008/ws");
    webSocket.addEventListener('open', (event) => {
      this.setState({webSocket})
    })
  }

  handleUpdateChannelId(channelId) {
    this.setState({channelId})
  }

  handleUpdateAccount(account) {
    this.setState({account})
  }

  render() {
    return (
      <Layout>
        <Header className="header"><h1>Starter kit <span>a State Channel demo in QTUM</span></h1></Header>
        <Layout>
          <Sider theme="light">{this.renderSider()}</Sider>
          <Content style={{background: '#ECECEC' }}>
            <div style={{ padding: '30px' }}>
              {this.renderContent()}
            </div>
          </Content>
        </Layout>
        <Footer style={{textAlign: 'center'}}>Starter kit ©2018 Created by <a href="https://github.com/dcb9">dcb9</a></Footer>
      </Layout>
    );
  }

  renderSider() {
    const { account } = this.state
    if (!account) {
      return <p>Please import your private key</p>
    }

    return <MyInfo account={account} onCreateOrJoinChannel={() => this.setState({ channelId: null })}/>
  }

  renderContent() {
    const {account, channelId, webSocket} = this.state
    if (!account) {
      return <ImportWIF handleUpdateAccount={(acc) => this.handleUpdateAccount(acc)} />
    }

    if (!channelId) {
      return <MakeOrJoinChannel
        handleUpdateChannelId={(channelId) => this.handleUpdateChannelId(channelId)}
        account={account}
        webSocket={webSocket}
      />
    }

    return <ChannelInfo
      channelId={channelId}
      account={account}
      webSocket={webSocket}
    />
  }
}

export default App;
