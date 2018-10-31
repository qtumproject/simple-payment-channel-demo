const Web3 = require('web3')
let web3 = new Web3('http://localhost:23889');

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

let alice = "0x7926223070547d2d15b2ef5e7383e541c338ffe9"
let aliceECRecoverAddr = "0x6Fd56E72373a34bA39Bf4167aF82e7A411BFED47"
let bob = "0x2352be3db3177f0a07efbe6da5857615b8c9901d"
let bobECRecoverAddr = "0x0CF28703ECc9C7dB28F3d496e41666445b0A4EAF"
let ch
const expireBlock = 100

let program = require('commander');

program
  .command('new')
  .description('Create a new channel')
  .action((value) => {
    console.log("alice:", alice)
    console.log("bob:", bob)
    createChannel(ch, alice, aliceECRecoverAddr, bob, bobECRecoverAddr, expireBlock)
  })

program
  .command('payment <payer> <recipient> <channelId> <value>')
  .description('Create a new payment')
  .action(async (payer, recipient, channelId, value) => {

    const payerAcc = getAccount(payer)
    if (!payerAcc) {
        console.log("invalid user"); return;
    }

    const recipientAcc = getAccount(recipient)
    if (!recipientAcc) {
        console.log("invalid user"); return;
    }


    const payerDepositValue = await ch.getDepositValue(channelId, payerAcc.address)
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

    valueInSatoshi = value * 1e8
    if (recipientReceivable >= valueInSatoshi) {
      console.log("The value must greater than last payment's value")
      return
    }

    if (payerDepositValueInt + payerRecivable - valueInSatoshi < 0) {
      console.log("Insufficient funds")
      return
    }

    console.log(`Payer(${payer}): ${payerAcc.address}`)
    console.log(`Recipient(${recipient}): ${recipientAcc.address}`)


    const payment = await createPayment(payerAcc.privateKey, channelId, recipientAcc.address, value)

    const filename = cacheDir + payerAcc.address + '-last-payment'
    const lastPayment = readJSONFile(filename)
    if (!lastPayment || payment.value > lastPayment.value) {
      writeJSONFile(payment, filename)
    }

    console.log("you can use these commands below:")
    console.log(`node duplexChannel.js verify ${channelId} ${payer} ${recipient} ${payment.value} ${payment.sig.v} ${payment.sig.r} ${payment.sig.s}`)
    console.log()
    console.log(`node duplexChannel.js claim ${channelId} ${recipient} ${payment.value} ${payment.sig.v} ${payment.sig.r} ${payment.sig.s}`)
  })

program
  .command('alice-balance')
  .action(async () => {
    console.log("alice balance:", await balance(ch, alice)/ 1e8, "QTUM")
  })

program
  .command('alice-deposit-value <channelId>')
  .action(async (channelId) => {
    const depositVal = await ch.getDepositValue(channelId, alice)
    const depositValInt = parseInt(depositVal.toString(16), 16)
    console.log("alice channel deposit value:", depositValInt/1e8, "QTUM")
  })

program
  .command('bob-deposit-value <channelId>')
  .action(async (channelId) => {
    const depositVal = await ch.getDepositValue(channelId, bob)
    const depositValInt = parseInt(depositVal.toString(16), 16)
    console.log("bob channel deposit value:", depositValInt/1e8, "QTUM")
  })

program
  .command('deposit <who> <channelId> <value>')
  .action(async (who, channelId, value) => {
    const account = getAccount(who)
    if (!account) {
        console.log("invalid user"); return;
    }
    await deposit(ch, account.address, channelId, value)
  })

program
  .command('verify <channelId> <payer> <recipient> <value> <v> <r> <s>')
  .action(async (channelId, payer, recipient, value, v, r, s) => {

    const payerAcc = getAccount(payer)
    if (!payerAcc) {
        console.log("invalid user"); return;
    }

    const recipientAcc = getAccount(recipient)
    if (!recipientAcc) {
        console.log("invalid user"); return;
    }

    console.log("Verifying the payment...")
    const verified = await ch.verify(channelId, recipientAcc.address, value, v, r, s)
    let error
    if (!verified) {
      console.log("Payment received invalid")
      return
    }

    const payerDepositValue = await ch.getDepositValue(channelId, payerAcc.address)
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
  .command('withdraw <channelId> <recipient>')
  .action(async (channelId, recipient) => {
    const account = getAccount(recipient)
    if (!account) {
        console.log("invalid user"); return;
    }
    await ch.withdraw(channelId, { from: account.address, gas: 1000000});
    console.log("Done")
  })

program
  .command('claim <channelId> <recipient> <value> <v> <r> <s>')
  .action(async (channelId, recipient, value, v, r, s) => {
    const account = getAccount(recipient)
    if (!account) {
        console.log("invalid user"); return;
    }

    await ch.claim(channelId, account.address, value, v, r, s, { from: account.address, gas: 1000000});
    console.log("Done")
  })

program
  .command('bob-balance')
  .action(async () => {
    console.log("bob balance:", await balance(ch, bob) / 1e8, "QTUM")
  })

const alicePrivateKey = '0x00821d8c8a3627adc68aa4034fea953b2f5da553fab312db3fa274240bd49f35'
const bobPrivateKey = '0x7826adc1127b8cf34c47b2c7909904109d7fe404be04838e323082981c51340e'

async function balance(ch, account) {
  return await web3.eth.getBalance(account)
}

async function deposit(ch, from, channelId, value) {
  await ch.deposit(channelId, { from: from, value: value * 1e8, gas: 1000000});
    console.log("Deposited to channel " + channelId + " with " + value + " QTUM")
}

async function createChannel(ch, alice, aliceECRecoverAddr, bob, bobECRecoverAddr, blkNum) {
    console.log("Creating a new channel...")
  const result = await ch.makeChannel(alice, aliceECRecoverAddr, bob, bobECRecoverAddr, blkNum, { from: alice, gas: 1000000});

    let channelId
    for (let i = 0; i < result.logs.length; i++) {
      const log = result.logs[i];
      if (log.event == "LogChannel") {
        channelId = log.args.channelnum.toString(10)
        break;
      }
    }
    console.log("New channel id:", channelId)
}

async function createPayment(payerPrivateKey, channelId, recipient, value) {
    console.log(`Creating a payment to ${recipient} with ${value} QTUM...`)
    value = value * 1e8
    paymentHash = await web3.utils.soliditySha3(channelId, recipient, value)
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

  const networkID = "regtest"
  ch = Channel.at(channelJSON['networks'][networkID]['address'])

  program.parse(process.argv)
}


main()
