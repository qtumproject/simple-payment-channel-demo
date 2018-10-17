pragma solidity ^0.4.24;

contract UnidirectionChannel {
    struct PaymentChannel {
        address owner;
        uint256 value;
        uint validUntil;

        bool valid;
    }
    mapping(bytes32 => PaymentChannel) public channels;
    uint id;

    event NewChannel(address indexed owner, bytes32 channel);
    event Deposit(address indexed owner, bytes32 indexed channel);
    event Claim(address indexed who, bytes32 indexed channel);
    event Reclaim(bytes32 indexed channel);

    constructor() public {
        id = 0;
    }

    function createChannel() public payable {
        bytes32 channel = keccak256(abi.encodePacked(id++));
        channels[channel] = PaymentChannel(msg.sender, msg.value, block.timestamp + 1 days, true);

        emit NewChannel(msg.sender, channel);
    }

    // creates a hash using the recipient and value.
    function getHash(bytes32 channel, address recipient, uint value) public pure returns(bytes32) {
        return keccak256(abi.encodePacked(channel, recipient, value));
    }

    // verify a message (receipient || value) with the provided signature
    function verify(bytes32 channel, address recipient, uint value, uint8 v, bytes32 r, bytes32 s) public constant returns(bool) {
        PaymentChannel memory ch = channels[channel];
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 h = getHash(channel, recipient, value);
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, h));
        return ch.valid && ch.validUntil > block.timestamp && ch.owner == ecrecover(prefixedHash, v, r, s);
    }

    // claim funds
    function claim(bytes32 channel, address recipient, uint value, uint8 v, bytes32 r, bytes32 s) public {
        // only recipient can claim
        require(msg.sender == recipient);
        require(verify(channel, recipient, value, v, r, s));

        PaymentChannel memory ch = channels[channel];
        if( value > ch.value ) {
            recipient.transfer(ch.value);
            channels[channel].value = 0;
        } else {
            recipient.transfer(value);
            channels[channel].value -= value;
        }

        // channel is no longer valid
        channels[channel].valid = false;

        emit Claim(recipient, channel);
    }

    function deposit(bytes32 channel) public payable {
        require(isValidChannel(channel), "invalid channel");

        PaymentChannel memory ch = channels[channel];
        ch.value += msg.value;

        emit Deposit(msg.sender, channel);
    }

    // reclaim a channel
    function reclaim(bytes32 channel) public {
        PaymentChannel memory ch = channels[channel];
        if( ch.value > 0 && ( !ch.valid || ch.validUntil < block.timestamp)) {
            ch.owner.transfer(ch.value);
            delete channels[channel];
        }
    }

    function getChannelValue(bytes32 channel) public view returns(uint256) {
        return channels[channel].value;
    }

    function getChannelOwner(bytes32 channel) public view returns(address) {
        return channels[channel].owner;
    }

    function  getChannelValidUntil(bytes32 channel) public  view returns(uint) {
        return channels[channel].validUntil;
    }
    function isValidChannel(bytes32 channel) public view returns(bool) {
        PaymentChannel memory ch = channels[channel];
        return ch.valid && ch.validUntil >= block.timestamp;
    }
}
