pragma solidity ^0.5.17;

import "contracts/gLevr.sol";
import "contracts/safeMath.sol";

contract Governator
{
    using SafeMath for uint;

    IERC20 public LEVR;
    gLEVR public gLevr;

    constructor(IERC20 _LEVR) 
        public 
    {
        gLevr = new gLEVR();
        LEVR = _LEVR;
    }

    function governate(uint _amount) 
        public 
    {
        LEVR.transferFrom(msg.sender, address(this), _amount);
        gLevr.mint(msg.sender, safe96(_amount, "Governator: uint96 overflows"));
    }

    function degovernate(uint _amount)
        public
    {
        uint share = _amount.mul(10**18).div(gLevr.totalSupply());

        uint levrToReturn = LEVR.balanceOf(address(this))
            .mul(share)
            .div(10**18);

        gLevr.transferFrom(msg.sender, address(this), _amount);

        gLevr.burn(safe96(_amount, "Governator: uint96 overflows"));

        LEVR.transfer(msg.sender, levrToReturn);
    }

    function safe96(uint n, string memory errorMessage) internal pure returns (uint96) {
        require(n < 2**96, errorMessage);
        return uint96(n);
    }
}

interface IERC20 {
   
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}


