const path = require("path");
const HDWalletProvider = require("truffle-hdwallet-provider");
const keys = require('./keys');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      port: 8545
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider(keys.privKey, keys.ropstenInfura);
      },
      network_id: 3
    },
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(keys.privKey, keys.rinkebyInfura);
      },
      network_id: 4
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(keys.privKey, keys.mainnetInfura);
      },
      network_id: 1
    }
  }
};
