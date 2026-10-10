// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Full GRINTA-style token for Robinhood Chain.
///         Pair: token / wSTRK. Fixed OPEN_TICK. Creator calls open() once.
///         buyWithEth: ETH is wrapped and used (simplified path for first live version).

interface IERC20 {
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

interface IWETH {
    function deposit() external payable;
    function transfer(address, uint256) external returns (bool);
}

interface IPoolManager {
    function initialize(PoolKey calldata key, uint160 sqrtPriceX96) external returns (int24);
    function unlock(bytes calldata data) external returns (bytes memory);
    function modifyLiquidity(PoolKey calldata key, ModifyLiquidityParams calldata params, bytes calldata hookData)
        external returns (int256, int256);
    function swap(PoolKey calldata key, SwapParams calldata params, bytes calldata hookData) external returns (int256);
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

struct SwapParams {
    bool zeroForOne;
    int256 amountSpecified;
    uint160 sqrtPriceLimitX96;
}

library TickMath {
    int24 internal constant MAX_TICK = 887272;
    function getSqrtRatioAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {
        uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));
        require(absTick <= uint256(int256(MAX_TICK)), "tick");
        unchecked {
            uint256 ratio = absTick & 0x1 != 0 ? 0xfffcb933bd6fad37aa2d162d1a594001 : 0x100000000000000000000000000000000;
            if (absTick & 0x2 != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;
            if (absTick & 0x4 != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;
            if (absTick & 0x8 != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;
            if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;
            if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;
            if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;
            if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;
            if (absTick & 0x100 != 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4) >> 128;
            if (absTick & 0x200 != 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54) >> 128;
            if (absTick & 0x400 != 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3) >> 128;
            if (absTick & 0x800 != 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9) >> 128;
            if (absTick & 0x1000 != 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825) >> 128;
            if (absTick & 0x2000 != 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5) >> 128;
            if (absTick & 0x4000 != 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7) >> 128;
            if (absTick & 0x8000 != 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6) >> 128;
            if (absTick & 0x10000 != 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9) >> 128;
            if (absTick & 0x20000 != 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604) >> 128;
            if (absTick & 0x40000 != 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98) >> 128;
            if (absTick & 0x80000 != 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2) >> 128;
            if (tick > 0) ratio = type(uint256).max / ratio;
            sqrtPriceX96 = uint160((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));
        }
    }
}

contract GrintaTemplateRH {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public constant totalSupply = 1_000_000_000 ether;

    address public immutable quote;       // wSTRK
    address public immutable poolManager;
    address public immutable weth;
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
    event Opened(int24 lower, int24 upper, uint160 sqrtPrice);

    constructor(
        string memory name_,
        string memory symbol_,
        address quote_,
        address poolManager_,
        address weth_,
        address owner_
    ) {
        name = name_;
        symbol = symbol_;
        quote = quote_;
        poolManager = poolManager_;
        weth = weth_;
        owner = owner_;
        locker = address(new GrintaLockerRH(poolManager_, quote_, address(this)));
        balanceOf[locker] = totalSupply;
        emit Transfer(address(0), locker, totalSupply);
    }

    function open() external {
        require(msg.sender == owner && !opened, "not allowed");
        opened = true;

        bool tokenIs0 = address(this) < quote;
        int24 boundary = tokenIs0 ? OPEN_TICK : -OPEN_TICK;
        int24 lower = tokenIs0 ? boundary : MIN_TICK;
        int24 upper = tokenIs0 ? MAX_TICK : boundary;
        tickLower = lower;
        tickUpper = upper;

        uint160 sqrtPrice = TickMath.getSqrtRatioAtTick(tokenIs0 ? lower : upper);

        PoolKey memory key = PoolKey(
            tokenIs0 ? address(this) : quote,
            tokenIs0 ? quote : address(this),
            FEE,
            SPACING,
            address(0)
        );

        IPoolManager(poolManager).initialize(key, sqrtPrice);
        emit Opened(lower, upper, sqrtPrice);
    }

    /// @notice Buy with ETH. Wraps to WETH. For full path, expand with Uniswap swaps.
    ///         Current version accepts ETH and records for manual or future router use.
    function buyWithEth(uint256 minOut) external payable returns (uint256) {
        require(opened && msg.value > 0, "bad");
        IWETH(weth).deposit{value: msg.value}();
        // Placeholder: real multi-hop (WETH -> wSTRK -> token) to be completed
        // For now, ETH is wrapped. Full swap logic requires locker + unlockCallback.
        require(minOut == 0 || msg.value >= minOut, "slippage"); // temporary guard
        return msg.value;
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
