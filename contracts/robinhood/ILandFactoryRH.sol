// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./GrintaTemplateRH.sol";

contract ILandFactoryRH {
    address public constant QUOTE = 0xD9165b4921E07f1F272F9692dD6B76aC2837BE01;
    address public constant POOL_MANAGER = 0x8366a39CC670B4001A1121B8F6A443A643e40951;

    event Launched(address indexed token, address indexed creator, string name, string symbol);

    address[] public tokens;

    function launch(string calldata name, string calldata symbol) external returns (address token) {
        require(bytes(name).length >= 2 && bytes(name).length <= 32, "name");
        require(bytes(symbol).length >= 1 && bytes(symbol).length <= 8, "symbol");

        GrintaTemplateRH t = new GrintaTemplateRH(name, symbol, QUOTE, POOL_MANAGER, msg.sender);
        token = address(t);
        tokens.push(token);
        emit Launched(token, msg.sender, name, symbol);
    }

    function launchCount() external view returns (uint256) {
        return tokens.length;
    }

    function tokenAt(uint256 index) external view returns (address) {
        return tokens[index];
    }
}
