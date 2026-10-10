// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Buy path for tokens already launched by the live iLAND factory.
///         Not deployed. Not audited. Do not turn on public launches with this.
///
///         The pool stays one-sided against STRK. This contract does not
///         create pools and does not move the locked position.
///
///         ETH and WETH use the Uniswap v2 WETH/STRK pair, then the v4 pool.
///         USDC uses the Uniswap v2 USDC/WETH pair, then that same STRK pair.
///         STRK goes straight to the v4 pool.
///         The buyer receives the launched token. Nothing is meant to stay here.
///
///         Factory: 0x47da17908d75abCB94391312bf8467944cC06F61
///         Hook:    0xB6B2a165D17EAF9a6E751eF0B06Ed218ac92Da80

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
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
}

interface ILandFactory {
    function launchCount() external view returns (uint256);
    function launches(uint256) external view returns (address token, address creator, int24 tickLower, int24 tickUpper, uint160 sqrtPriceX96);
}

interface IPoolManager {
    function unlock(bytes calldata data) external returns (bytes memory);
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

struct SwapParams {
    bool zeroForOne;
    int256 amountSpecified;
    uint160 sqrtPriceLimitX96;
}

contract ILandRouter {
    address public constant STRK = 0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;
    address public constant WETH_STRK = 0x311ce099976D72F9e093690FD1408a14Ad4ED4DA;
    address public constant USDC_WETH = 0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc;

    uint24 public constant FEE = 0x800000;
    int24 public constant SPACING = 200;
    uint160 internal constant MIN_SQRT = 4295128740;
    uint160 internal constant MAX_SQRT = 1461446703485210103287273052203988822378723970341;
    uint160 internal constant HOOK_FLAGS = 0x1A80;

    ILandFactory public immutable factory;
    address public immutable hook;
    address public immutable owner;

    error NotAllowed();
    error Currency();
    error Amount();
    error Slippage();
    error NotLaunched();
    error NotManager();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAllowed();
        _;
    }

    constructor(address factory_, address hook_) {
        if (uint160(hook_) & 0x3FFF != HOOK_FLAGS) revert NotAllowed();
        factory = ILandFactory(factory_);
        hook = hook_;
        owner = msg.sender;
    }

    /// @param currency Address zero means ETH. Otherwise WETH, USDC, or STRK.
    ///        amountIn for ETH is msg.value. USDC uses 6 decimals. The others use 18.
    /// @param minTokenOut Minimum launched-token amount. Zero is allowed only for a
    ///        first manual test, and it can be sandwiched.
    function buy(address token, address currency, uint256 amountIn, uint256 minTokenOut) external payable returns (uint256 tokenOut) {
        if (!_launched(token)) revert NotLaunched();
        if (currency == address(0)) {
            if (msg.value != amountIn || amountIn == 0) revert Amount();
            IWETH(WETH).deposit{value: amountIn}();
            amountIn = _v2(WETH_STRK, WETH, amountIn, address(this));
            currency = STRK;
        } else {
            if (msg.value != 0 || amountIn == 0) revert Amount();
            _pull(currency, msg.sender, amountIn);
            if (currency == USDC) {
                amountIn = _v2(USDC_WETH, USDC, amountIn, address(this));
                amountIn = _v2(WETH_STRK, WETH, amountIn, address(this));
                currency = STRK;
            } else if (currency == WETH) {
                amountIn = _v2(WETH_STRK, WETH, amountIn, address(this));
                currency = STRK;
            } else if (currency != STRK) {
                revert Currency();
            }
        }

        uint256 beforeBal = _balance(token, msg.sender);
        IPoolManager(POOL_MANAGER).unlock(abi.encode(token, msg.sender, amountIn));
        tokenOut = _balance(token, msg.sender) - beforeBal;
        if (tokenOut < minTokenOut) revert Slippage();
    }

    /// @dev How much STRK the v2 hops would produce. This does not include the v4 hop.
    function previewStrk(address currency, uint256 amountIn) external view returns (uint256) {
        if (currency == address(0) || currency == WETH) return _amountOut(WETH_STRK, WETH, amountIn);
        if (currency == USDC) return _amountOut(WETH_STRK, WETH, _amountOut(USDC_WETH, USDC, amountIn));
        if (currency == STRK) return amountIn;
        revert Currency();
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != POOL_MANAGER) revert NotManager();
        (address token, address recipient, uint256 strkIn) = abi.decode(data, (address, address, uint256));
        bool tokenIs0 = token < STRK;
        PoolKey memory key = PoolKey({
            currency0: tokenIs0 ? token : STRK,
            currency1: tokenIs0 ? STRK : token,
            fee: FEE,
            tickSpacing: SPACING,
            hooks: hook
        });
        // STRK in, launched token out. Exact input is a negative amount.
        bool zeroForOne = !tokenIs0;
        int256 delta = IPoolManager(POOL_MANAGER).swap(
            key,
            SwapParams({zeroForOne: zeroForOne, amountSpecified: -int256(strkIn), sqrtPriceLimitX96: zeroForOne ? MIN_SQRT : MAX_SQRT}),
            ""
        );
        int128 amount0 = int128(delta >> 128);
        int128 amount1 = int128(int256(int128(delta)));
        _settleOrTake(key.currency0, amount0, recipient);
        _settleOrTake(key.currency1, amount1, recipient);
        return "";
    }

    /// @dev Recovers a token left here by a failed external call. This router is not a locker.
    function sweep(address token, address to) external onlyOwner {
        if (to == address(0)) revert Amount();
        uint256 amount = _balance(token, address(this));
        if (amount == 0) revert Amount();
        _push(token, to, amount);
    }

    function _settleOrTake(address currency, int128 amount, address recipient) internal {
        if (amount < 0) {
            uint256 owed = uint256(uint128(-amount));
            IPoolManager(POOL_MANAGER).sync(currency);
            _push(currency, POOL_MANAGER, owed);
            IPoolManager(POOL_MANAGER).settle();
        } else if (amount > 0) {
            IPoolManager(POOL_MANAGER).take(currency, recipient, uint256(uint128(amount)));
        }
    }

    function _v2(address pair, address tokenIn, uint256 amountIn, address to) internal returns (uint256 amountOut) {
        amountOut = _amountOut(pair, tokenIn, amountIn);
        _push(tokenIn, pair, amountIn);
        if (tokenIn == IUniswapV2Pair(pair).token0()) IUniswapV2Pair(pair).swap(0, amountOut, to, "");
        else IUniswapV2Pair(pair).swap(amountOut, 0, to, "");
    }

    function _amountOut(address pair, address tokenIn, uint256 amountIn) internal view returns (uint256) {
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(pair).getReserves();
        (uint256 reserveIn, uint256 reserveOut) =
            tokenIn == IUniswapV2Pair(pair).token0() ? (uint256(reserve0), uint256(reserve1)) : (uint256(reserve1), uint256(reserve0));
        uint256 inWithFee = amountIn * 997;
        return (inWithFee * reserveOut) / (reserveIn * 1000 + inWithFee);
    }

    function _launched(address token) internal view returns (bool) {
        uint256 count = factory.launchCount();
        for (uint256 i; i < count; ++i) {
            (address launched,,,,) = factory.launches(i);
            if (launched == token) return true;
        }
        return false;
    }

    function _balance(address token, address account) internal view returns (uint256 bal) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSelector(0x70a08231, account));
        if (!ok || data.length < 32) revert TransferFailed();
        bal = abi.decode(data, (uint256));
    }

    function _pull(address token, address from, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, address(this), amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _push(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}
