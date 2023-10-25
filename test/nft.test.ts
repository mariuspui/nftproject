import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { NFT } from "../typechain-types";

const TOKEN_BASE_URI = "yourdomain.pinata.com/unrevealHash/";
const REVEALED_TOKEN_BASE_URI = "yourdomain.pinata.com/revealedHash/";
const FREE_MINTS = 500;
const MINT_PRICE = ethers.utils.parseEther("0.1");

describe("NFT", async function() {
    let nft: NFT;
    let user: SignerWithAddress;
    let deployer: SignerWithAddress;
    it("Should deploy NFT contract", async function() {
        [deployer, user] = await ethers.getSigners();

        const NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy(TOKEN_BASE_URI, FREE_MINTS, MINT_PRICE, deployer.address);

        await nft.deployed();
    });

    it("Should mint nft all owner nfts", async function() {
        expect(await nft.ownerMint(deployer.address, await nft.maxOwnerMintLimit()));
    });

    it("Should fail mint with message Owner mint limit reached", async function() {
        await expect(nft.ownerMint(deployer.address, 1)).to.revertedWith("Owner mint limit reached");
    });

    it("Should mint free nft", async function() {
        const initialFreeMintLeft = await nft.freeMintLeft();
        const initialFreeMintedCount = await nft.freeMintedCount(user.address);

        // Ensure free mint is not paused
        await (await nft.setFreeMintPaused(false)).wait();

        // Mint a free NFT
        await expect(nft.connect(user).mint(1)).to.emit(nft, "Transfer");
        // .withArgs(ethers.constants.AddressZero, user.address, initialFreeMintLeft.sub(1));

        // Check that the number of free mints left has decreased
        expect(await nft.freeMintLeft()).to.equal(initialFreeMintLeft.sub(1));

        // Check that the number of free mints for the user has increased
        expect(await nft.freeMintedCount(user.address)).to.equal(initialFreeMintedCount.add(1));
    });

    it("Should fail mint with message eth amount should be zero", async function() {
        expect(nft.mint(1, { value: MINT_PRICE })).to.revertedWith("eth amount should be zero");
    });

    it("Should fail mint with message invalid eth amount", async function() {
        await (await nft.setFreeMintPaused(true)).wait();
        await expect(nft.mint(1)).to.revertedWith("Invalid eth payment");
    });

    it("Should fail mint with message Minting is pauased.", async function() {
        expect(nft.mint(1)).to.revertedWith("Minting is pauased.");
    });

    it("Should price mint nft", async function() {
        expect(await nft.mint(1, { value: MINT_PRICE }));
    });

    it("Should mint free nft when price is zero", async function() {
        await (await nft.setMintPrice(0)).wait();
        expect(await nft.mint(1));
        await (await nft.setMintPrice(MINT_PRICE)).wait();
    });

    it("Should revert with message Max wallet free mint limit reached", async function() {
        await (await nft.setFreeMintPaused(false)).wait();
        const userFreeMintLeft =
            (await nft.maxFreeMintLimit()).toNumber() - (await nft.freeMintedCount(user.address)).toNumber();

        expect(await nft.connect(user).mint(userFreeMintLeft - 1));
        await expect(nft.connect(user).mint(1)).to.revertedWith("Max wallet free mint limit reached");
    });

    it("Should revert with message Max wallet price mint limit reached", async function() {
        await (await nft.setFreeMintPaused(true)).wait();

        const userPriceMintLeft =
            (await nft.maxPriceMintLimit()).toNumber() - (await nft.priceMintedCount(user.address)).toNumber();

        expect(await nft.connect(user).mint(userPriceMintLeft - 1, { value: MINT_PRICE.mul(userPriceMintLeft - 1) }));
        await expect(nft.connect(user).mint(1, { value: MINT_PRICE })).to.revertedWith(
            "Max wallet price mint limit reached"
        );
    });

    it("Should not allow to free mint", async function() {
        await (await nft.setFreeMintPaused(false)).wait();
        await (await nft.setFreeMintLeft(1)).wait();
        const [a, b, user2] = await ethers.getSigners();

        expect(await nft.connect(user2).mint(1));

        await expect(nft.connect(user).mint(1)).to.revertedWith("Invalid eth payment");
    });

    it("Should set reveal token uri", async function() {
        expect(await nft.tokenURI(0)).to.equal(`${TOKEN_BASE_URI}0`);
        expect(await nft.reveal(REVEALED_TOKEN_BASE_URI)).to.emit(nft, "Revealed");
        expect(await nft.tokenURI(0)).to.equal(`${REVEALED_TOKEN_BASE_URI}0`);
    });

    it("Should not allow to reveal again", async function() {
        await expect(nft.reveal(REVEALED_TOKEN_BASE_URI)).to.revertedWith("Already revealed");
    });
});

