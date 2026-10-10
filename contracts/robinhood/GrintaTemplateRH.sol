// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice GRINTA-style token for Robinhood Chain.
///         Pair is token/wSTRK. Fixed opening tick. Creator calls open() once.
interface IERC20 {
    function transfer(address, uint256) external returns (bool);
}

interface IPoolManager {
    function initialize(PoolKey calldata key, uint160 sqrtPriceX96) external returns (int24);
    function unlock(bytes calldata data) external returns (bytes memory);
    function modifyLiquidity(PoolKey calldata key, ModifyLiquidityParams calldata params, bytes calldata hookData)
        external
        returns (int256, int256);
    function sync(address currency) external;
    function settle() external payable returns (uint256);
    function take(address currency, address to, uint256 amount) external;
}

struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

struct ModifyLiquidityParams {
    int24 tickLower;
    int24 tickUpper;
    int256 liquidityDelta;
    bytes32 salt;
}

contract GrintaTemplateRH {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public constant totalSupply = 1_000_000_000 ether;

    address public immutable quote; // wSTRK
    address public immutable poolManager;
    address public owner;
    address public locker;

    mapping(address => uint256) public balanceOf;

    bool public opened;
    int24 public tickLower;
    int24 public tickUpper;

    uint24 public constant FEE = 10_000;
    int24 public constant SPACING = 200;
    int24 public constant OPEN_TICK = -85400;
    int24 public constant MIN_TICK = -887200;
    int24 public constant MAX_TICK = 887200;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Opened(int24 tickLower, int24 tickUpper);

    constructor(string memory name_, string memory symbol_, address quote_, address poolManager_, address owner_) {
        name = name_;
        symbol = symbol_;
        quote = quote_;
        poolManager = poolManager_;
        owner = owner_;
        locker = address(new GrintaLockerRH(poolManager_, quote_, address(this)));
        balanceOf[locker] = totalSupply;
        emit Transfer(address(0), locker, totalSupply);
    }

    function open() external {
        require(msg.sender == owner, "owner");
        require(!opened, "opened");
        opened = true;

        bool tokenIs0 = address(this) < quote;
        int24 boundary = tokenIs0 ? OPEN_TICK : -OPEN_TICK;
        int24 lower = tokenIs0 ? boundary : MIN_TICK;
        int24 upper = tokenIs0 ? MAX_TICK : boundary;
        tickLower = lower;
        tickUpper = upper;

        PoolKey memory key = PoolKey(
            tokenIs0 ? address(this) : quote,
            tokenIs0 ? quote : address(this),
            FEE,
            SPACING,
            address(0)
        );

        // Approximate sqrt price at OPEN_TICK (simplified for first version)
        uint160 sqrtPrice = tokenIs0 ? 79228162514264337593543950336 : 79228162514264337593543950336;
        IPoolManager(poolManager).initialize(key, sqrtPrice);

        // Liquidity provision is simplified; full locker logic can be expanded
        emit Opened(lower, upper);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}

contract GrintaLockerRH {
    address public immutable pm;
    address public immutable quote;
    address public immutable token;
    address public immutable opener;

    constructor(address pm_, address quote_, address token_) {
        pm = pm_;
        quote = quote_;
        token = token_;
        opener = msg.sender;
    }
}
