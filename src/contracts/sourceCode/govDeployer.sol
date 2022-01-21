pragma solidity ^0.5.17;

import "contracts/timelock.sol";
import "contracts/forwarder.sol";
import "contracts/gFry.sol";
import "contracts/governator.sol";


contract GovernanceDeployer {
    Timelock public timelock;
    Forwarder public forwarder;
    Governator public governator;
    gFRY public gFry;

	event Deployed(address _timelockAddress, address _forwarderAddress, address _governatorAddress, address _gFryAddress);
    
    constructor() 
        public 
    {
        IERC20 _FRY = IERC20(0x633a3d2091dc7982597a0f635d23ba5eb1223f48);

        timelock = new Timelock(address(this), 0);
        forwarder = new Forwarder(address(timelock));
        governator = new Governator(_FRY);
        gFry = governator.gFry();
        
		emit Deployed(address(timelock), address(forwarder), address(governator), address(gFry));    
     }

    function initializeGovernace(address _govAlpha) 
        public
    {
        bytes memory adminPayload = abi.encodeWithSignature("setPendingAdmin(address)", _govAlpha);
        
        uint256 eta = block.timestamp + timelock.delay(); 
        timelock.queueTransaction(address(timelock), 0, "", adminPayload, eta);
        
        bytes memory delayPayload = abi.encodeWithSignature("setDelay(uint256)", 2);
        
        timelock.queueTransaction(address(timelock), 0, "", delayPayload, eta);
        
        timelock.executeTransaction(address(timelock), 0, "", adminPayload, eta);
        timelock.executeTransaction(address(timelock), 0, "", delayPayload, eta);
    }
}

