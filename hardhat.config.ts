import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import env from "dotenv";

env.config();

const config: HardhatUserConfig = {
    solidity: "0.8.17",
    networks: {
        eth: {
            url: process.env.RPC_URL,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

export default config;

