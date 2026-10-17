// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {ArcLink} from "../ArcLink.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Minimal ERC-20 token for testing.
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract ArcLinkTest is Test {
    ArcLink   internal arcLink;
    MockUSDC  internal usdc;
    MockUSDC  internal otherToken; // a different ERC-20 (not the pinned USDC)

    address internal payer    = address(0x1111);
    address internal merchant = address(0x2222);
    address internal stranger = address(0x3333);

    uint256 internal constant AMOUNT = 10e6; // 10 USDC (6 decimals)

    function setUp() public {
        usdc       = new MockUSDC();
        otherToken = new MockUSDC(); // separate contract address
        arcLink    = new ArcLink(address(usdc));

        // Fund the payer with some USDC
        usdc.mint(payer, 100e6);

        // Payer approves ArcLink for max USDC
        vm.prank(payer);
        usdc.approve(address(arcLink), type(uint256).max);
    }

    // -------------------------------------------------------------------------
    // Happy path: successful payment
    // -------------------------------------------------------------------------

    function test_SuccessfulPayment() public {
        uint256 payerBefore    = usdc.balanceOf(payer);
        uint256 merchantBefore = usdc.balanceOf(merchant);
        uint256 contractBefore = usdc.balanceOf(address(arcLink));

        vm.prank(payer);
        vm.expectEmit(true, true, false, true);
        emit ArcLink.PaymentMade(merchant, payer, AMOUNT, "ORDER-001");
        arcLink.pay(merchant, AMOUNT, address(usdc), "ORDER-001");

        assertEq(usdc.balanceOf(payer),           payerBefore - AMOUNT,    "Payer balance decreased");
        assertEq(usdc.balanceOf(merchant),         merchantBefore + AMOUNT, "Merchant received exact amount");
        assertEq(usdc.balanceOf(address(arcLink)), contractBefore,          "Contract holds no funds");
    }

    /// @dev Merchant must receive the EXACT amount — no fee, no rounding.
    function test_MerchantReceivesExactAmount() public {
        uint256 merchantBefore = usdc.balanceOf(merchant);

        vm.prank(payer);
        arcLink.pay(merchant, AMOUNT, address(usdc), "exact");

        assertEq(usdc.balanceOf(merchant) - merchantBefore, AMOUNT, "Exact amount forwarded");
    }

    /// @dev ArcLink must be stateless — contract holds zero after payment.
    function test_ContractHoldsNoFunds() public {
        vm.prank(payer);
        arcLink.pay(merchant, AMOUNT, address(usdc), "stateless");

        assertEq(usdc.balanceOf(address(arcLink)), 0, "Contract must hold zero");
    }

    /// @dev An empty ref string is valid.
    function test_EmptyRefIsValid() public {
        vm.prank(payer);
        arcLink.pay(merchant, AMOUNT, address(usdc), "");

        assertEq(usdc.balanceOf(merchant), AMOUNT);
    }

    /// @dev The pinned USDC address is exposed as an immutable.
    function test_PinnedUSDCAddress() public view {
        assertEq(arcLink.USDC(), address(usdc), "USDC immutable must match constructor arg");
    }

    // -------------------------------------------------------------------------
    // Fuzz: merchant always receives exactly what payer sends
    // -------------------------------------------------------------------------

    function testFuzz_ExactForward(uint96 rawAmount) public {
        uint256 amount = uint256(rawAmount) + 1; // ensure amount > 0
        usdc.mint(payer, amount);

        vm.prank(payer);
        usdc.approve(address(arcLink), amount);

        uint256 merchantBefore = usdc.balanceOf(merchant);

        vm.prank(payer);
        arcLink.pay(merchant, amount, address(usdc), "fuzz");

        assertEq(usdc.balanceOf(merchant) - merchantBefore, amount, "Fuzz: exact forward");
        assertEq(usdc.balanceOf(address(arcLink)), 0, "Fuzz: contract empty");
    }

    // -------------------------------------------------------------------------
    // Invalid address / amount
    // -------------------------------------------------------------------------

    function test_RevertZeroMerchant() public {
        vm.prank(payer);
        vm.expectRevert(ArcLink.InvalidMerchant.selector);
        arcLink.pay(address(0), AMOUNT, address(usdc), "bad-merchant");
    }

    function test_RevertZeroAmount() public {
        vm.prank(payer);
        vm.expectRevert(ArcLink.InvalidAmount.selector);
        arcLink.pay(merchant, 0, address(usdc), "bad-amount");
    }

    /// @dev Passing a token address that is NOT the pinned USDC must revert with WrongToken.
    function test_RevertWrongToken() public {
        // otherToken is a valid ERC-20 but not the one ArcLink was constructed with
        vm.prank(payer);
        vm.expectRevert(
            abi.encodeWithSelector(ArcLink.WrongToken.selector, address(otherToken), address(usdc))
        );
        arcLink.pay(merchant, AMOUNT, address(otherToken), "wrong-token");
    }

    /// @dev Passing address(0) as the token must also revert with WrongToken (not InvalidToken).
    function test_RevertZeroTokenAddress() public {
        vm.prank(payer);
        vm.expectRevert(
            abi.encodeWithSelector(ArcLink.WrongToken.selector, address(0), address(usdc))
        );
        arcLink.pay(merchant, AMOUNT, address(0), "zero-token");
    }

    // -------------------------------------------------------------------------
    // Insufficient balance
    // -------------------------------------------------------------------------

    function test_RevertInsufficientBalance() public {
        // Stranger has no USDC; approve max so the revert is purely about balance
        vm.startPrank(stranger);
        usdc.approve(address(arcLink), type(uint256).max);
        vm.expectRevert(); // ERC-20 transfer revert
        arcLink.pay(merchant, AMOUNT, address(usdc), "broke");
        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // Insufficient allowance
    // -------------------------------------------------------------------------

    function test_RevertInsufficientAllowance() public {
        address tightPayer = address(0x4444);
        usdc.mint(tightPayer, 100e6);

        // Approve only 1 USDC but try to pay 10 USDC
        vm.startPrank(tightPayer);
        usdc.approve(address(arcLink), 1e6);
        vm.expectRevert(); // ERC-20 transferFrom revert
        arcLink.pay(merchant, AMOUNT, address(usdc), "no-allowance");
        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // Multiple payments in the same block
    // -------------------------------------------------------------------------

    function test_MultiplePayments() public {
        address merchantB = address(0x5555);
        uint256 amountB   = 5e6;

        uint256 mBefore  = usdc.balanceOf(merchant);
        uint256 mbBefore = usdc.balanceOf(merchantB);

        vm.startPrank(payer);
        arcLink.pay(merchant,  AMOUNT,  address(usdc), "pay-1");
        arcLink.pay(merchantB, amountB, address(usdc), "pay-2");
        vm.stopPrank();

        assertEq(usdc.balanceOf(merchant)  - mBefore,  AMOUNT,  "Merchant A received");
        assertEq(usdc.balanceOf(merchantB) - mbBefore, amountB, "Merchant B received");
        assertEq(usdc.balanceOf(address(arcLink)), 0, "Contract still empty");
    }

    // -------------------------------------------------------------------------
    // Constructor: zero USDC address must revert
    // -------------------------------------------------------------------------

    function test_RevertConstructorZeroUSDC() public {
        vm.expectRevert("ArcLink: zero USDC address");
        new ArcLink(address(0));
    }
}
