import DuplexChannelArtifact from './DuplexChannel.json';

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
    })

    const executionResult = res["executionResult"]
    if (executionResult && executionResult["excepted"] === "None") {
      const depositValue = parseInt(executionResult["output"], 16)
      return depositValue
    } else {
      console.log("get deposit value err")
    }
  }
