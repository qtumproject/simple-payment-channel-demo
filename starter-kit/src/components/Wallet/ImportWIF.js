import React from 'react';
import { Button, Input } from 'antd';
import { networks } from "qtumjs-wallet"
import { PrivateKey } from 'qtumcore-lib';
import {getContract} from '../Contract/Contract'
import { Qweb3 } from 'qweb3'
import WalletRPCProvider from '../../WalletRPCProvider'
import Web3 from 'web3'

const web3 = new Web3();

function getECrecoveryAddress(privateKeyHex) {
  const message = "hi";
  const signature = web3.eth.accounts.sign(message, privateKeyHex);

  console.log("message hash:", signature.messageHash);
  console.log("signature:", signature.signature);

  const address = web3.eth.accounts.recover(message, signature.signature)
  console.log("addr in ETH format:", address);

  return address
}

export async function importWIF(wifKey) {
  const network = networks.regtest
  const wallet = network.fromWIF(wifKey)
  console.log("wallet", wallet)

  const privateKey = PrivateKey.fromWIF(wifKey);

  const privateKeyHex = '0x' + privateKey.toString().padStart(64, '0');
  console.log("private key:", privateKeyHex);
  const ecRecoveryAddress = getECrecoveryAddress(privateKeyHex)

  const rpcProvider = new WalletRPCProvider(wallet, 'http://qtum:test@localhost:3000')
  const qweb3 =  new Qweb3(rpcProvider);
  const contract = await getContract(qweb3)
  const addressHex = await qweb3.getHexAddress(wallet.address)

  return {
    wifKey,
    wallet,
    address: wallet.address,
    addressHex,
    ecRecoveryAddress,
    privateKeyHex,
    qweb3,
    contract,
  }
}

export class ImportWIF extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      wifKey: null,
    }
  }

  async componentDidMount() {
    const wifKey = window.localStorage.getItem('wifKey')
    this.setState({wifKey})
  }

  handlePrivateKeyChange(e) { this.setState({wifKey: e.target.value}) }
  async handleImport() {
    const account = await importWIF(this.state.wifKey)
    window.localStorage.setItem('wifKey', this.state.wifKey)

    this.props.handleUpdateAccount(account)
  }

  render() {
    return <p>
      <label>WIF Key</label>
      <Input onChange={(e) => this.handlePrivateKeyChange(e)} value={this.state.wifKey}></Input>
      <Button onClick={() => this.handleImport()}>Import</Button>
    </p>
  }
}
