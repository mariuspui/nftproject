import { ethers } from "hardhat";
import { deploy } from "../utils";

const TOKEN_BASE_URI = "";
const FREE_MINTS = 500;
const MINT_PRICE = ethers.utils.parseEther("0.1").toString();

async function main() {
    const nft = await deploy("NFT", [TOKEN_BASE_URI, FREE_MINTS, MINT_PRICE]);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

