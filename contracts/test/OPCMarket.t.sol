// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {OPCMarket} from "../src/OPCMarket.sol";

contract OPCMarketTest is Test {
    OPCMarket private market;

    address payable private seller = payable(address(0xA11CE));
    address payable private buyer = payable(address(0xB0B));
    address payable private treasury = payable(address(0xCAFE));

    uint16 private constant FEE_BPS = 250;
    uint96 private constant PRICE = 1 ether;

    function setUp() public {
        market = new OPCMarket(FEE_BPS);
        market.setPlatformTreasury(treasury);
        vm.deal(buyer, 10 ether);
    }

    function testOwnerVerifiesOPCAndSellerRegistersKnowledgeAsset() public {
        uint256 assetId = _registerAsset();

        (
            address registeredSeller,
            bytes32 assetHash,
            bytes32 versionHash,
            string memory assetURI,
            string memory versionURI,
            OPCMarket.AssetType assetType,
            OPCMarket.ProductionMode productionMode,
            uint96 price,
            uint32 subscriptionDuration,
            bool active,
            uint32 version,
            uint32 totalSubscriptions
        ) = market.assets(assetId);

        assertEq(registeredSeller, seller);
        assertEq(assetHash, keccak256("growth-report"));
        assertEq(versionHash, keccak256("growth-report-v1"));
        assertEq(assetURI, "ipfs://asset");
        assertEq(versionURI, "ipfs://asset/v1");
        assertEq(uint8(assetType), uint8(OPCMarket.AssetType.DocumentReport));
        assertEq(
            uint8(productionMode),
            uint8(OPCMarket.ProductionMode.AIAssisted)
        );
        assertEq(price, PRICE);
        assertEq(subscriptionDuration, 30 days);
        assertTrue(active);
        assertEq(version, 1);
        assertEq(totalSubscriptions, 0);
    }

    function testUnverifiedOPCCannotRegisterAsset() public {
        vm.expectRevert(OPCMarket.UnverifiedOPC.selector);
        vm.prank(seller);
        market.registerAsset(
            keccak256("fake"),
            "ipfs://fake",
            OPCMarket.AssetType.DocumentReport,
            OPCMarket.ProductionMode.AIAssisted,
            PRICE,
            30 days,
            keccak256("fake-v1"),
            "ipfs://fake/v1"
        );
    }

    function testSubscriptionCreatesAccessRecord() public {
        uint256 assetId = _registerAsset();

        vm.prank(buyer);
        uint256 subscriptionId = market.subscribe{value: PRICE}(
            assetId,
            keccak256("access"),
            "ipfs://access"
        );

        (
            uint256 subscribedAssetId,
            address registeredBuyer,
            address registeredSeller,
            uint96 value,
            bytes32 accessHash,
            ,
            string memory accessURI,
            ,
            ,
            uint64 accessEndsAt,
            ,
            ,
            OPCMarket.SubscriptionStatus status
        ) = market.subscriptions(subscriptionId);

        (, , , , , , , , , , , uint32 totalSubscriptions) = market.assets(
            assetId
        );

        assertEq(subscribedAssetId, assetId);
        assertEq(registeredBuyer, buyer);
        assertEq(registeredSeller, seller);
        assertEq(value, PRICE);
        assertEq(accessHash, keccak256("access"));
        assertEq(accessURI, "ipfs://access");
        assertGt(accessEndsAt, block.timestamp);
        assertEq(uint8(status), uint8(OPCMarket.SubscriptionStatus.Active));
        assertEq(totalSubscriptions, 1);
    }

    function testFeedbackAndApprovalReleaseFundsWithPlatformFee() public {
        uint256 assetId = _registerAsset();

        vm.prank(buyer);
        uint256 subscriptionId = market.subscribe{value: PRICE}(
            assetId,
            keccak256("access"),
            "ipfs://access"
        );

        vm.prank(buyer);
        market.submitFeedback(
            subscriptionId,
            5,
            keccak256("feedback"),
            "ipfs://feedback"
        );

        uint256 sellerBalanceBefore = seller.balance;
        uint256 treasuryBalanceBefore = treasury.balance;
        uint96 expectedFee = uint96((uint256(PRICE) * FEE_BPS) / 10_000);

        vm.prank(buyer);
        market.approveFirstTerm(subscriptionId);

        assertEq(seller.balance, sellerBalanceBefore + PRICE - expectedFee);
        assertEq(treasury.balance, treasuryBalanceBefore + expectedFee);

        (, , , uint96 value, , bytes32 feedbackHash, , , , , , uint8 rating, OPCMarket.SubscriptionStatus status) = market
            .subscriptions(subscriptionId);

        assertEq(value, 0);
        assertEq(feedbackHash, keccak256("feedback"));
        assertEq(rating, 5);
        assertEq(uint8(status), uint8(OPCMarket.SubscriptionStatus.Released));
    }

    function testBuyerCanRequestRefundAndPlatformCanResolve() public {
        uint256 assetId = _registerAsset();

        vm.prank(buyer);
        uint256 subscriptionId = market.subscribe{value: PRICE}(
            assetId,
            keccak256("access"),
            "ipfs://access"
        );

        uint256 buyerBalanceBeforeRefund = buyer.balance;

        vm.prank(buyer);
        market.requestRefund(
            subscriptionId,
            keccak256("content-mismatch"),
            "ipfs://dispute"
        );

        market.resolveDispute(subscriptionId, true);

        assertEq(buyer.balance, buyerBalanceBeforeRefund + PRICE);

        (, , , uint96 value, , , , , , , , , OPCMarket.SubscriptionStatus status) = market
            .subscriptions(subscriptionId);
        assertEq(value, 0);
        assertEq(uint8(status), uint8(OPCMarket.SubscriptionStatus.Refunded));
    }

    function testSellerCanPublishNewVersion() public {
        uint256 assetId = _registerAsset();

        vm.prank(seller);
        market.publishVersion(
            assetId,
            keccak256("growth-report-v2"),
            "ipfs://asset/v2"
        );

        (, , bytes32 versionHash, , string memory versionURI, , , , , , uint32 version, ) = market
            .assets(assetId);

        assertEq(versionHash, keccak256("growth-report-v2"));
        assertEq(versionURI, "ipfs://asset/v2");
        assertEq(version, 2);
    }

    function _registerAsset() private returns (uint256 assetId) {
        market.verifyOPC(seller, keccak256("portfolio-pack"), "ipfs://seller");

        vm.prank(seller);
        assetId = market.registerAsset(
            keccak256("growth-report"),
            "ipfs://asset",
            OPCMarket.AssetType.DocumentReport,
            OPCMarket.ProductionMode.AIAssisted,
            PRICE,
            30 days,
            keccak256("growth-report-v1"),
            "ipfs://asset/v1"
        );
    }
}
