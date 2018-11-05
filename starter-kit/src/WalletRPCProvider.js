import { Qweb3 } from 'qweb3'

export default class WalletRPCProvider {
  constructor(wallet, httpURL) {
    this.wallet = wallet
    this.httpProvider = (new Qweb3(httpURL)).provider
  }

  rawCall = async (method, args) => {
    switch (method) {

      case 'sendtocontract':
        /*
        $ qcli help sendtocontract
        sendtocontract "contractaddress" "data" (amount gaslimit gasprice senderaddress broadcast)
        Send funds and data to a contract.

        Arguments:
        1. "contractaddress" (string, required) The contract address that will receive the funds and data.
        2. "datahex"  (string, required) data to send.
        3. "amount"      (numeric or string, optional) The amount in QTUM to send. eg 0.1, default: 0
        4. gasLimit  (numeric or string, optional) gasLimit, default: 250000, max: 40000000
        5. gasPrice  (numeric or string, optional) gasPrice Qtum price per gas unit, default: 0.0000004, min:0.0000004
        6. "senderaddress" (string, optional) The quantum address that will be used as sender.
        7. "broadcast" (bool, optional, default=true) Whether to broadcast the transaction or not.
        8. "changeToSender" (bool, optional, default=true) Return the change to the sender.
        */
        return this.wallet.contractSend(args[0], args[1], {
          amount: args[2],
          gasLimit: args[3],
          gasPrice: args[4] * 1e8,
          // feeRate?: number
        })
      case 'callcontract':
        /*
        $ qcli help callcontract
        callcontract "address" "data" ( address )

        Argument:
        1. "address"          (string, required) The account address
        2. "data"             (string, required) The data hex string
        3. address              (string, optional) The sender address hex string
        4. gasLimit             (string, optional) The gas limit for executing the contract
        */
        return this.wallet.contractCall(args[0], args[1], {
          gasLimit: args[3],
        })
      default:
        return this.httpProvider.rawCall(method, args)
    }
  }
}
