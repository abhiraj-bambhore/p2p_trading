require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local Hardhat node — run: npx hardhat node
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // In-process Hardhat test network
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,       // auto-mine each transaction
        interval: 0,
      },
      accounts: {
        count: 20,        // 20 pre-funded test wallets
        accountsBalance: "10000000000000000000000", // 10,000 ETH each
      },
    },
  },
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
