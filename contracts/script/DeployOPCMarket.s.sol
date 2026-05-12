// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {OPCMarket} from "../src/OPCMarket.sol";

contract DeployOPCMarket is Script {
    function run() external returns (OPCMarket market) {
        vm.startBroadcast();
        market = new OPCMarket(250);

        address deployer = msg.sender;
        market.verifyOPC(
            deployer,
            keccak256(bytes("demo-portfolio-pack")),
            "ipfs://opc-knovault/demo-seller"
        );

        market.registerAsset(
            keccak256(bytes("ai-growth-audit-report")),
            "ipfs://opc-knovault/assets/ai-growth-audit",
            OPCMarket.AssetType.DocumentReport,
            OPCMarket.ProductionMode.AIAssisted,
            uint96(18_000_000_000_000_000),
            30 days,
            keccak256(bytes("ai-growth-audit-report-v1.4")),
            "ipfs://opc-knovault/assets/ai-growth-audit/v1.4"
        );

        market.registerAsset(
            keccak256(bytes("monad-bd-knowledge-base")),
            "ipfs://opc-knovault/assets/monad-bd",
            OPCMarket.AssetType.TemplateMethodology,
            OPCMarket.ProductionMode.HumanAuthored,
            uint96(9_000_000_000_000_000),
            14 days,
            keccak256(bytes("monad-bd-knowledge-base-v2.1")),
            "ipfs://opc-knovault/assets/monad-bd/v2.1"
        );

        market.registerAsset(
            keccak256(bytes("chinese-agent-eval-dataset")),
            "ipfs://opc-knovault/assets/chinese-agent-eval",
            OPCMarket.AssetType.DatasetAnnotationPack,
            OPCMarket.ProductionMode.AgentExecuted,
            uint96(26_000_000_000_000_000),
            30 days,
            keccak256(bytes("chinese-agent-eval-dataset-v0.9")),
            "ipfs://opc-knovault/assets/chinese-agent-eval/v0.9"
        );

        market.registerAsset(
            keccak256(bytes("solo-founder-gtm-methodology")),
            "ipfs://opc-knovault/assets/solo-founder-gtm",
            OPCMarket.AssetType.TemplateMethodology,
            OPCMarket.ProductionMode.AIAssisted,
            uint96(14_000_000_000_000_000),
            21 days,
            keccak256(bytes("solo-founder-gtm-methodology-v1.2")),
            "ipfs://opc-knovault/assets/solo-founder-gtm/v1.2"
        );

        vm.stopBroadcast();
    }
}
