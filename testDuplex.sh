truffle migrate --reset --network=qtum --compile-all
rm -rf .cache
node duplexChannel.js new

node duplexChannel.js deposit alice 1 1000

node duplexChannel.js payment alice bob 1 1000
