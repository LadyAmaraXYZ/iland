// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./GrintaTemplate.sol";

/// @notice Factory that deploys GRINTA-style tokens.
///         Each token starts at fixed MCAP (OPEN_TICK = -85400).
///         Creator receives the token contract and can call open() once.
contract ILandFactory {
    event Launched(address indexed token, address indexed creator, string name, string symbol);

    address[] public tokens;
    mapping(address => address) public creatorOf;

    function launch(string calldata name, string calldata symbol) external returns (address token) {
        require(bytes(name).length >= 2 && bytes(name).length <= 32, "name");
        require(bytes(symbol).length >= 1 && bytes(symbol).length <= 8, "symbol");

        GrintaTemplate t = new GrintaTemplate(name, symbol, msg.sender);
        token = address(t);
        tokens.push(token);
        creatorOf[token] = msg.sender;

        emit Launched(token, msg.sender, name, symbol);
    }

    function launchCount() external view returns (uint256) {
        return tokens.length;
    }

    function tokenAt(uint256 index) external view returns (address) {
        return tokens[index];
    }
}
