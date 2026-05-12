// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Draft contract for the OPC Trust Market v1 trust layer.
/// @dev This contract records public trust events and settles first-term subscriptions in native MON.
contract OPCTrustMarket {
    enum AssetType {
        DocumentReport,
        TemplateMethodology,
        DatasetAnnotationPack
    }

    enum ProductionMode {
        HumanAuthored,
        AiAssisted,
        AgentExecuted
    }

    struct Asset {
        uint256 id;
        address payable owner;
        AssetType assetType;
        ProductionMode productionMode;
        uint256 priceWei;
        string metadataUri;
        uint256 activeVersionId;
        bool listed;
    }

    struct Version {
        uint256 id;
        uint256 assetId;
        bytes32 contentHash;
        string uri;
    }

    struct Subscription {
        uint256 id;
        uint256 assetId;
        address buyer;
        uint256 activeVersionId;
        uint256 amountWei;
        uint256 expiresAt;
        bool escrowHeld;
    }

    address public owner;
    address payable public feeRecipient;
    uint16 public platformFeeBps = 800;
    bool public openPublishing = true;
    uint256 public nextAssetId = 1;
    uint256 public nextVersionId = 1;
    uint256 public nextSubscriptionId = 1;

    mapping(address => bool) public verifiedOpc;
    mapping(uint256 => Asset) public assets;
    mapping(uint256 => Version) public versions;
    mapping(uint256 => Subscription) public subscriptions;

    event OpcVerified(address indexed opc);
    event KnowledgeAssetRegistered(
        uint256 indexed assetId,
        address indexed owner,
        AssetType assetType,
        ProductionMode productionMode,
        uint256 priceWei,
        string metadataUri
    );
    event AssetVersionPublished(uint256 indexed assetId, uint256 indexed versionId, bytes32 contentHash, string uri);
    event SubscriptionPurchased(
        uint256 indexed subscriptionId,
        uint256 indexed assetId,
        address indexed buyer,
        uint256 activeVersionId,
        uint256 amountWei,
        uint256 expiresAt
    );
    event StructuredFeedbackSubmitted(uint256 indexed assetId, address indexed buyer, uint8 score);
    event EscrowReleased(uint256 indexed subscriptionId, address indexed seller, uint256 sellerAmountWei, uint256 platformFeeWei);
    event FirstTermRefunded(uint256 indexed subscriptionId, address indexed buyer, uint256 amountWei);
    event OpenPublishingSet(bool enabled);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyVerifiedOpc() {
        require(verifiedOpc[msg.sender], "not verified opc");
        _;
    }

    constructor(address payable initialFeeRecipient) {
        owner = msg.sender;
        feeRecipient = initialFeeRecipient;
    }

    function verifyOpc(address opc) external onlyOwner {
        verifiedOpc[opc] = true;
        emit OpcVerified(opc);
    }

    function setOpenPublishing(bool enabled) external onlyOwner {
        openPublishing = enabled;
        emit OpenPublishingSet(enabled);
    }

    function registerAsset(
        AssetType assetType,
        ProductionMode productionMode,
        uint256 priceWei,
        string calldata metadataUri
    ) external returns (uint256 assetId) {
        require(openPublishing || verifiedOpc[msg.sender], "not verified opc");
        require(priceWei > 0, "price required");
        require(bytes(metadataUri).length > 0, "metadata uri required");

        assetId = nextAssetId++;
        assets[assetId] = Asset({
            id: assetId,
            owner: payable(msg.sender),
            assetType: assetType,
            productionMode: productionMode,
            priceWei: priceWei,
            metadataUri: metadataUri,
            activeVersionId: 0,
            listed: true
        });

        emit KnowledgeAssetRegistered(assetId, msg.sender, assetType, productionMode, priceWei, metadataUri);
    }

    function publishVersion(uint256 assetId, bytes32 contentHash, string calldata uri)
        external
        returns (uint256 versionId)
    {
        Asset storage asset = assets[assetId];
        require(asset.owner == msg.sender, "not asset owner");
        require(asset.listed, "asset not listed");
        require(contentHash != bytes32(0), "content hash required");
        require(bytes(uri).length > 0, "uri required");

        versionId = nextVersionId++;
        versions[versionId] = Version({
            id: versionId,
            assetId: assetId,
            contentHash: contentHash,
            uri: uri
        });
        asset.activeVersionId = versionId;

        emit AssetVersionPublished(assetId, versionId, contentHash, uri);
    }

    function subscribe(uint256 assetId) external payable returns (uint256 subscriptionId) {
        Asset storage asset = assets[assetId];
        require(asset.listed, "asset not listed");
        require(asset.activeVersionId != 0, "no active version");
        require(msg.value == asset.priceWei, "wrong amount");

        subscriptionId = nextSubscriptionId++;
        subscriptions[subscriptionId] = Subscription({
            id: subscriptionId,
            assetId: assetId,
            buyer: msg.sender,
            activeVersionId: asset.activeVersionId,
            amountWei: msg.value,
            expiresAt: block.timestamp + 30 days,
            escrowHeld: true
        });

        emit SubscriptionPurchased(
            subscriptionId,
            assetId,
            msg.sender,
            asset.activeVersionId,
            msg.value,
            block.timestamp + 30 days
        );
    }

    function releaseEscrow(uint256 subscriptionId) external onlyOwner {
        Subscription storage subscription = subscriptions[subscriptionId];
        require(subscription.escrowHeld, "escrow not held");
        Asset storage asset = assets[subscription.assetId];

        subscription.escrowHeld = false;
        uint256 platformFee = subscription.amountWei * platformFeeBps / 10_000;
        uint256 sellerAmount = subscription.amountWei - platformFee;

        (bool sellerPaid,) = asset.owner.call{value: sellerAmount}("");
        require(sellerPaid, "seller payment failed");
        (bool feePaid,) = feeRecipient.call{value: platformFee}("");
        require(feePaid, "fee payment failed");

        emit EscrowReleased(subscriptionId, asset.owner, sellerAmount, platformFee);
    }

    function releaseMyEscrow(uint256 subscriptionId) external {
        Subscription storage subscription = subscriptions[subscriptionId];
        require(subscription.escrowHeld, "escrow not held");
        Asset storage asset = assets[subscription.assetId];
        require(asset.owner == msg.sender, "not asset owner");

        subscription.escrowHeld = false;
        uint256 platformFee = subscription.amountWei * platformFeeBps / 10_000;
        uint256 sellerAmount = subscription.amountWei - platformFee;

        (bool sellerPaid,) = asset.owner.call{value: sellerAmount}("");
        require(sellerPaid, "seller payment failed");
        (bool feePaid,) = feeRecipient.call{value: platformFee}("");
        require(feePaid, "fee payment failed");

        emit EscrowReleased(subscriptionId, asset.owner, sellerAmount, platformFee);
    }

    function refundFirstTerm(uint256 subscriptionId) external onlyOwner {
        Subscription storage subscription = subscriptions[subscriptionId];
        require(subscription.escrowHeld, "escrow not held");
        subscription.escrowHeld = false;

        (bool refunded,) = payable(subscription.buyer).call{value: subscription.amountWei}("");
        require(refunded, "refund failed");

        emit FirstTermRefunded(subscriptionId, subscription.buyer, subscription.amountWei);
    }

    function submitStructuredFeedback(uint256 assetId, uint8 score) external {
        require(assets[assetId].listed, "asset not listed");
        require(score >= 1 && score <= 5, "invalid score");
        emit StructuredFeedbackSubmitted(assetId, msg.sender, score);
    }

    function getAsset(uint256 assetId) external view returns (Asset memory) {
        return assets[assetId];
    }
}
