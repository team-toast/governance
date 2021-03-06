pragma solidity ^0.5.17;

import "contracts/timelock.sol";
import "contracts/forwarder.sol";
import "contracts/gLevr.sol";
import "contracts/governator.sol";


contract GovernanceDeployer {
    Timelock public timelock;
    Forwarder public forwarder;
    Governator public governator;
    gLEVR public gLevr;
    address owner;

	event Deployed(address _timelockAddress, address _forwarderAddress, address _governatorAddress, address _gLevrAddress);
    
    constructor() 
        public 
    {
        owner = msg.sender;
        IERC20 _LEVR = IERC20(0x633A3d2091dc7982597A0f635d23Ba5EB1223f48);

        timelock = new Timelock(address(this), 0);
        forwarder = new Forwarder(address(timelock));
        governator = new Governator(_LEVR);
        gLevr = governator.gLevr();
        
		emit Deployed(address(timelock), address(forwarder), address(governator), address(gLevr));    
     }

    function initializeGovernace(address _govAlpha) 
        public
    {
        require(msg.sender == owner, "Only owner can initialize governance");
        
        bytes memory adminPayload = abi.encodeWithSignature("setPendingAdmin(address)", _govAlpha);
        
        uint256 eta = block.timestamp + timelock.delay(); 
        timelock.queueTransaction(address(timelock), 0, "", adminPayload, eta);
        
        bytes memory delayPayload = abi.encodeWithSignature("setDelay(uint256)", 2 days);
        
        timelock.queueTransaction(address(timelock), 0, "", delayPayload, eta);
        
        timelock.executeTransaction(address(timelock), 0, "", adminPayload, eta);
        timelock.executeTransaction(address(timelock), 0, "", delayPayload, eta);
    }
}

