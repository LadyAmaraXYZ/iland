// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Send ETH to this address. The contract buys STRK, then the launched token.
///         Not a factory. The pool still has to exist. Public launches stay closed.
///
///         A plain transfer works. There is no buy form and no Value mismatch.
///         WETH uses buyWeth, and that needs an approval.
///         Until the owner sets a minimum, only the owner can pay. That stops a
///         sandwich on the first test.

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

contract ILandEthBuyer {
    address public constant STRK = 0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;
    address public constant WETH_STRK = 0x311ce099976D72F9e093690FD1408a14Ad4ED4DA;

    uint24 public constant FEE = 0x800000;
    int24 public constant SPACING = 200;
    uint160 internal constant MIN_SQRT = 4295128740;
    uint160 internal constant MAX_SQRT = 1461446703485210103287273052203988822378723970341;
    uint160 internal constant HOOK_FLAGS = 0x1A80;

    ILandFactory public immutable factory;
    address public immutable hook;
    address public immutable token;
    address public immutable owner;
    /// @dev Whole tokens required per 1 ETH. Zero means only the owner can buy.
    uint256 public minTokensPerEth;
    uint256 private locked;

    error NotAllowed();
    error Amount();
    error Slippage();
    error NotLaunched();
    error NotManager();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAllowed();
        _;
    }

    constructor(address factory_, address hook_, address token_) {
        if (uint160(hook_) & 0x3FFF != HOOK_FLAGS) revert NotAllowed();
        if (token_ == address(0) || token_ == STRK) revert NotAllowed();
        factory = ILandFactory(factory_);
        hook = hook_;
        token = token_;
        owner = msg.sender;
    }

    /// @dev Wallet send. msg.value is the ETH. Tokens go to the sender.
    receive() external payable {
        if (msg.value == 0) revert Amount();
        _buy(msg.sender, msg.value, true);
    }

    /// @dev WETH already approved to this contract. Do not send ETH with this call.
    function buyWeth(uint256 amount) external {
        if (amount == 0) revert Amount();
        _pull(WETH, msg.sender, amount);
        _buy(msg.sender, amount, false);
    }

    function setMinTokensPerEth(uint256 minTokens) external onlyOwner {
        minTokensPerEth = minTokens;
    }

    function sweep(address stuck, address to) external onlyOwner {
        if (to == address(0)) revert Amount();
        uint256 amount = _balance(stuck, address(this));
        if (amount == 0) revert Amount();
        _push(stuck, to, amount);
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != POOL_MANAGER) revert NotManager();
        (address recipient, uint256 strkIn) = abi.decode(data, (address, uint256));
        bool tokenIs0 = token < STRK;
        PoolKey memory key = PoolKey({
            currency0: tokenIs0 ? token : STRK,
            currency1: tokenIs0 ? STRK : token,
            fee: FEE,
            tickSpacing: SPACING,
            hooks: hook
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
        if (!_launched(token)) revert NotLaunched();
        uint256 floor = minTokensPerEth;
        if (floor == 0 && recipient != owner) revert NotAllowed();
        uint256 strkIn = amount;
        if (fromEth) {
            IWETH(WETH).deposit{value: amount}();
            strkIn = _v2(WETH, amount);
        } else {
            strkIn = _v2(WETH, amount);
        }
        uint256 beforeBal = _balance(token, recipient);
        IPoolManager(POOL_MANAGER).unlock(abi.encode(recipient, strkIn));
        uint256 tokenOut = _balance(token, recipient) - beforeBal;
        if (floor != 0 && tokenOut < floor * amount / 1 ether) revert Slippage();
        locked = 0;
    }

    function _v2(address tokenIn, uint256 amountIn) internal returns (uint256 amountOut) {
        amountOut = _amountOut(tokenIn, amountIn);
        _push(tokenIn, WETH_STRK, amountIn);
        if (tokenIn == IUniswapV2Pair(WETH_STRK).token0()) IUniswapV2Pair(WETH_STRK).swap(0, amountOut, address(this), "");
        else IUniswapV2Pair(WETH_STRK).swap(amountOut, 0, address(this), "");
    }

    function _amountOut(address tokenIn, uint256 amountIn) internal view returns (uint256) {
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(WETH_STRK).getReserves();
        (uint256 reserveIn, uint256 reserveOut) =
            tokenIn == IUniswapV2Pair(WETH_STRK).token0() ? (uint256(reserve0), uint256(reserve1)) : (uint256(reserve1), uint256(reserve0));
        uint256 inWithFee = amountIn * 997;
        return (inWithFee * reserveOut) / (reserveIn * 1000 + inWithFee);
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

    function _launched(address candidate) internal view returns (bool) {
        uint256 count = factory.launchCount();
        for (uint256 i; i < count; ++i) {
            (address launched,,,,) = factory.launches(i);
            if (launched == candidate) return true;
        }
        return false;
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
