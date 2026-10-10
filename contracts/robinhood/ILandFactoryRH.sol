// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Factory for Robinhood Chain. Quote token is wSTRK.
contract ILandFactoryRH {
    address public constant QUOTE = 0xD9165b4921E07f1F272F9692dD6B76aC2837BE01; // wSTRK
    address public constant POOL_MANAGER = 0x8366a39CC670B4001A1121B8F6A443A643e40951;
    address public constant WETH = 0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73;

    event Launched(address indexed token, address indexed creator, string name, string symbol);

    address[] public tokens;

    function launch(string calldata name, string calldata symbol) external returns (address token) {
        require(bytes(name).length >= 2 && bytes(name).length <= 32, "name");
        require(bytes(symbol).length >= 1 && bytes(symbol).length <= 8, "symbol");

        // TODO: deploy full GrintaTemplateRH once parameterized
        // For now this records the intent
        token = address(uint160(uint256(keccak256(abi.encodePacked(name, symbol, block.timestamp)))));
        tokens.push(token);
        emit Launched(token, msg.sender, name, symbol);
    }

    function launchCount() external view returns (uint256) {
        return tokens.length;
    }
}
