// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {OPCMarket} from "../src/OPCMarket.sol";

contract DeployOPCMarket is Script {
    function run() external returns (OPCMarket market) {
        vm.startBroadcast();
        market = new OPCMarket(250);
        vm.stopBroadcast();
    }
}
