const Web3 = require('web3')
let web3 = new Web3('http://localhost:8545');

const TruffleContract = require("truffle-contract")

const channelJSON = require("./build/contracts/UnidirectionChannel.json")
const Channel = TruffleContract(channelJSON)

Channel.setProvider(web3.currentProvider);
//
// https://ethereum.stackexchange.com/questions/51240/error-deploying-using-truffle-contracts-cannot-read-property-apply-of-undefin
if (typeof Channel.currentProvider.sendAsync !== "function") {
  Channel.currentProvider.sendAsync = function() {
    return Channel.currentProvider.send.apply(
      Channel.currentProvider,
          arguments
    );
  };
}

async function sign(message, account) {
  let sig = await web3.eth.accounts.sign(message, account);

  return {
    r: sig.r,
    s: sig.s,
    v: sig.v,
  }
}

function prettyJSON(json) {
  return JSON.stringify(json, null, 2)
}

let payer
let beneficiary
let ch

let program = require('commander');

program
  .command('new <value>')
  .description('Create a new channel')
  .action((value) => {
    console.log("payer:", payer)
    createChannel(ch, payer, value)
  })

program
  .command('payment <channelID> <value>')
  .description('Create a new payment')
  .action(async (channelID, value) => {
    const payment = await createPayment(channelID, value)

    console.log("you can use these commands below:")
    const cmd = `${channelID} ${payment.value} ${payment.sig.v} ${payment.sig.r} ${payment.sig.s}`
    console.log(`node unidirectionChannel.js verify ${cmd}`)
    console.log()
    console.log(`node unidirectionChannel.js claim ${cmd}`)
    console.log()
  })

program
  .command('payer-balance')
  .action(async () => {
    console.log("payer balance:", await balance(ch, payer))
  })

program
  .command('deposit <channelID> <value>')
  .action((channelID, value) => {
    console.log("payer:", payer)
    deposit(ch, channelID, payer, value)
  })

program
  .command('verify <channelID> <value> <v> <r> <s>')
  .action(async (channelID, value, v, r, s) => {
    console.log("Verifying the payment...")
    const verified = await ch.verify(channelID, beneficiary, value, v, r, s)
    let error
    if (!verified) {
      error = "Payment received invalid"
    } else if (await ch.getChannelValue(channelID) < value) {
      error = "Channel has insufficient funds"
    }
    if (error) {
      console.log(error)
      return
    }

    console.log("Verified")
  })

program
  .command('claim <channelID> <value> <v> <r> <s>')
  .action(async (channelID, value, v, r, s) => {
    await ch.claim(channelID, beneficiary, value, v, r, s, {from: beneficiary, gas:1000000});
    console.log("Done")
  })

program
  .command('reclaim <channelID>')
  .action(async (channelID) => {
    await reclaim(channelID)
    console.log("Done")
  })

program
  .command('beneficiary-balance')
  .action(async () => {
    console.log("beneficiary balance:", await balance(ch, beneficiary))
  })

const payerPrivateKey = '0x308fdea831e50ad39a1a704dcdf3e21a562c58770cbe16b5bf5ac0157e6a477a'

async function balance(ch, account) {
  return web3.utils.fromWei(await web3.eth.getBalance(account), "ether")
}

async function deposit(ch, channelID, from, value) {
    await ch.deposit(channelID, {from: from, value: web3.utils.toWei(value, "ether"), gas:1000000});
    console.log("Deposit to " + channelID + " with " + value + " ether")
    console.log()
}

async function createChannel(ch, from, value) {
    console.log("Creating a new channel...")
    const result = await ch.createChannel({from: from, value: web3.utils.toWei(value, "ether"), gas:1000000});

    let channelID
    for (let i = 0; i < result.logs.length; i++) {
      const log = result.logs[i];
      if (log.event == "NewChannel") {
        channelID = log.args.channel
        break;
      }
    }
    console.log("New channel id:", channelID)
    console.log()
}

async function createPayment(channelID, value) {
    console.log("Payer is creating a payment...")
    value = web3.utils.toWei(value, "ether")
    paymentHash = await ch.getHash(channelID, beneficiary, value)
    payment = {
      sig: await sign(paymentHash, payerPrivateKey),
      value: value,
    }
    console.log("Payment:", prettyJSON(payment))
    console.log()
    return payment
}
async function reclaim(channelID) {
  await ch.reclaim(channelID, { from: payer, gas: 1000000})
}

async function main() {
  const accounts = await web3.eth.getAccounts()
  payer = accounts[0]
  beneficiary = accounts[1]

  const networkID = await web3.eth.net.getId()
  ch = Channel.at(channelJSON['networks'][networkID]['address'])

  program.parse(process.argv)
}

main()
