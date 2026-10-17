// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ArcLink
/// @notice Minimal, stateless USDC payment-link checkout contract.
/// @dev No owner/admin roles, fees, upgradeability hooks, or persistent storage.
///      The accepted USDC token address is pinned at construction time; any call
///      using a different token address is rejected with `WrongToken`.
///
///      Payment flow (single tx):
///        1. Customer calls `pay(merchant, amount, ref)` after approving `amount` of USDC.
///        2. ArcLink pulls `amount` USDC from msg.sender via `transferFrom`.
///        3. ArcLink immediately transfers `amount` USDC to `merchant`.
///        4. A `PaymentMade` event is emitted and the balance invariant is asserted.
///        5. The contract holds zero USDC after every successful call.
contract ArcLink {
    using SafeERC20 for IERC20;

    /// @notice The only ERC-20 token this contract will accept (set at construction, immutable).
    address public immutable USDC;

    /// @notice Emitted on every successful payment.
    /// @param merchant  The merchant receiving the funds.
    /// @param payer     The account that initiated the payment.
    /// @param amount    The USDC amount (6-decimal units) transferred.
    /// @param ref       Merchant/order reference string (off-chain use only).
    event PaymentMade(
        address indexed merchant,
        address indexed payer,
        uint256 amount,
        string  ref
    );

    error InvalidMerchant();
    error InvalidAmount();
    /// @notice Caller passed a token address that is not the pinned USDC contract.
    error WrongToken(address provided, address expected);
    error NetBalanceChanged(uint256 beforeBalance, uint256 afterBalance);

    /// @param usdc The USDC ERC-20 contract address for this chain.
    constructor(address usdc) {
        require(usdc != address(0), "ArcLink: zero USDC address");
        USDC = usdc;
    }

    /// @notice Pay a merchant in USDC.
    /// @param merchant  Recipient merchant address (must be nonzero).
    /// @param amount    USDC amount to pay (must be > 0); caller must have approved at least this.
    /// @param usdcToken Must equal the `USDC` immutable — provided as a parameter so the ABI
    ///                  stays chain-agnostic and callers can self-document which token they intend.
    ///                  Any mismatch reverts with `WrongToken`.
    /// @param ref       Off-chain reference string (e.g. invoice ID, order number). May be empty.
    function pay(
        address merchant,
        uint256 amount,
        address usdcToken,
        string calldata ref
    ) external {
        if (merchant == address(0)) revert InvalidMerchant();
        if (amount == 0) revert InvalidAmount();
        if (usdcToken != USDC) revert WrongToken(usdcToken, USDC);

        IERC20 token = IERC20(USDC);
        uint256 beforeBalance = token.balanceOf(address(this));

        token.safeTransferFrom(msg.sender, address(this), amount);
        token.safeTransfer(merchant, amount);

        uint256 afterBalance = token.balanceOf(address(this));
        if (afterBalance != beforeBalance) {
            revert NetBalanceChanged(beforeBalance, afterBalance);
        }

        emit PaymentMade(merchant, msg.sender, amount, ref);
    }
}
