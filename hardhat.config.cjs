require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      mining: {
        auto: true,
        interval: 0
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      allowUnlimitedContractSize: true,
      mining: {
        auto: true,
        interval: 0
      }
    }
  }
};