const Web3 = require('web3')
let web3 = new Web3('http://localhost:8545');

const TruffleContract = require("truffle-contract")

const channelJSON = require("./build/contracts/DuplexChannel.json")
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

let alice
let bob
let ch
const expireBlock = 100

let program = require('commander');

program
  .command('new')
  .description('Create a new channel')
  .action((value) => {
    console.log("alice:", alice)
    console.log("bob:", bob)
    createChannel(ch, alice, bob, expireBlock)
  })

program
  .command('payment <payer> <recipient> <channelID> <value>')
  .description('Create a new payment')
  .action(async (payer, recipient, channelID, value) => {

    const payerAcc = getAccount(payer)
    if (!payerAcc) {
        console.log("invalid user"); return;
    }

    const recipientAcc = getAccount(recipient)
    if (!recipientAcc) {
        console.log("invalid user"); return;
    }


    const payerDepositValue = await ch.getDepositValue(channelID, payerAcc.address)
    const payerDepositValueInt = parseInt(payerDepositValue.toString(16), 16)
    console.log("payer deposit value:", payerDepositValueInt)

    let payerRecivable
    {
      const filename = cacheDir + recipientAcc.address + '-last-payment'
      const lastPayment = readJSONFile(filename)
      payerRecivable = lastPayment ? lastPayment.value : 0
      console.log("payer recivable:", payerRecivable)
    }

    let recipientReceivable
    {
      const filename = cacheDir + payerAcc.address + '-last-payment'
      const lastPayment = readJSONFile(filename)
      recipientReceivable = lastPayment ? lastPayment.value : 0
      console.log("recipient recivable:", recipientReceivable)
    }

    valueInWei = parseInt(web3.utils.toWei(value, "ether"), 10)
    if (recipientReceivable >= valueInWei) {
      console.log("The value must greater than last payment's value")
      return
    }

    if (payerDepositValueInt + payerRecivable - valueInWei < 0) {
      console.log("Insufficient funds")
      return
    }

    console.log(`Payer(${payer}): ${payerAcc.address}`)
    console.log(`Recipient(${recipient}): ${recipientAcc.address}`)


    const payment = await createPayment(payerAcc.privateKey, channelID, recipientAcc.address, value)

    const filename = cacheDir + payerAcc.address + '-last-payment'
    const lastPayment = readJSONFile(filename)
    if (!lastPayment || payment.value > lastPayment.value) {
      writeJSONFile(payment, filename)
    }

    console.log("you can use these commands below:")
    console.log(`node duplexChannel.js verify ${channelID} ${payer} ${recipient} ${payment.value} ${payment.sig.v} ${payment.sig.r} ${payment.sig.s}`)
    console.log()
    console.log(`node duplexChannel.js claim ${channelID} ${recipient} ${payment.value} ${payment.sig.v} ${payment.sig.r} ${payment.sig.s}`)
  })

program
  .command('alice-balance')
  .action(async () => {
    console.log("alice balance:", await balance(ch, alice))
  })

program
  .command('deposit <who> <channelID> <value>')
  .action(async (who, channelID, value) => {
    const account = getAccount(who)
    if (!account) {
        console.log("invalid user"); return;
    }
    await deposit(ch, account.address, channelID, value)
  })

program
  .command('verify <channelID> <payer> <recipient> <value> <v> <r> <s>')
  .action(async (channelID, payer, recipient, value, v, r, s) => {

    const payerAcc = getAccount(payer)
    if (!payerAcc) {
        console.log("invalid user"); return;
    }

    const recipientAcc = getAccount(recipient)
    if (!recipientAcc) {
        console.log("invalid user"); return;
    }

    console.log("Verifying the payment...")
    const verified = await ch.verify(channelID, recipientAcc.address, value, v, r, s)
    let error
    if (!verified) {
      console.log("Payment received invalid")
      return
    }

    const payerDepositValue = await ch.getDepositValue(channelID, payerAcc.address)
    const payerDepositValueInt = parseInt(payerDepositValue.toString(16), 16)
    console.log("Payer deposit value:", payerDepositValueInt)

    const filename = cacheDir + recipientAcc.address + '-last-payment'
    const lastPayment = readJSONFile(filename)
    const payerReceivable = lastPayment ? lastPayment.value : 0
    console.log("Payer reciviable:", payerReceivable)

    if (payerDepositValueInt + payerReceivable - value < 0) {
      console.log("Error: Insufficient funds")
      return
    }

    console.log("Verified")
  })

program
  .command('withdraw <channelID> <recipient>')
  .action(async (channelID, recipient) => {
    const account = getAccount(recipient)
    if (!account) {
        console.log("invalid user"); return;
    }
    await ch.withdraw(channelID, {from: account.address, gas:1000000});
    console.log("Done")
  })

program
  .command('claim <channelID> <recipient> <value> <v> <r> <s>')
  .action(async (channelID, recipient, value, v, r, s) => {
    const account = getAccount(recipient)
    if (!account) {
        console.log("invalid user"); return;
    }

    await ch.claim(channelID, account.address, value, v, r, s, {from: account.address, gas:1000000});
    console.log("Done")
  })

program
  .command('bob-balance')
  .action(async () => {
    console.log("bob balance:", await balance(ch, bob))
  })

const alicePrivateKey = '0x308fdea831e50ad39a1a704dcdf3e21a562c58770cbe16b5bf5ac0157e6a477a'
const bobPrivateKey = '0x9a98d9ac26f373f38a148746c75ce6f0efa5f98f5e0e1ace5ea06eff4d0343bd'

async function balance(ch, account) {
  return web3.utils.fromWei(await web3.eth.getBalance(account), "ether")
}

async function deposit(ch, from, channelID, value) {
    await ch.deposit(channelID, {from: from, value: web3.utils.toWei(value, "ether"), gas:1000000});
    console.log("Deposited to channel " + channelID + " with " + value + " ether")
}

async function createChannel(ch, alice, bob, blkNum) {
    console.log("Creating a new channel...")
    const result = await ch.makeChannel(alice, bob, blkNum, {from: alice, gas:1000000});

    let channelID
    for (let i = 0; i < result.logs.length; i++) {
      const log = result.logs[i];
      if (log.event == "LogChannel") {
        channelID = log.args.channelnum.toString(10)
        break;
      }
    }
    console.log("New channel id:", channelID)
}

async function createPayment(payerPrivateKey, channelID, recipient, value) {
    console.log(`Creating a payment to ${recipient} with ${value} ether...`)
    value = web3.utils.toWei(value, "ether")
    paymentHash = await web3.utils.soliditySha3(channelID, recipient, value)
    payment = {
      sig: await sign(paymentHash, payerPrivateKey),
      value: value,
    }
    console.log("Payment:", prettyJSON(payment))
    console.log()
    return payment
}

function getAccount(who) {
    switch (who) {
      case 'alice':
        return {address: alice, privateKey: alicePrivateKey}
      case 'bob':
        return {address: bob, privateKey: bobPrivateKey}
    }
}

function readJSONFile(filename) {
  try {
    const rawdata = fs.readFileSync(filename);
    return JSON.parse(rawdata);
  } catch (e) {}
}
function writeJSONFile(data, filename) {
  const dataJSONStr = prettyJSON(data);
  fs.writeFileSync(filename, dataJSONStr);
}

const fs = require('fs');
const cacheDir = '.cache/';

async function main() {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
  }

  const accounts = await web3.eth.getAccounts()
  alice = accounts[0]
  bob = accounts[1]

  const networkID = await web3.eth.net.getId()
  ch = Channel.at(channelJSON['networks'][networkID]['address'])

  program.parse(process.argv)
}


main()
