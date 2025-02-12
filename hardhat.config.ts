import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
require("dotenv").config();

const { BASE_TESTNET, PRIVATE_KEY, ETHERSCAN_API_KEY, LISK_SEPOLIA_API_KEY_URL } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    basetestnet: {
      url: BASE_TESTNET,
      accounts: [`0x${PRIVATE_KEY}`]
      },
      SepoliaLisk: {
        url: LISK_SEPOLIA_API_KEY_URL,
        accounts: [`0x${PRIVATE_KEY}`]
      },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "SepoliaLisk",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  },
};

export default config;
