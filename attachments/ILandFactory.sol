// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice iLAND factory. One-sided Uniswap v4 pool against Ethereum STRK.
///         ILandSniperHook takes 99% for 20 seconds from initialize, then 1%.
///         During those 20 seconds only the locker may add liquidity, and nobody may remove it.
///         Not deployed. Not audited. Deploy the hook deployer first from
///         0x6A41695dfF6a581390e115199Ef4322FC831B208.

interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
}

interface IPoolManager {
    function initialize(PoolKey calldata key, uint160 sqrtPriceX96) external returns (int24);
    function unlock(bytes calldata data) external returns (bytes memory);
    function modifyLiquidity(PoolKey calldata key, ModifyLiquidityParams calldata params, bytes calldata hookData)
        external
        returns (int256 callerDelta, int256 feesAccrued);
    function sync(address currency) external;
    function settle() external payable returns (uint256);
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

library FullMath {
    function mulDiv(uint256 a, uint256 b, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            uint256 prod0;
            uint256 prod1;
            assembly {
                let mm := mulmod(a, b, not(0))
                prod0 := mul(a, b)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }
            if (prod1 == 0) {
                require(denominator > 0);
                assembly {
                    result := div(prod0, denominator)
                }
                return result;
            }
            require(denominator > prod1);
            uint256 remainder;
            assembly {
                remainder := mulmod(a, b, denominator)
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                denominator := div(denominator, twos)
                prod0 := div(prod0, twos)
                twos := add(div(sub(0, twos), twos), 1)
            }
            prod0 |= prod1 * twos;
            uint256 inverse = (3 * denominator) ^ 2;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            result = prod0 * inverse;
        }
    }
}

contract ILandToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, address to, uint256 supply) {
        require(bytes(name_).length > 0 && bytes(symbol_).length > 0, "name");
        name = name_;
        symbol = symbol_;
        totalSupply = supply;
        balanceOf[to] = supply;
        emit Transfer(address(0), to, supply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "allowance");
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "to");
        uint256 bal = balanceOf[from];
        require(bal >= value, "balance");
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}

contract ILandLocker {
    IPoolManager public immutable pm;
    address public immutable factory;
    address public immutable strk;

    error NotFactory();
    error NotManager();
    error NotSingleSided();

    constructor(address pm_, address strk_) {
        pm = IPoolManager(pm_);
        factory = msg.sender;
        strk = strk_;
    }

    function provide(PoolKey calldata key, int24 tickLower, int24 tickUpper, uint128 liquidity) external {
        if (msg.sender != factory) revert NotFactory();
        pm.unlock(abi.encode(key, tickLower, tickUpper, liquidity));
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != address(pm)) revert NotManager();
        (PoolKey memory key, int24 tickLower, int24 tickUpper, uint128 liquidity) =
            abi.decode(data, (PoolKey, int24, int24, uint128));
        (int256 delta,) = pm.modifyLiquidity(
            key, ModifyLiquidityParams(tickLower, tickUpper, int256(uint256(liquidity)), bytes32(0)), ""
        );
        int128 amount0 = int128(delta >> 128);
        int128 amount1 = int128(delta);
        int128 owed0 = amount0 < 0 ? -amount0 : int128(0);
        int128 owed1 = amount1 < 0 ? -amount1 : int128(0);
        address token = key.currency0 == strk ? key.currency1 : key.currency0;
        if (token == key.currency0) {
            if (owed1 != 0) revert NotSingleSided();
            _settle(key.currency0, uint256(uint128(owed0)));
        } else {
            if (owed0 != 0) revert NotSingleSided();
            _settle(key.currency1, uint256(uint128(owed1)));
        }
        return "";
    }

    function _settle(address currency, uint256 amount) internal {
        if (amount == 0) return;
        pm.sync(currency);
        require(IERC20(currency).transfer(address(pm), amount), "transfer");
        pm.settle();
    }
}

library HookFlags {
    uint160 internal constant FLAGS = 0x1A80;
}

contract ILandSniperHook {
    uint160 public constant FLAGS = HookFlags.FLAGS;
    uint24 public constant OVERRIDE_FEE_FLAG = 0x400000;
    uint24 public constant GUARD_FEE = 990_000;
    uint24 public constant OPEN_FEE = 10_000;
    uint256 public constant WINDOW = 20;
    address public constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;

    mapping(bytes32 id => uint256 openedAt) public openedAt;
    mapping(bytes32 id => address initializer) public initializer;

    error NotManager();
    error Guarded();

    modifier onlyManager() {
        if (msg.sender != POOL_MANAGER) revert NotManager();
        _;
    }

    function afterInitialize(address sender, PoolKey calldata key, uint160, int24) external onlyManager returns (bytes4) {
        bytes32 id = _id(key);
        if (openedAt[id] != 0) revert Guarded();
        openedAt[id] = block.timestamp;
        initializer[id] = sender;
        return ILandSniperHook.afterInitialize.selector;
    }

    function beforeAddLiquidity(address sender, PoolKey calldata key, ModifyLiquidityParams calldata, bytes calldata)
        external
        view
        onlyManager
        returns (bytes4)
    {
        if (_guarded(key) && sender != _locker(initializer[_id(key)])) revert Guarded();
        return ILandSniperHook.beforeAddLiquidity.selector;
    }

    function beforeRemoveLiquidity(address, PoolKey calldata key, ModifyLiquidityParams calldata, bytes calldata)
        external
        view
        onlyManager
        returns (bytes4)
    {
        if (_guarded(key)) revert Guarded();
        return ILandSniperHook.beforeRemoveLiquidity.selector;
    }

    function beforeSwap(address, PoolKey calldata key, SwapParams calldata, bytes calldata)
        external
        view
        onlyManager
        returns (bytes4, int256, uint24)
    {
        uint24 fee = _guarded(key) ? GUARD_FEE : OPEN_FEE;
        return (ILandSniperHook.beforeSwap.selector, 0, fee | OVERRIDE_FEE_FLAG);
    }

    function quoteFee(PoolKey calldata key) external view returns (uint24) {
        return _guarded(key) ? GUARD_FEE : OPEN_FEE;
    }

    function _guarded(PoolKey calldata key) internal view returns (bool) {
        uint256 opened = openedAt[_id(key)];
        if (opened == 0) return true;
        return block.timestamp < opened + WINDOW;
    }

    /// @dev The factory's first CREATE is the locker, so its nonce is 1.
    function _locker(address factory) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), factory, bytes1(0x01))))));
    }

    function _id(PoolKey calldata key) internal pure returns (bytes32) {
        return keccak256(abi.encode(key));
    }
}

