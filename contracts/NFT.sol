// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract NFT is ERC721, ERC2981, ReentrancyGuard, Ownable {
    // base uri for metadata, this can only be updated once during reveal
    string public uri;
    // If true, minting will be paused
    bool public mintPaused;
    // The price of minting a single NFT in ETH
    uint256 public mintPrice;
    // freeMintLeft is used to track the number of free NFT mints are left, on each NFT mint it will be decreased
    // when it reaches to zero the contract will automatically switch to paid minting.
    uint256 public freeMintLeft;
    // if true, free minting will be preferred
    bool public freeMintPaused;
    // The next token id to be minted, helps track the number of NFTs minted
    uint256 public nextTokenId;
    // all payments will be transfered to this address
    address public paymentRecipient;
    // user address => number of free mints
    mapping(address => uint256) public freeMintedCount;
    // user address => number of price mints
    mapping(address => uint256) public priceMintedCount;
    // user cannot do more price mints than this variable
    uint256 public maxPriceMintLimit = 20;
    // user cannot do more free mints than this variable
    uint256 public maxFreeMintLimit = 10;
    // owner cannot mint more than this value
    uint256 public maxOwnerMintLimit = 200;
    // number of nfts minted by owner
    uint256 public ownerMintedCount;
    // if true, uri is fixed and cannot be set again
    bool public revealed;

    // maximum size of nfts to be minted in this collection
    uint256 public constant MAX_COLLECTION_SIZE = 10_000;

    // Reverts if minting is paused
    modifier mintNotPaused() {
        require(!mintPaused, "Minting is pauased.");
        _;
    }

    event Revealed(string indexed uri, uint256 timestamp);

    constructor(
        string memory _uri,
        uint256 _freeMintLeft,
        uint256 _mintPrice,
        address _paymentRecipient
    ) ERC721("NFT Project", "NFT") {
        uri = _uri;
        freeMintLeft = _freeMintLeft;
        mintPrice = _mintPrice;
        paymentRecipient = _paymentRecipient;
        _setDefaultRoyalty(_paymentRecipient, 1000); // 10% royalty
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981) returns (bool) {
        return
            ERC721.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId) ||
            super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view override returns (string memory) {
        return uri;
    }

    /**
     * If free mint is available, NFT will be minted for free,
     * else for the price set in the contract
     */
    function mint() external payable mintNotPaused nonReentrant {
        // if free mints are over or disabled, charge mint payment
        if (mintPrice > 0 && (freeMintLeft == 0 || freeMintPaused)) {
            require(msg.value == mintPrice, "Invalid eth payment");
            payable(paymentRecipient).transfer(msg.value);
            require(priceMintedCount[msg.sender]++ < maxPriceMintLimit, "Max wallet price mint limit reached");
        } else {
            // free mint
            require(msg.value == 0, "eth amount should be zero");
            require(freeMintedCount[msg.sender]++ < maxFreeMintLimit, "Max wallet free mint limit reached");
            freeMintLeft--;
        }
        _mint(msg.sender, nextTokenId++);
        require(nextTokenId <= MAX_COLLECTION_SIZE - maxOwnerMintLimit, "Max already minted");
    }

    function ownerMint(address to, uint256 quantity) external onlyOwner {
        for (uint i = 0; i < quantity; i++) {
            _mint(to, nextTokenId++);
        }
        ownerMintedCount += quantity;
        require(ownerMintedCount <= maxOwnerMintLimit, "Owner mint limit reached");
        require(nextTokenId <= MAX_COLLECTION_SIZE, "Max already minted");
    }

    function reveal(string memory _uri) external onlyOwner {
        require(!revealed, "Already revealed");

        uri = _uri;
        revealed = true;
        emit Revealed(uri, block.timestamp);
    }

    function totalSupply() external view returns (uint256) {
        return nextTokenId;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setMintPaused(bool _paused) external onlyOwner {
        mintPaused = _paused;
    }

    function setFreeMintPaused(bool _paused) external onlyOwner {
        freeMintPaused = _paused;
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    function setPaymentRecipient(address _paymentRecipient) external onlyOwner {
        paymentRecipient = _paymentRecipient;
    }

    function setFreeMintLeft(uint256 _freeMintLeft) external onlyOwner {
        freeMintLeft = _freeMintLeft;
    }

    function setMaxFreeMintLimit(uint256 _maxFreeMintLimit) external onlyOwner {
        maxFreeMintLimit = _maxFreeMintLimit;
    }

    function setMaxPriceMintLimit(uint256 _maxPriceMintLimit) external onlyOwner {
        maxPriceMintLimit = _maxPriceMintLimit;
    }

    function setMaxOwnerMintLimit(uint256 _maxOwnerMintLimit) external onlyOwner {
        maxOwnerMintLimit = _maxOwnerMintLimit;
    }
}
