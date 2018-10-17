var Artifact = artifacts.require("./UnidirectionChannel.sol");
var DuplexChannel = artifacts.require("./DuplexChannel.sol");

module.exports = function(deployer) {
  deployer.deploy(Artifact);
  deployer.deploy(DuplexChannel);
};
