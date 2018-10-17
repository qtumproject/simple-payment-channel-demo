# State Channel

see: https://www.blunderingcode.com/a-lightning-network-in-two-pages-of-solidity/

## Install

```
$ yarn
```

## Unidirectional channel

### test

```
$ npm run ganache

$ truffle migrate --reset

$ node unidirectionChannel.js new 5
payer: 0x5b2DacD317FD24e811Fbe6e6389Ab3da7FbB55e6
Creating a new channel...
New channel id: 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563

$ node unidirectionChannel.js payment 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563 1
Payer is creating a payment...
Payment: {
  "sig": {
    "r": "0xd06daf9d8dbd4fec204428dc29c0fac91f438f941e4182e6970e292d497e58f4",
    "s": "0x4ee0913b764ba9cfc8b7bdae1f3e5c1cb2d48ce85114a4fbb5abf9ff8a7057b8",
    "v": "0x1b"
  },
  "value": "1000000000000000000"
}

# beneficiary

$ node unidirectionChannel.js verify 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563 1000000000000000000 0x1b 0xd06daf9d8dbd4fec204428dc29c0fac91f438f941e4182e6970e292d497e58f4 0x4ee0913b764ba9cfc8b7bdae1f3e5c1cb2d48ce85114a4fbb5abf9ff8a7057b8
Verifying the payment...
Verified

$ node unidirectionChannel.js claim 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563 1000000000000000000 0x1b 0xd06daf9d8dbd4fec204428dc29c0fac91f438f941e4182e6970e292d497e58f4 0x4ee0913b764ba9cfc8b7bdae1f3e5c1cb2d48ce85114a4fbb5abf9ff8a7057b8
Done


# payer

$ node unidirectionChannel.js reclaim 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563
Done

$ node unidirectionChannel.js payer-balance
payer balance: 98.66493272

$ node unidirectionChannel.js beneficiary-balance
beneficiary balance: 100.99913338
```

## Duplex channel

### test


```
$ npm run ganache

$ truffle migrate --reset

$ rm -rf .cache
$ node duplexChannel.js new
alice: 0x5b2DacD317FD24e811Fbe6e6389Ab3da7FbB55e6
bob: 0x1B72Ef6a52fdc42563e35a290Dbb65Cd9e912acF
Creating a new channel...
New channel id: 1

$ node duplexChannel.js payment alice bob 1 1
payer deposit value: 0
payer recivable: 0
recipient recivable: 0
Insufficient funds

$ node duplexChannel.js deposit alice 1 2
Deposited to channel 1 with 2 ether

$ node duplexChannel.js payment alice bob 1 1
payer deposit value: 2000000000000000000
payer recivable: 0
recipient recivable: 0
Payer(alice): 0x5b2DacD317FD24e811Fbe6e6389Ab3da7FbB55e6
Recipient(bob): 0x1B72Ef6a52fdc42563e35a290Dbb65Cd9e912acF
Creating a payment to 0x1B72Ef6a52fdc42563e35a290Dbb65Cd9e912acF with 1 ether...
Payment: {
  "sig": {
    "r": "0x86d956c3edc5705bf52daece31b9657bd777caabbf39aad7f10d9d2f3dd69acc",
    "s": "0x38d5cc748605742c170d44c1cea92790e418bc283fb12513cdf0f3f1352ca9c8",
    "v": "0x1c"
  },
  "value": "1000000000000000000"
}

$ node duplexChannel.js verify 1 alice bob 1000000000000000000 0x1c 0x86d956c3edc5705bf52daece31b9657bd777caabbf39aad7f10d9d2f3dd69acc 0x38d5cc748605742c170d44c1cea92790e418bc283fb12513cdf0f3f1352ca9c8
Verifying the payment...
Payer deposit value: 2000000000000000000
Payer reciviable: 0
Verified

$ node duplexChannel.js payment bob alice 1 2
payer deposit value: 0
payer recivable: 1000000000000000000
recipient recivable: 0
Insufficient funds

$ node duplexChannel.js payment bob alice 1 0.5
payer deposit value: 0
payer recivable: 1000000000000000000
recipient recivable: 0
Payer(bob): 0x1B72Ef6a52fdc42563e35a290Dbb65Cd9e912acF
Recipient(alice): 0x5b2DacD317FD24e811Fbe6e6389Ab3da7FbB55e6
Creating a payment to 0x5b2DacD317FD24e811Fbe6e6389Ab3da7FbB55e6 with 0.5 ether...
Payment: {
  "sig": {
    "r": "0xbd7bee0d981c49cd1ecd3450efc589f04cc099d010d9289406d99ff9e39df10d",
    "s": "0x6037cbce38df2233c2bf491e202ac37de7b9adc2f424fc885e1b49c5f74246d7",
    "v": "0x1c"
  },
  "value": "500000000000000000"
}

$ node duplexChannel.js verify 1 bob alice 500000000000000000 0x1c 0xbd7bee0d981c49cd1ecd3450efc589f04cc099d010d9289406d99ff9e39df10d 0x6037cbce38df2233c2bf491e202ac37de7b9adc2f424fc885e1b49c5f74246d7
Verifying the payment...
Payer deposit value: 0
Payer reciviable: 1000000000000000000
Verified

$ node duplexChannel.js alice-balance
alice balance: 97.67222082

$ node duplexChannel.js bob-balance
bob balance: 100

$ node duplexChannel.js claim 1 alice 500000000000000000 0x1c 0xbd7bee0d981c49cd1ecd3450efc589f04cc099d010d9289406d99ff9e39df10d 0x6037cbce38df2233c2bf491e202ac37de7b9adc2f424fc885e1b49c5f74246d7
Done

$ node duplexChannel.js claim 1 bob 1000000000000000000 0x1c 0x86d956c3edc5705bf52daece31b9657bd777caabbf39aad7f10d9d2f3dd69acc 0x38d5cc748605742c170d44c1cea92790e418bc283fb12513cdf0f3f1352ca9c8
Done

$ node duplexChannel.js withdraw 1 bob
$ node duplexChannel.js withdraw 1 alice

$ node duplexChannel.js alice-balance
alice balance: 99.16293646

$ node duplexChannel.js bob-balance
bob balance: 100.4977072
```
