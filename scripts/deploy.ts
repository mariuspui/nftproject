import { ethers } from "hardhat";

const TOKEN_BASE_URI = "";
const FREE_MINTS = 500;
const MINT_PRICE = ethers.utils.parseEther("0.1");

async function main() {
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(TOKEN_BASE_URI, FREE_MINTS, MINT_PRICE);

    await nft.deployed();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

