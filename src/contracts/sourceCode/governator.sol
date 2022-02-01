pragma solidity ^0.5.17;

import "contracts/gFry.sol";
import "contracts/safeMath.sol";

contract Governator
{
    using SafeMath for uint;

    IERC20 public FRY;
    gFRY public gFry;

    constructor(IERC20 _FRY) 
        public 
    {
        gFry = new gFRY();
        FRY = _FRY;
    }

    function governate(uint _amount) 
        public 
    {
        FRY.transferFrom(msg.sender, address(this), _amount);
        gFry.mint(msg.sender, safe96(_amount, "Governator: uint96 overflows"));
    }

    function degovernate(uint _amount)
        public
    {
        uint share = _amount.mul(10**18).div(gFry.totalSupply());

        uint fryToReturn = FRY.balanceOf(address(this))
            .mul(share)
            .div(10**18);

        gFry.transferFrom(msg.sender, address(this), _amount);

        gFry.burn(safe96(_amount, "Governator: uint96 overflows"));

        FRY.transfer(msg.sender, fryToReturn);
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


