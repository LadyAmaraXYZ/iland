// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice FRI. One contract. No factory.
///         Pair is FRI/STRK on Uniswap v4. The position is one-sided and has no withdraw.
///         Send ETH here. The contract buys STRK, then FRI, and sends FRI to you.
///         Website and the only social: https://iland.lol
///
///         Remix: solc 0.8.26, optimizer 200 runs, Cancun. No constructor arguments. Value 0.
///         Then call open() once. Wait 20 seconds. The first 20 seconds charge 99 percent.
///         The pool cannot be opened inside the constructor: the token code is not live yet.
///         Uses the already deployed iLAND hook. It does not call the factory.

interface IERC20 {
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

interface IWETH {
    function deposit() external payable;
}

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function getReserves() external view returns (uint112, uint112, uint32);
    function swap(uint256, uint256, address, bytes calldata) external;
}

interface IPoolManager {
    function initialize(PoolKey calldata key, uint160 sqrtPriceX96) external returns (int24);
    function unlock(bytes calldata data) external returns (bytes memory);
    function modifyLiquidity(PoolKey calldata key, ModifyLiquidityParams calldata params, bytes calldata hookData)
        external
        returns (int256, int256);
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

library FriTick {
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

library FriMath {
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

contract FriLocker {
    IPoolManager public immutable pm;
    address public immutable strk;
    address public immutable fri;
    address public immutable opener;

    error NotOpener();
    error NotManager();
    error NotSingleSided();

    constructor(address pm_, address strk_) {
        pm = IPoolManager(pm_);
        strk = strk_;
        fri = msg.sender;
        opener = msg.sender;
    }

    function provide(PoolKey calldata key, int24 tickLower, int24 tickUpper, uint128 liquidity) external {
        if (msg.sender != opener) revert NotOpener();
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
        int128 amount1 = int128(int256(int128(delta)));
        int128 owed0 = amount0 < 0 ? -amount0 : int128(0);
        int128 owed1 = amount1 < 0 ? -amount1 : int128(0);
        if (fri < strk) {
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

contract FRI {
    string public constant name = "FRI";
    string public constant symbol = "FRI";
    string public constant description =
        "FRI is paired with STRK on Ethereum. Send ETH to this contract. It buys STRK, then FRI, and sends the FRI to you. The only announcement is https://iland.lol";
    string public constant website = "https://iland.lol";
    string public constant socials = "https://iland.lol";
    uint8 public constant decimals = 18;
    uint256 public constant totalSupply = 1_000_000_000 ether;

    address public constant STRK = 0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;
    address public constant HOOK = 0xB6B2a165D17EAF9a6E751eF0B06Ed218ac92Da80;
    address public constant WETH_STRK = 0x311ce099976D72F9e093690FD1408a14Ad4ED4DA;

    uint24 public constant FEE = 0x800000;
    int24 public constant SPACING = 200;
    int24 public constant MIN_TICK = -887200;
    int24 public constant MAX_TICK = 887200;
    int24 public constant OPEN_TICK = -85400;
    uint256 internal constant Q96 = 2 ** 96;
    uint160 internal constant MIN_SQRT = 4295128740;
    uint160 internal constant MAX_SQRT = 1461446703485210103287273052203988822378723970341;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    FriLocker public immutable locker;
    address public immutable owner;
    int24 public tickLower;
    int24 public tickUpper;
    uint256 public minTokensPerEth;
    uint256 private locked;
    bool public opened;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Opened(int24 tickLower, int24 tickUpper, uint160 sqrtPriceX96);
    event Bought(address indexed buyer, uint256 paid, uint256 friOut);

    error Amount();
    error Slippage();
    error NotManager();
    error NotAllowed();
    error TransferFailed();
    error NotOpen();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAllowed();
        _;
    }

    constructor() {
        owner = msg.sender;
        // First creation. The hook allows this address to place the position.
        locker = new FriLocker(POOL_MANAGER, STRK);
        balanceOf[address(locker)] = totalSupply;
        emit Transfer(address(0), address(locker), totalSupply);
    }

    /// @dev Call once, after deploy. The token code has to exist before it can be paid into the pool.
    function open() external onlyOwner {
        if (opened) revert NotAllowed();
        opened = true;
        bool tokenIs0 = address(this) < STRK;
        int24 boundary = tokenIs0 ? OPEN_TICK : -OPEN_TICK;
        int24 lower = tokenIs0 ? boundary : MIN_TICK;
        int24 upper = tokenIs0 ? MAX_TICK : boundary;
        tickLower = lower;
        tickUpper = upper;
        uint160 sqrtLower = FriTick.getSqrtRatioAtTick(lower);
        uint160 sqrtUpper = FriTick.getSqrtRatioAtTick(upper);
        uint160 sqrtPrice = tokenIs0 ? sqrtLower : sqrtUpper;
        uint128 liquidity = tokenIs0 ? _liq0(totalSupply, sqrtLower, sqrtUpper) : _liq1(totalSupply, sqrtLower, sqrtUpper);
        require(liquidity > 0, "liquidity");

        PoolKey memory key = PoolKey(tokenIs0 ? address(this) : STRK, tokenIs0 ? STRK : address(this), FEE, SPACING, HOOK);
        IPoolManager(POOL_MANAGER).initialize(key, sqrtPrice);
        locker.provide(key, lower, upper, liquidity);
        emit Opened(lower, upper, sqrtPrice);
    }

    /// @dev A normal ETH transfer. No function arguments.
    receive() external payable {
        if (!opened) revert NotOpen();
        if (msg.value == 0) revert Amount();
        _buy(msg.sender, msg.value, true);
    }

    /// @dev WETH must be approved to this contract first. Do not attach ETH.
    function buyWeth(uint256 amount) external {
        if (!opened) revert NotOpen();
        if (amount == 0) revert Amount();
        _pull(WETH, msg.sender, amount);
        _buy(msg.sender, amount, false);
    }

    /// @dev Whole FRI required for each 1 ETH. Zero leaves the buy unprotected.
    function setMinTokensPerEth(uint256 minTokens) external onlyOwner {
        minTokensPerEth = minTokens;
    }

    function sweep(address stuck, address to) external onlyOwner {
        if (to == address(0) || stuck == address(this)) revert Amount();
        uint256 amount = _balance(stuck, address(this));
        if (amount == 0) revert Amount();
        _push(stuck, to, amount);
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

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != POOL_MANAGER) revert NotManager();
        (address recipient, uint256 strkIn) = abi.decode(data, (address, uint256));
        bool tokenIs0 = address(this) < STRK;
        PoolKey memory key = PoolKey({
            currency0: tokenIs0 ? address(this) : STRK,
            currency1: tokenIs0 ? STRK : address(this),
            fee: FEE,
            tickSpacing: SPACING,
            hooks: HOOK
        });
        bool zeroForOne = !tokenIs0;
        int256 delta = IPoolManager(POOL_MANAGER).swap(
            key,
            SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: -int256(strkIn),
                sqrtPriceLimitX96: zeroForOne ? MIN_SQRT : MAX_SQRT
            }),
            ""
        );
        int128 amount0 = int128(delta >> 128);
        int128 amount1 = int128(int256(int128(delta)));
        _settleOrTake(key.currency0, amount0, recipient);
        _settleOrTake(key.currency1, amount1, recipient);
        return "";
    }

    function _buy(address recipient, uint256 amount, bool fromEth) internal {
        if (locked != 0) revert NotAllowed();
        locked = 1;
        if (fromEth) IWETH(WETH).deposit{value: amount}();
        uint256 strkIn = _v2(amount);
        uint256 beforeBal = balanceOf[recipient];
        IPoolManager(POOL_MANAGER).unlock(abi.encode(recipient, strkIn));
        uint256 friOut = balanceOf[recipient] - beforeBal;
        uint256 floor = minTokensPerEth;
        if (floor != 0 && friOut < floor * amount / 1 ether) revert Slippage();
        emit Bought(recipient, amount, friOut);
        locked = 0;
    }

    function _v2(uint256 amountIn) internal returns (uint256 amountOut) {
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(WETH_STRK).getReserves();
        uint256 reserveIn = uint256(reserve0);
        uint256 reserveOut = uint256(reserve1);
        uint256 inWithFee = amountIn * 997;
        amountOut = (inWithFee * reserveOut) / (reserveIn * 1000 + inWithFee);
        _push(WETH, WETH_STRK, amountIn);
        IUniswapV2Pair(WETH_STRK).swap(0, amountOut, address(this), "");
    }

    function _settleOrTake(address currency, int128 amount, address recipient) internal {
        if (amount < 0) {
            IPoolManager(POOL_MANAGER).sync(currency);
            _push(currency, POOL_MANAGER, uint256(uint128(-amount)));
            IPoolManager(POOL_MANAGER).settle();
        } else if (amount > 0) {
            IPoolManager(POOL_MANAGER).take(currency, recipient, uint256(uint128(amount)));
        }
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

    function _liq0(uint256 amount, uint160 sqrtA, uint160 sqrtB) internal pure returns (uint128) {
        uint256 intermediate = FriMath.mulDiv(sqrtA, sqrtB, Q96);
        uint256 l = FriMath.mulDiv(amount, intermediate, uint256(sqrtB) - uint256(sqrtA));
        require(l <= type(uint128).max, "liquidity");
        return uint128(l);
    }

    function _liq1(uint256 amount, uint160 sqrtA, uint160 sqrtB) internal pure returns (uint128) {
        uint256 l = FriMath.mulDiv(amount, Q96, uint256(sqrtB) - uint256(sqrtA));
        require(l <= type(uint128).max, "liquidity");
        return uint128(l);
    }

    function _balance(address erc20, address account) internal view returns (uint256 bal) {
        (bool ok, bytes memory data) = erc20.staticcall(abi.encodeWithSelector(0x70a08231, account));
        if (!ok || data.length < 32) revert TransferFailed();
        bal = abi.decode(data, (uint256));
    }

    function _pull(address erc20, address from, uint256 amount) internal {
        (bool ok, bytes memory data) = erc20.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, address(this), amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _push(address erc20, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = erc20.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}
