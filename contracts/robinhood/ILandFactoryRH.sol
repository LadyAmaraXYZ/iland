// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Minimal factory for Robinhood Chain. Deploys GRINTA-style tokens
///         paired against a fixed quote token (wSTRK) at fixed opening tick.
contract ILandFactoryRH {
    address public immutable quoteToken; // wSTRK
    address public immutable poolManager;
    address public immutable weth;

    event Launched(address indexed token, address indexed creator, string name, string symbol);

    address[] public tokens;

    constructor(address quoteToken_, address poolManager_, address weth_) {
        quoteToken = quoteToken_;
        poolManager = poolManager_;
        weth = weth_;
    }

    function launch(string calldata name, string calldata symbol) external returns (address token) {
        // For the first version we deploy a simple token and the creator
        // can open the pool manually with the same logic as GRINTA.
        // Full template deployment can be added once wSTRK is live.
        require(bytes(name).length >= 2, "name");
        require(bytes(symbol).length >= 1, "symbol");

        // Placeholder: real deployment of GrintaTemplateRH comes next
        // after we finalize the quote token address.
        token = address(0);
        emit Launched(token, msg.sender, name, symbol);
    }
}
