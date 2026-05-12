// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract OPCMarket is Ownable, ReentrancyGuard {
    enum AssetType {
        DocumentReport,
        TemplateMethodology,
        DatasetAnnotationPack
    }

    enum ProductionMode {
        HumanAuthored,
        AIAssisted,
        AgentExecuted
    }

    enum SubscriptionStatus {
        Active,
        Released,
        Disputed,
        Refunded
    }

    struct OPCProfile {
        bool verified;
        bytes32 verificationHash;
        string uri;
        uint64 verifiedAt;
    }

    struct Asset {
        address payable seller;
        bytes32 assetHash;
        bytes32 versionHash;
        string assetURI;
        string versionURI;
        AssetType assetType;
        ProductionMode productionMode;
        uint96 price;
        uint32 subscriptionDuration;
        bool active;
        uint32 version;
        uint32 totalSubscriptions;
    }

    struct Subscription {
        uint256 assetId;
        address payable buyer;
        address payable seller;
        uint96 value;
        bytes32 accessHash;
        bytes32 feedbackHash;
        string accessURI;
        string feedbackURI;
        uint64 createdAt;
        uint64 accessEndsAt;
        uint64 releasedAt;
        uint8 feedbackRating;
        SubscriptionStatus status;
    }

    uint16 public constant MAX_PLATFORM_FEE_BPS = 1_000;

    uint256 public nextAssetId = 1;
    uint256 public nextSubscriptionId = 1;
    uint16 public platformFeeBps;
    address payable public platformTreasury;

    mapping(address => OPCProfile) public opcProfiles;
    mapping(uint256 => Asset) public assets;
    mapping(uint256 => Subscription) public subscriptions;

    event OPCVerified(
        address indexed opc,
        bytes32 verificationHash,
        string uri
    );
    event OPCVerificationRevoked(address indexed opc);
    event AssetRegistered(
        uint256 indexed assetId,
        address indexed seller,
        AssetType assetType,
        ProductionMode productionMode,
        bytes32 assetHash,
        uint96 price,
        uint32 subscriptionDuration
    );
    event AssetVersionPublished(
        uint256 indexed assetId,
        uint32 version,
        bytes32 versionHash,
        string versionURI
    );
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        uint256 indexed assetId,
        address indexed buyer,
        address seller,
        uint96 value,
        uint64 accessEndsAt,
        bytes32 accessHash,
        string accessURI
    );
    event FeedbackSubmitted(
        uint256 indexed subscriptionId,
        uint8 rating,
        bytes32 feedbackHash,
        string feedbackURI
    );
    event FirstTermApproved(
        uint256 indexed subscriptionId,
        uint96 sellerValue,
        uint96 platformFee
    );
    event SubscriptionDisputed(
        uint256 indexed subscriptionId,
        bytes32 disputeHash,
        string disputeURI
    );
    event DisputeResolved(
        uint256 indexed subscriptionId,
        bool refundedBuyer,
        uint96 value
    );
    event PlatformTreasuryUpdated(address indexed platformTreasury);

    error InvalidAddress();
    error InvalidFee();
    error InvalidPrice();
    error InvalidDuration();
    error InvalidAsset();
    error InactiveAsset();
    error UnverifiedOPC();
    error InvalidPayment();
    error Unauthorized();
    error InvalidStatus();
    error InvalidRating();
    error TransferFailed();

    constructor(uint16 initialPlatformFeeBps) Ownable(msg.sender) {
        if (initialPlatformFeeBps > MAX_PLATFORM_FEE_BPS) {
            revert InvalidFee();
        }

        platformFeeBps = initialPlatformFeeBps;
        platformTreasury = payable(msg.sender);
    }

    function setPlatformTreasury(address payable nextTreasury) external onlyOwner {
        if (nextTreasury == address(0)) revert InvalidAddress();

        platformTreasury = nextTreasury;
        emit PlatformTreasuryUpdated(nextTreasury);
    }

    function verifyOPC(
        address opc,
        bytes32 verificationHash,
        string calldata uri
    ) external onlyOwner {
        if (opc == address(0)) revert InvalidAddress();

        opcProfiles[opc] = OPCProfile({
            verified: true,
            verificationHash: verificationHash,
            uri: uri,
            verifiedAt: uint64(block.timestamp)
        });

        emit OPCVerified(opc, verificationHash, uri);
    }

    function revokeOPC(address opc) external onlyOwner {
        opcProfiles[opc].verified = false;
        emit OPCVerificationRevoked(opc);
    }

    function registerAsset(
        bytes32 assetHash,
        string calldata assetURI,
        AssetType assetType,
        ProductionMode productionMode,
        uint96 price,
        uint32 subscriptionDuration,
        bytes32 versionHash,
        string calldata versionURI
    ) external returns (uint256 assetId) {
        if (!opcProfiles[msg.sender].verified) revert UnverifiedOPC();
        if (price == 0) revert InvalidPrice();
        if (subscriptionDuration == 0) revert InvalidDuration();

        assetId = nextAssetId++;
        assets[assetId] = Asset({
            seller: payable(msg.sender),
            assetHash: assetHash,
            versionHash: versionHash,
            assetURI: assetURI,
            versionURI: versionURI,
            assetType: assetType,
            productionMode: productionMode,
            price: price,
            subscriptionDuration: subscriptionDuration,
            active: true,
            version: 1,
            totalSubscriptions: 0
        });

        emit AssetRegistered(
            assetId,
            msg.sender,
            assetType,
            productionMode,
            assetHash,
            price,
            subscriptionDuration
        );
        emit AssetVersionPublished(assetId, 1, versionHash, versionURI);
    }

    function publishVersion(
        uint256 assetId,
        bytes32 versionHash,
        string calldata versionURI
    ) external {
        Asset storage asset = assets[assetId];
        if (asset.seller == address(0)) revert InvalidAsset();
        if (msg.sender != asset.seller) revert Unauthorized();

        asset.version += 1;
        asset.versionHash = versionHash;
        asset.versionURI = versionURI;

        emit AssetVersionPublished(
            assetId,
            asset.version,
            versionHash,
            versionURI
        );
    }

    function setAssetActive(uint256 assetId, bool active) external {
        Asset storage asset = assets[assetId];
        if (asset.seller == address(0)) revert InvalidAsset();
        if (msg.sender != asset.seller) revert Unauthorized();

        asset.active = active;
    }

    function subscribe(
        uint256 assetId,
        bytes32 accessHash,
        string calldata accessURI
    ) external payable nonReentrant returns (uint256 subscriptionId) {
        Asset storage asset = assets[assetId];
        if (asset.seller == address(0)) revert InvalidAsset();
        if (!asset.active) revert InactiveAsset();
        if (msg.value != asset.price) revert InvalidPayment();

        subscriptionId = nextSubscriptionId++;
        uint64 accessEndsAt = uint64(
            block.timestamp + asset.subscriptionDuration
        );
        asset.totalSubscriptions += 1;

        subscriptions[subscriptionId] = Subscription({
            assetId: assetId,
            buyer: payable(msg.sender),
            seller: asset.seller,
            value: uint96(msg.value),
            accessHash: accessHash,
            feedbackHash: bytes32(0),
            accessURI: accessURI,
            feedbackURI: "",
            createdAt: uint64(block.timestamp),
            accessEndsAt: accessEndsAt,
            releasedAt: 0,
            feedbackRating: 0,
            status: SubscriptionStatus.Active
        });

        emit SubscriptionCreated(
            subscriptionId,
            assetId,
            msg.sender,
            asset.seller,
            uint96(msg.value),
            accessEndsAt,
            accessHash,
            accessURI
        );
    }

    function submitFeedback(
        uint256 subscriptionId,
        uint8 rating,
        bytes32 feedbackHash,
        string calldata feedbackURI
    ) external {
        Subscription storage subscription = subscriptions[subscriptionId];
        if (subscription.buyer == address(0)) revert InvalidAsset();
        if (msg.sender != subscription.buyer) revert Unauthorized();
        if (
            subscription.status != SubscriptionStatus.Active &&
            subscription.status != SubscriptionStatus.Released
        ) revert InvalidStatus();
        if (rating == 0 || rating > 5) revert InvalidRating();

        subscription.feedbackRating = rating;
        subscription.feedbackHash = feedbackHash;
        subscription.feedbackURI = feedbackURI;

        emit FeedbackSubmitted(
            subscriptionId,
            rating,
            feedbackHash,
            feedbackURI
        );
    }

    function approveFirstTerm(uint256 subscriptionId) external nonReentrant {
        Subscription storage subscription = subscriptions[subscriptionId];
        if (subscription.buyer == address(0)) revert InvalidAsset();
        if (msg.sender != subscription.buyer && msg.sender != owner()) {
            revert Unauthorized();
        }
        if (subscription.status != SubscriptionStatus.Active) {
            revert InvalidStatus();
        }

        (uint96 sellerValue, uint96 platformFee) = _release(subscription);
        emit FirstTermApproved(subscriptionId, sellerValue, platformFee);
    }

    function requestRefund(
        uint256 subscriptionId,
        bytes32 disputeHash,
        string calldata disputeURI
    ) external {
        Subscription storage subscription = subscriptions[subscriptionId];
        if (subscription.buyer == address(0)) revert InvalidAsset();
        if (msg.sender != subscription.buyer) revert Unauthorized();
        if (subscription.status != SubscriptionStatus.Active) {
            revert InvalidStatus();
        }

        subscription.status = SubscriptionStatus.Disputed;
        emit SubscriptionDisputed(subscriptionId, disputeHash, disputeURI);
    }

    function resolveDispute(
        uint256 subscriptionId,
        bool refundBuyer
    ) external nonReentrant onlyOwner {
        Subscription storage subscription = subscriptions[subscriptionId];
        if (subscription.buyer == address(0)) revert InvalidAsset();
        if (subscription.status != SubscriptionStatus.Disputed) {
            revert InvalidStatus();
        }

        uint96 value = subscription.value;
        subscription.value = 0;

        if (refundBuyer) {
            subscription.status = SubscriptionStatus.Refunded;
            (bool ok, ) = subscription.buyer.call{value: value}("");
            if (!ok) revert TransferFailed();
        } else {
            subscription.value = value;
            _release(subscription);
        }

        emit DisputeResolved(subscriptionId, refundBuyer, value);
    }

    function _release(
        Subscription storage subscription
    ) private returns (uint96 sellerValue, uint96 platformFee) {
        uint96 value = subscription.value;
        subscription.value = 0;
        subscription.status = SubscriptionStatus.Released;
        subscription.releasedAt = uint64(block.timestamp);

        platformFee = uint96((uint256(value) * platformFeeBps) / 10_000);
        sellerValue = value - platformFee;

        if (platformFee > 0) {
            (bool feeOk, ) = platformTreasury.call{value: platformFee}("");
            if (!feeOk) revert TransferFailed();
        }

        if (sellerValue > 0) {
            (bool sellerOk, ) = subscription.seller.call{value: sellerValue}("");
            if (!sellerOk) revert TransferFailed();
        }
    }
}
