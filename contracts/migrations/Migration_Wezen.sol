
pragma solidity ^0.5.16;

import "../BaseMigration.sol";


interface ISynthetixNamedContract {
    // solhint-disable func-name-mixedcase
    function CONTRACT_NAME() external view returns (bytes32);
}

// solhint-disable contract-name-camelcase
contract Migration_Wezen is BaseMigration {
    // https://testnet.bscscan.com/address/0x73570075092502472E4b61A7058Df1A4a1DB12f2;
    address public constant OWNER = 0x73570075092502472E4b61A7058Df1A4a1DB12f2;

    // ----------------------------
    // EXISTING HORIZON CONTRACTS
    // ----------------------------

    

    // ----------------------------------
    // NEW CONTRACTS DEPLOYED TO BE ADDED
    // ----------------------------------

    

    constructor() public BaseMigration(OWNER) {}

    function contractsRequiringOwnership() public pure returns (address[] memory contracts) {
        contracts = new address[](0);
        
    }

    function migrate(address currentOwner) external onlyDeployer {
        require(owner == currentOwner, "Only the assigned owner can be re-assigned when complete");

        

        // ACCEPT OWNERSHIP for all contracts that require ownership to make changes
        acceptAll();

        // MIGRATION
        

        // NOMINATE OWNERSHIP back to owner for aforementioned contracts
        nominateAll();
    }

    function acceptAll() internal {
        address[] memory contracts = contractsRequiringOwnership();
        for (uint i = 0; i < contracts.length; i++) {
            Owned(contracts[i]).acceptOwnership();
        }
    }

    function nominateAll() internal {
        address[] memory contracts = contractsRequiringOwnership();
        for (uint i = 0; i < contracts.length; i++) {
            returnOwnership(contracts[i]);
        }
    }

    
}
