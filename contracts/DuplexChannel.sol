pragma solidity ^0.4.24;


contract DuplexChannel  {

    modifier noeth() {
        require(msg.value == 0);
        _;
    }

    modifier requireCounterpart(uint channel) {
        require(isCounterpart(channel));
        _;
    }

    modifier openingChannel(uint channel) {
        require(!channelClosed(channel));
        _;
    }
    function() public noeth {}
    function isCounterpart(uint channel) public view returns (bool) {
        return channels[channel].alice == msg.sender || channels[channel].bob == msg.sender;
    }

    uint finalizationDelay = 10000;

    event LogChannel(address indexed user, address indexed bob, uint indexed expireblock, uint channelnum);
    event LogClaim(uint indexed channel);

    struct Endpoint {
        uint96 balance;
        uint96 receivable;
        bool paid;
        bool closed;
    }

    struct Channel {
        uint expireblock;
        address alice;
        address aliceECRecoverAddr;
        address bob;
        address bobECRecoverAddr;
        mapping (address => Endpoint) endpoints;
    }

    mapping (uint => Channel) channels;
    uint maxchannel;

    function makeChannel(address alice, address aliceECRecoverAddr,  address bob, address bobECRecoverAddr, uint expireblock) public payable {
        if (alice != msg.sender && bob != msg.sender) {
            require(msg.value==0, "only alice or bob can only make channel with value");
        }

        maxchannel += 1;
        channels[maxchannel].alice = alice;
        channels[maxchannel].aliceECRecoverAddr = aliceECRecoverAddr;
        channels[maxchannel].bob = bob;
        channels[maxchannel].bobECRecoverAddr = bobECRecoverAddr;
        channels[maxchannel].expireblock = expireblock + block.number;

        if (msg.value > 0) {
            channels[maxchannel].endpoints[msg.sender].balance += uint96(msg.value);
        }

        emit LogChannel(alice, bob, expireblock, maxchannel);
    }

    function deposit(uint channel) public payable requireCounterpart(channel) {
        channels[channel].endpoints[msg.sender].balance += uint96(msg.value);
    }

    function channelExpired(uint channel) private view returns (bool) {
        return channels[channel].expireblock < block.number;
    }

    function channelClosed(uint channel) private view returns (bool) {
        Channel memory ch = channels[channel];
        return channelExpired(channel) ||
            (
                channels[channel].endpoints[ch.alice].closed &&
                channels[channel].endpoints[ch.bob].closed
            );
    }

    //Sig must be valid,
    //signer must be one endpoint and recipient the other
    function verify(
        uint channel, address recipient, uint value,
        uint8 v, bytes32 r, bytes32 s
    ) public view returns(bool) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 h = keccak256(abi.encodePacked(channel, recipient, value));
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, h));
        address signer = ecrecover(
            prefixedHash,
            v, r, s);

        Channel memory ch = channels[channel];

        return (signer == ch.aliceECRecoverAddr && recipient == ch.bob) ||
            (signer == ch.bobECRecoverAddr && recipient == ch.alice);
    }

    function claim(
        uint channel, address recipient, uint96 value,
        uint8 v, bytes32 r, bytes32 s
    ) public noeth openingChannel(channel) {
        Channel memory ch = channels[channel];
        Endpoint memory ep = channels[channel].endpoints[recipient];

        require(verify(channel, recipient, value, v, r, s), "invalid payment");
        require(ep.receivable + ep.balance >= ep.balance);

        // channels[channel].endpoints[recipient].closed = true;
        channels[channel].endpoints[recipient].receivable = value;

        //if this is first claim,
        //make sure other party has sufficient time to submit claim
        if (ch.expireblock < block.number + finalizationDelay) {
            channels[channel].expireblock = block.number + finalizationDelay;
        }
        emit LogClaim(channel);
    }

    function getDepositValue(uint channel, address owner) public view noeth returns (uint96) {
        return channels[channel].endpoints[owner].balance;
    }

    function withdraw(uint channel) public noeth requireCounterpart(channel) openingChannel(channel) {
        Channel memory ch = channels[channel];

        require(!channels[channel].endpoints[msg.sender].paid);

        Endpoint memory alice = channels[channel].endpoints[ch.alice];
        Endpoint memory bob = channels[channel].endpoints[ch.bob];
        uint alicereceivable = alice.receivable;
        uint bobreceivable = bob.receivable;

        //if anyone overdrew, just take what they have
        if (alicereceivable > bob.balance + bob.receivable) {
            alicereceivable = bob.balance + bob.receivable;
        }
        if (bobreceivable > alice.balance + alice.receivable) {
            bobreceivable = alice.balance + alice.receivable;
        }

        uint alicenet = alice.balance - bobreceivable + alicereceivable;
        uint bobnet = bob.balance - alicereceivable + bobreceivable;

        //make double sure a bug can't drain from other channels...
        if (alicenet + bobnet > alice.balance + bob.balance) return;

        uint net;
        if (msg.sender == ch.alice) {
            net = alicenet;
        } else {
            net = bobnet;
        }

        msg.sender.transfer(net);

        channels[channel].endpoints[msg.sender].paid = true;
        channels[channel].endpoints[msg.sender].closed = true;
    }
}