contract ILandHookDeployer {
    function deploy(bytes32 salt) external returns (address hook) {
        hook = address(new ILandSniperHook{salt: salt}());
    }
}

contract ILandFactory {
    uint256 public constant SUPPLY = 1_000_000_000 ether;
    /// @dev Dynamic-fee flag. The hook returns 990000 for 20 seconds, then 10000.
    uint24 public constant FEE = 0x800000;
    int24 public constant SPACING = 200;
    int24 public constant MIN_TICK = -887200;
    int24 public constant MAX_TICK = 887200;
    uint256 internal constant Q96 = 2 ** 96;

    address public constant STRK = 0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766;
    address public constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;

    address public immutable owner;
    address public immutable hook;
    ILandLocker public immutable locker;
    bool public publicLaunches;

    struct Launch {
        address token;
        address creator;
        int24 tickLower;
        int24 tickUpper;
        uint160 sqrtPriceX96;
    }

    Launch[] public launches;

    event Launched(address indexed token, address indexed creator, int24 tickLower, int24 tickUpper, uint160 sqrtPriceX96);

    error NotAllowed();
    error Tick();
    error Liquidity();
    error Hook();

    constructor(address hook_) {
        if (uint160(hook_) & 0x3FFF != HookFlags.FLAGS) revert Hook();
        owner = msg.sender;
        hook = hook_;
        locker = new ILandLocker(POOL_MANAGER, STRK);
    }

    function launchCount() external view returns (uint256) {
        return launches.length;
    }

    function setPublicLaunches(bool open) external {
        if (msg.sender != owner) revert NotAllowed();
        publicLaunches = open;
    }

    /// @param startTick Price boundary, multiple of 200, strictly inside the range.
    ///        Token below STRK: this is the floor. Token above STRK: this is the ceiling.
    function launch(string calldata name, string calldata symbol, int24 startTick) external returns (address token) {
        if (!publicLaunches && msg.sender != owner) revert NotAllowed();
        if (startTick % SPACING != 0 || startTick <= MIN_TICK || startTick >= MAX_TICK) revert Tick();

        token = address(new ILandToken(name, symbol, address(locker), SUPPLY));
        bool tokenIs0 = token < STRK;
        int24 tickLower = tokenIs0 ? startTick : MIN_TICK;
        int24 tickUpper = tokenIs0 ? MAX_TICK : startTick;
        uint160 sqrtLower = TickMath.getSqrtRatioAtTick(tickLower);
        uint160 sqrtUpper = TickMath.getSqrtRatioAtTick(tickUpper);
        uint160 sqrtPrice = tokenIs0 ? sqrtLower : sqrtUpper;

        uint128 liquidity = tokenIs0
            ? _liq0(SUPPLY, sqrtLower, sqrtUpper)
            : _liq1(SUPPLY, sqrtLower, sqrtUpper);
        if (liquidity == 0) revert Liquidity();

        PoolKey memory key = PoolKey(tokenIs0 ? token : STRK, tokenIs0 ? STRK : token, FEE, SPACING, hook);
        IPoolManager(POOL_MANAGER).initialize(key, sqrtPrice);
        locker.provide(key, tickLower, tickUpper, liquidity);

        launches.push(Launch(token, msg.sender, tickLower, tickUpper, sqrtPrice));
        emit Launched(token, msg.sender, tickLower, tickUpper, sqrtPrice);
    }

    function _liq0(uint256 amount, uint160 sqrtA, uint160 sqrtB) internal pure returns (uint128) {
        uint256 intermediate = FullMath.mulDiv(sqrtA, sqrtB, Q96);
        uint256 l = FullMath.mulDiv(amount, intermediate, uint256(sqrtB) - uint256(sqrtA));
        if (l > type(uint128).max) revert Liquidity();
        return uint128(l);
    }

    function _liq1(uint256 amount, uint160 sqrtA, uint160 sqrtB) internal pure returns (uint128) {
        uint256 l = FullMath.mulDiv(amount, Q96, uint256(sqrtB) - uint256(sqrtA));
        if (l > type(uint128).max) revert Liquidity();
        return uint128(l);
    }
}
