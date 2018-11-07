import DuplexChannelArtifact from './DuplexChannel.json';
import {getTransactionReceipt} from '../../utils/contract'

export async function getContract(qweb3) {
  const contractAddress = DuplexChannelArtifact["networks"]["regtest"]["address"]
  const contractAbi = DuplexChannelArtifact["abi"]
  return qweb3.Contract(contractAddress, contractAbi)
}

const contractMetadata = {
  DuplexChannel: {
    address: DuplexChannelArtifact["networks"]["regtest"]["address"],
    abi: DuplexChannelArtifact["abi"],
  },
}

export function searchLogs(qweb3, args) {
  let {
    fromBlock, // number
    toBlock, // number
    addresses, // string array
    topics // string array
  } = args;

  if (addresses === undefined) {
    addresses = [];
  }
  if (topics === undefined) {
    topics = [];
  }

  // removeHexPrefix = true removes the '0x' hex prefix from all hex values
  return qweb3.searchLogs(fromBlock, toBlock, addresses, topics, contractMetadata, true);
}

export async function getDepositValue(contract, owner, channelId) {
  const res = await contract.call('getDepositValue', {
    methodArgs: [channelId, owner],    // Sets the function params
    gasLimit: 1000000,  // Sets the gas limit to 1 million
    senderAddress: '',
  })

  const executionResult = res["executionResult"]
  if (executionResult && executionResult["excepted"] === "None") {
    const depositValue = parseInt(executionResult["output"], 16)
    return depositValue
  } else {
    console.log("get deposit value err")
  }
}

export async function channelClosed(contract, channelId) {
  const res = await contract.call('channelClosed', {
    methodArgs: [channelId],    // Sets the function params
    gasLimit: 1000000,  // Sets the gas limit to 1 million
    senderAddress: '',
  })

  const executionResult = res["executionResult"]
  if (executionResult && executionResult["excepted"] === "None") {
    const res = parseInt(executionResult["output"], 16)
    return res === 1
  } else {
    console.log("get channelClosed err")
  }
}

export async function verify(contract,sender, payment) {
  const {channelId, recipient, value, sig} = payment
  const res = await contract.call('verify', {
    methodArgs: [channelId, recipient, value, sig.v, sig.r, sig.s],    // Sets the function params
    gasLimit: 1000000,  // Sets the gas limit to 1 million
    senderAddress: sender,
  })

  console.log(res)
  const executionResult = res["executionResult"]
  if (executionResult && executionResult["excepted"] === "None") {
    const res = parseInt(executionResult["output"], 16)
    console.log("res: ", res)
    return res === 1
  } else {
    console.log("get channelClosed err")
  }
}


export async function getExpireBlock(contract, channelId) {
  const res = await contract.call('getExpireBlock', {
    methodArgs: [channelId],    // Sets the function params
    gasLimit: 1000000,  // Sets the gas limit to 1 million
    senderAddress: '',
  })

  const executionResult = res["executionResult"]
  if (executionResult && executionResult["excepted"] === "None") {
    return parseInt(executionResult["output"], 16)
  } else {
    return 0
  }
}
export async function getWithdrawalBalance(contract, sender, channelId) {
  const res = await contract.call('getWithdrawalBalance', {
    methodArgs: [channelId],    // Sets the function params
    gasLimit: 1000000,  // Sets the gas limit to 1 million
    senderAddress: sender,
  })

  const executionResult = res["executionResult"]
  if (executionResult && executionResult["excepted"] === "None") {
    const balance = parseInt(executionResult["output"], 16)
    return balance
  } else {
    return 0
  }
}

export async function withdraw(qweb3, contract, sender, channelId) {
  const txid = await contract.send('withdraw', {
    methodArgs: [channelId],    // Sets the function params
    gasLimit: 1000000,  // Sets the gas limit to 1 million
    senderAddress: sender,
  })
  console.log(txid)

  let receipt = await getTransactionReceipt(qweb3, txid.txid)
  console.log(receipt)
  receipt = receipt[0]
  if (receipt.excepted === 'None') {
    console.log("Success: withdraw")
  }
}

export async function claim(qweb3, contract,sender, payment) {
  const {channelId, recipient, value, sig} = payment
  console.log([channelId, recipient, value, sig.v, sig.r, sig.s])
  const txid = await contract.send('claim', {
    methodArgs: [channelId, recipient, value, sig.v, sig.r, sig.s],    // Sets the function params
    gasLimit: 1000000,  // Sets the gas limit to 1 million
    senderAddress: sender,
  })
  console.log(txid)

  let receipt = await getTransactionReceipt(qweb3, txid.txid)
  console.log(receipt)
  receipt = receipt[0]
  if (receipt.excepted === 'None') {
    console.log("Success: Claim")
  }
}
