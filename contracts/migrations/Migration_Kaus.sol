pragma solidity ^0.5.16;

import "../BaseMigration.sol";
import "../AddressResolver.sol";
import "../SynthetixState.sol";
import "../Issuer.sol";

interface ISynthetixNamedContract {
    // solhint-disable func-name-mixedcase
    function CONTRACT_NAME() external view returns (bytes32);
}

// solhint-disable contract-name-camelcase
contract Migration_Kaus is BaseMigration {
    // https://etherscan.io/address/0xEb3107117FEAd7de89Cd14D463D340A2E6917769;
    address public constant OWNER = 0xD9e11e52D2fAF7E735613CcB54478461611Fd4b7;

    // ----------------------------
    // EXISTING SYNTHETIX CONTRACTS
    // ----------------------------

    // https://etherscan.io/address/0x823bE81bbF96BEc0e25CA13170F5AaCb5B79ba83
    AddressResolver public constant addressresolver_i = AddressResolver(0x26A1655f9164E99C5a0C7FAB6b38462dEd93d4ba);
    // https://etherscan.io/address/0x4b9Ca5607f1fF8019c1C6A3c2f0CC8de622D5B82
    SynthetixState public constant synthetixstate_i = SynthetixState(0x49408983B4215B319EEE2d172Bf7B859d47C5246);
    // https://etherscan.io/address/0xF67998902EBc37d885ad310C2430C822Ca981E1E
    Issuer public constant issuer_i = Issuer(0xe45Db3cF242061cBC04E228c496808448AA0961D);

    // ----------------------------------
    // NEW CONTRACTS DEPLOYED TO BE ADDED
    // ----------------------------------

    // https://etherscan.io/address/0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F
    address public constant new_ProxySynthetix_contract = 0xc7815D983cbE593a49c361c82918d63E14b2ecd9;
    // https://etherscan.io/address/0x08118E04F58d7863b4fCF1de0e07c83a2541b89e
    address public constant new_DebtCache_contract = 0x84054f3B56F9A63B1F2c6EA28BF3dF30fF7B2c16;
    // https://etherscan.io/address/0xF67998902EBc37d885ad310C2430C822Ca981E1E
    address public constant new_Issuer_contract = 0xe45Db3cF242061cBC04E228c496808448AA0961D;
    // https://etherscan.io/address/0x57Ab1ec28D129707052df4dF418D58a2D46d5f51
    address public constant new_ProxyzUSD_contract = 0x794c4d26705fc36CfF3187978F7649c37859a8aE;

    constructor() public BaseMigration(OWNER) {}

    function contractsRequiringOwnership() public pure returns (address[] memory contracts) {
        contracts = new address[](3);
        contracts[0] = address(addressresolver_i);
        contracts[1] = address(synthetixstate_i);
        contracts[2] = address(issuer_i);
    }

    function migrate(address currentOwner) external onlyDeployer {
        require(owner == currentOwner, "Only the assigned owner can be re-assigned when complete");

        require(
            ISynthetixNamedContract(new_DebtCache_contract).CONTRACT_NAME() == "DebtCache",
            "Invalid contract supplied for DebtCache"
        );
        require(
            ISynthetixNamedContract(new_Issuer_contract).CONTRACT_NAME() == "Issuer",
            "Invalid contract supplied for Issuer"
        );

        // ACCEPT OWNERSHIP for all contracts that require ownership to make changes
        acceptAll();

        // MIGRATION
        // Import all new contracts into the address resolver;
        addressresolver_importAddresses_0();
        // Rebuild the resolver caches in all MixinResolver contracts - batch 1;
        addressresolver_rebuildCaches_1();
        // Rebuild the resolver caches in all MixinResolver contracts - batch 2;
        addressresolver_rebuildCaches_2();
        // Ensure that Synthetix can write to its State contract;
        synthetixstate_i.setAssociatedContract(new_Issuer_contract);
        // Add synths to the Issuer contract - batch 1;
        issuer_addSynths_6();

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

    function addressresolver_importAddresses_0() internal {
        bytes32[] memory addressresolver_importAddresses_names_0_0 = new bytes32[](4);
        addressresolver_importAddresses_names_0_0[0] = bytes32("ProxySynthetix");
        addressresolver_importAddresses_names_0_0[1] = bytes32("DebtCache");
        addressresolver_importAddresses_names_0_0[2] = bytes32("Issuer");
        addressresolver_importAddresses_names_0_0[3] = bytes32("ProxyzUSD");
        address[] memory addressresolver_importAddresses_destinations_0_1 = new address[](4);
        addressresolver_importAddresses_destinations_0_1[0] = address(new_ProxySynthetix_contract);
        addressresolver_importAddresses_destinations_0_1[1] = address(new_DebtCache_contract);
        addressresolver_importAddresses_destinations_0_1[2] = address(new_Issuer_contract);
        addressresolver_importAddresses_destinations_0_1[3] = address(new_ProxyzUSD_contract);
        addressresolver_i.importAddresses(
            addressresolver_importAddresses_names_0_0,
            addressresolver_importAddresses_destinations_0_1
        );
    }

    function addressresolver_rebuildCaches_1() internal {
        MixinResolver[] memory addressresolver_rebuildCaches_destinations_1_0 = new MixinResolver[](20);
        addressresolver_rebuildCaches_destinations_1_0[0] = MixinResolver(0x7E18Bbda74C4cF00A57f95eEA4203888C8E8F2D4);
        addressresolver_rebuildCaches_destinations_1_0[1] = MixinResolver(new_Issuer_contract);
        addressresolver_rebuildCaches_destinations_1_0[2] = MixinResolver(0x6D410Ca59489701819c8745C8be7a657DdA7d8Bb);      // RewardEscrowV2
        addressresolver_rebuildCaches_destinations_1_0[3] = MixinResolver(0x09BeC511d1eAFE5Dd05D652fE86b91AE42D3FdF1);
        addressresolver_rebuildCaches_destinations_1_0[4] = MixinResolver(0x2e35582F7Fa9De58f7c2C307Aec11c53Df4a4Ef4);
        addressresolver_rebuildCaches_destinations_1_0[5] = MixinResolver(0x6bd710296A3E3d128d12e3E3b5B8A300B4d22dAB);
        addressresolver_rebuildCaches_destinations_1_0[6] = MixinResolver(new_DebtCache_contract);
        // addressresolver_rebuildCaches_destinations_1_0[7] = MixinResolver(0xCd9D4988C0AE61887B075bA77f08cbFAd2b65068);   SynthetixBridgetoOOptimism
        addressresolver_rebuildCaches_destinations_1_0[7] = MixinResolver(0x2E745EA43699d0e8adE169eE3cE0A869E8123E32);
        addressresolver_rebuildCaches_destinations_1_0[8] = MixinResolver(0x95A5ae405CD1e7ACdB91785073E1127D83233Ae0);

        addressresolver_rebuildCaches_destinations_1_0[9] = MixinResolver(0xb5D8E63254BA768c44DAe0e54aC160077189549A);
        addressresolver_rebuildCaches_destinations_1_0[10] = MixinResolver(0x643a1877e0F362a3f6F895Dbc507ee9e488B21F6);
        addressresolver_rebuildCaches_destinations_1_0[11] = MixinResolver(0xF9250237c73FCeE33F2Eac58Cfc387c86F3e8357);
        addressresolver_rebuildCaches_destinations_1_0[12] = MixinResolver(0x70977D377b9de73c6892f18c0823c82989b6F340);
        addressresolver_rebuildCaches_destinations_1_0[13] = MixinResolver(0x5CDb926cB4bd1a7939352f3B56c182b255CBF21B);
        addressresolver_rebuildCaches_destinations_1_0[14] = MixinResolver(0xc4242537Da4c066267907C237D28431D79C065eD);
        addressresolver_rebuildCaches_destinations_1_0[15] = MixinResolver(0xB381B73989e1a99Fe80702b5696518F14413D8c3);

        addressresolver_i.rebuildCaches(addressresolver_rebuildCaches_destinations_1_0);
    }

    function addressresolver_rebuildCaches_2() internal {
        MixinResolver[] memory addressresolver_rebuildCaches_destinations_2_0 = new MixinResolver[](5);
        addressresolver_rebuildCaches_destinations_2_0[0] = MixinResolver(0x879d165002F8b8C2332df0aa6A967bDbA02377E1);
        addressresolver_rebuildCaches_destinations_2_0[1] = MixinResolver(0x2B28415dE6B615cF01877084f482Ff544d21c569);
        addressresolver_rebuildCaches_destinations_2_0[2] = MixinResolver(0x54b5770fA53D8017bfF6f360034469D1bA61D1D3);
        addressresolver_rebuildCaches_destinations_2_0[3] = MixinResolver(0xFC454901FB1068d79f6323E7f3E60526DA859eb3);
        addressresolver_rebuildCaches_destinations_2_0[4] = MixinResolver(0x5708ACfE8325c635D7aa1Dfe920d656a6cBB83C0);
        addressresolver_i.rebuildCaches(addressresolver_rebuildCaches_destinations_2_0);
    }

    function issuer_addSynths_6() internal {
        ISynth[] memory issuer_addSynths_synthsToAdd_6_0 = new ISynth[](11);
        issuer_addSynths_synthsToAdd_6_0[0] = ISynth(0x95A5ae405CD1e7ACdB91785073E1127D83233Ae0);
        issuer_addSynths_synthsToAdd_6_0[1] = ISynth(0xb5D8E63254BA768c44DAe0e54aC160077189549A);
        issuer_addSynths_synthsToAdd_6_0[2] = ISynth(0x643a1877e0F362a3f6F895Dbc507ee9e488B21F6);
        issuer_addSynths_synthsToAdd_6_0[3] = ISynth(0xF9250237c73FCeE33F2Eac58Cfc387c86F3e8357);
        issuer_addSynths_synthsToAdd_6_0[4] = ISynth(0x70977D377b9de73c6892f18c0823c82989b6F340);
        issuer_addSynths_synthsToAdd_6_0[5] = ISynth(0x5CDb926cB4bd1a7939352f3B56c182b255CBF21B);
        issuer_addSynths_synthsToAdd_6_0[6] = ISynth(0xc4242537Da4c066267907C237D28431D79C065eD);
        issuer_addSynths_synthsToAdd_6_0[7] = ISynth(0xB381B73989e1a99Fe80702b5696518F14413D8c3);
        issuer_addSynths_synthsToAdd_6_0[8] = ISynth(0x879d165002F8b8C2332df0aa6A967bDbA02377E1);
        issuer_addSynths_synthsToAdd_6_0[9] = ISynth(0x2B28415dE6B615cF01877084f482Ff544d21c569);
        issuer_addSynths_synthsToAdd_6_0[10] = ISynth(0x54b5770fA53D8017bfF6f360034469D1bA61D1D3);
        issuer_i.addSynths(issuer_addSynths_synthsToAdd_6_0);
    }
}
