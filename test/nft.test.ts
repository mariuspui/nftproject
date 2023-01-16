import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { NFT } from "../typechain-types";

const TOKEN_BASE_URI = "yourdomain.pinata.com/unrevealHash/";
const REVEALED_TOKEN_BASE_URI = "yourdomain.pinata.com/revealedHash/";
const FREE_MINTS = 500;
const MINT_PRICE = ethers.utils.parseEther("0.1");

describe("NFT", async function () {
    let nft: NFT;
    let user: SignerWithAddress;
    let deployer: SignerWithAddress;
    it("Should deploy NFT contract", async function () {
        [deployer, user] = await ethers.getSigners();

        const NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy(TOKEN_BASE_URI, FREE_MINTS, MINT_PRICE);

        await nft.deployed();
    });

    it("Should mint nft all owner nfts", async function () {
        expect(await nft.ownerMint(deployer.address, await nft.maxOwnerMintLimit()));
    });

    it("Should fail mint with message Owner mint limit reached", async function () {
        await expect(nft.ownerMint(deployer.address, 1)).to.revertedWith("Owner mint limit reached");
    });

    it("Should free mint nft", async function () {
        expect(await nft.mint());
    });

    it("Should fail mint with message eth amount should be zero", async function () {
        expect(nft.mint({ value: MINT_PRICE })).to.revertedWith("eth amount should be zero");
    });

    it("Should fail mint with message invalid eth amount", async function () {
        await (await nft.setFreeMintPaused(true)).wait();
        await expect(nft.mint()).to.revertedWith("Invalid eth payment");
    });

    it("Should fail mint with message Minting is pauased.", async function () {
        expect(nft.mint()).to.revertedWith("Minting is pauased.");
    });

    it("Should price mint nft", async function () {
        expect(await nft.mint({ value: MINT_PRICE }));
    });

    it("Should mint free nft when price is zero", async function () {
        // await (await nft.setMintPrice(0)).wait();
        expect(await nft.mint());
        await (await nft.setMintPrice(MINT_PRICE)).wait();
    });

    it("Should revert with message Max wallet free mint limit reached", async function () {
        await (await nft.setFreeMintPaused(false)).wait();

        for (let i = 0; i < (await nft.maxFreeMintLimit()).toNumber(); i++) {
            expect(await nft.connect(user).mint());
        }
        await expect(nft.connect(user).mint()).to.revertedWith("Max wallet free mint limit reached");
    });

    it("Should revert with message Max wallet price mint limit reached", async function () {
        await (await nft.setFreeMintPaused(true)).wait();

        for (let i = 0; i < (await nft.maxPriceMintLimit()).toNumber(); i++) {
            expect(await nft.connect(user).mint({ value: MINT_PRICE }));
        }
        await expect(nft.connect(user).mint({ value: MINT_PRICE })).to.revertedWith(
            "Max wallet price mint limit reached"
        );
    });

    it("Should set reveal token uri", async function () {
        expect(await nft.tokenURI(0)).to.equal(`${TOKEN_BASE_URI}0`);
        expect(await nft.reveal(REVEALED_TOKEN_BASE_URI)).to.emit(nft, "Revealed");
        expect(await nft.tokenURI(0)).to.equal(`${REVEALED_TOKEN_BASE_URI}0`);
    });

    it("Should not allow to reveal again", async function () {
        await expect(nft.reveal(REVEALED_TOKEN_BASE_URI)).to.revertedWith("Already revealed");
    });
});

