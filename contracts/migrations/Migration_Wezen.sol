
pragma solidity ^0.5.16;

import "../BaseMigration.sol";
import "../AddressResolver.sol";
import "../Proxy.sol";
import "../FeePoolEternalStorage.sol";
import "../FeePoolState.sol";
import "../RewardEscrow.sol";
import "../FeePool.sol";

interface ISynthetixNamedContract {
    // solhint-disable func-name-mixedcase
    function CONTRACT_NAME() external view returns (bytes32);
}

// solhint-disable contract-name-camelcase
contract Migration_Wezen is BaseMigration {
    // https://testnet.bscscan.com/address/0xD9e11e52D2fAF7E735613CcB54478461611Fd4b7;
    address public constant OWNER = 0xD9e11e52D2fAF7E735613CcB54478461611Fd4b7;

    // ----------------------------
    // EXISTING HORIZON CONTRACTS
    // ----------------------------

    // https://testnet.bscscan.com/address/0x26A1655f9164E99C5a0C7FAB6b38462dEd93d4ba
    AddressResolver public constant addressresolver_i = AddressResolver(0x26A1655f9164E99C5a0C7FAB6b38462dEd93d4ba);
    // https://testnet.bscscan.com/address/0xDa8eddeeD46f32aF7a4c82602D24F561E6F31cDA
    Proxy public constant proxyfeepool_i = Proxy(0xDa8eddeeD46f32aF7a4c82602D24F561E6F31cDA);
    // https://testnet.bscscan.com/address/0x3FA0b2Cfb293eb61F42146e0C699F767B103998C
    FeePoolEternalStorage public constant feepooleternalstorage_i = FeePoolEternalStorage(0x3FA0b2Cfb293eb61F42146e0C699F767B103998C);
    // https://testnet.bscscan.com/address/0x046F8e3D1AF5B67659164Fd6beD688580d936FCE
    FeePoolState public constant feepoolstate_i = FeePoolState(0x046F8e3D1AF5B67659164Fd6beD688580d936FCE);
    // https://testnet.bscscan.com/address/0xE4c2B8FDBD8D829FAce1C0B2FA0CE6F0d3B6279E
    RewardEscrow public constant rewardescrow_i = RewardEscrow(0xE4c2B8FDBD8D829FAce1C0B2FA0CE6F0d3B6279E);
    // https://testnet.bscscan.com/address/0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996
    FeePool public constant feepool_i = FeePool(0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996);

    // ----------------------------------
    // NEW CONTRACTS DEPLOYED TO BE ADDED
    // ----------------------------------

    // https://testnet.bscscan.com/address/0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996
        address public constant new_FeePool_contract = 0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996;

    constructor() public BaseMigration(OWNER) {}

    function contractsRequiringOwnership() public pure returns (address[] memory contracts) {
        contracts = new address[](6);
        contracts[0]= address(addressresolver_i);
        contracts[1]= address(proxyfeepool_i);
        contracts[2]= address(feepooleternalstorage_i);
        contracts[3]= address(feepoolstate_i);
        contracts[4]= address(rewardescrow_i);
        contracts[5]= address(feepool_i);
    }

    function migrate(address currentOwner) external onlyDeployer {
        require(owner == currentOwner, "Only the assigned owner can be re-assigned when complete");

        require(ISynthetixNamedContract(new_FeePool_contract).CONTRACT_NAME() == "FeePool", "Invalid contract supplied for FeePool");

        // ACCEPT OWNERSHIP for all contracts that require ownership to make changes
        acceptAll();

        // MIGRATION
        // Import all new contracts into the address resolver;
        addressresolver_importAddresses_0();
        // Rebuild the resolver caches in all MixinResolver contracts - batch 1;
        addressresolver_rebuildCaches_1();
        // Ensure the ProxyFeePool contract has the correct FeePool target set;
        proxyfeepool_i.setTarget(Proxyable(new_FeePool_contract));
        // Ensure the FeePool contract can write to its EternalStorage;
        feepooleternalstorage_i.setAssociatedContract(new_FeePool_contract);
        // Ensure the FeePool contract can write to its State;
        feepoolstate_i.setFeePool(IFeePool(new_FeePool_contract));
        // Ensure the legacy RewardEscrow contract is connected to the FeePool contract;
        rewardescrow_i.setFeePool(IFeePool(new_FeePool_contract));
        // Import fee period from existing fee pool at index 0;
        importFeePeriod_0();
        // Import fee period from existing fee pool at index 1;
        importFeePeriod_1();

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
        bytes32[] memory addressresolver_importAddresses_names_0_0 = new bytes32[](1);
        addressresolver_importAddresses_names_0_0[0] = bytes32("FeePool");
        address[] memory addressresolver_importAddresses_destinations_0_1 = new address[](1);
        addressresolver_importAddresses_destinations_0_1[0] = address(new_FeePool_contract);
        addressresolver_i.importAddresses(addressresolver_importAddresses_names_0_0, addressresolver_importAddresses_destinations_0_1);
    }

    
    function addressresolver_rebuildCaches_1() internal {
        MixinResolver[] memory addressresolver_rebuildCaches_destinations_1_0 = new MixinResolver[](20);
        addressresolver_rebuildCaches_destinations_1_0[0] = MixinResolver(0x6D410Ca59489701819c8745C8be7a657DdA7d8Bb);
        addressresolver_rebuildCaches_destinations_1_0[1] = MixinResolver(0x7E18Bbda74C4cF00A57f95eEA4203888C8E8F2D4);
        addressresolver_rebuildCaches_destinations_1_0[2] = MixinResolver(0x1f530FF0D6C6eab2D7fA9Abe5ca8937404367EeC);
        addressresolver_rebuildCaches_destinations_1_0[3] = MixinResolver(0x5Bb00d61Ff6CbaB3e64CA5e44DE7f484E8de6406);
        addressresolver_rebuildCaches_destinations_1_0[4] = MixinResolver(0x84441540DbE2ed6F777532562B146545a4C463f6);
        addressresolver_rebuildCaches_destinations_1_0[5] = MixinResolver(0xBCa3b068fAf56dfD223095e953f9ec2421BCCA0D);
        addressresolver_rebuildCaches_destinations_1_0[6] = MixinResolver(0x643a1877e0F362a3f6F895Dbc507ee9e488B21F6);
        addressresolver_rebuildCaches_destinations_1_0[7] = MixinResolver(0xe7aa9D240bC1c54990C2BfEBE5e4bC4F13463AA0);
        addressresolver_rebuildCaches_destinations_1_0[8] = MixinResolver(0x1be0A2243E8c26d3B037acC45eC7D45B66e8d732);
        addressresolver_rebuildCaches_destinations_1_0[9] = MixinResolver(0x5CDb926cB4bd1a7939352f3B56c182b255CBF21B);
        addressresolver_rebuildCaches_destinations_1_0[10] = MixinResolver(0xc4242537Da4c066267907C237D28431D79C065eD);
        addressresolver_rebuildCaches_destinations_1_0[11] = MixinResolver(0xB381B73989e1a99Fe80702b5696518F14413D8c3);
        addressresolver_rebuildCaches_destinations_1_0[12] = MixinResolver(0x879d165002F8b8C2332df0aa6A967bDbA02377E1);
        addressresolver_rebuildCaches_destinations_1_0[13] = MixinResolver(0x2B28415dE6B615cF01877084f482Ff544d21c569);
        addressresolver_rebuildCaches_destinations_1_0[14] = MixinResolver(0x54b5770fA53D8017bfF6f360034469D1bA61D1D3);
        addressresolver_rebuildCaches_destinations_1_0[15] = MixinResolver(0xFC454901FB1068d79f6323E7f3E60526DA859eb3);
        addressresolver_rebuildCaches_destinations_1_0[16] = MixinResolver(0x9EDfA1De9B4c3a686503B01479C12384C30c8021);
        addressresolver_rebuildCaches_destinations_1_0[17] = MixinResolver(0x52F75C79B8b9E89373aCf0A417feB274EB9b3a80);
        addressresolver_rebuildCaches_destinations_1_0[18] = MixinResolver(0x6c9b0B2914c89f9Ea254425B90D93db3Dc549C34);
        addressresolver_rebuildCaches_destinations_1_0[19] = MixinResolver(new_FeePool_contract);
        addressresolver_i.rebuildCaches(addressresolver_rebuildCaches_destinations_1_0);
    }

    
    function importFeePeriod_0() internal {
        // https://testnet.bscscan.com/address/0x00fd481d059039D6314065C341cbA82bCd88b5f2;
        FeePool existingFeePool = FeePool(0x00fd481d059039D6314065C341cbA82bCd88b5f2);
        // https://testnet.bscscan.com/address/0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996;
        FeePool newFeePool = FeePool(0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996);
        (
                        uint64 feePeriodId_0,
                        uint64 startingDebtIndex_0,
                        uint64 startTime_0,
                        uint feesToDistribute_0,
                        uint feesClaimed_0,
                        uint rewardsToDistribute_0,
                        uint rewardsClaimed_0
                    ) = existingFeePool.recentFeePeriods(0);
        newFeePool.importFeePeriod(
                        0,
                        feePeriodId_0,
                        startingDebtIndex_0,
                        startTime_0,
                        feesToDistribute_0,
                        feesClaimed_0,
                        rewardsToDistribute_0,
                        rewardsClaimed_0
                    );
    }

    
    function importFeePeriod_1() internal {
        // https://testnet.bscscan.com/address/0x00fd481d059039D6314065C341cbA82bCd88b5f2;
        FeePool existingFeePool = FeePool(0x00fd481d059039D6314065C341cbA82bCd88b5f2);
        // https://testnet.bscscan.com/address/0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996;
        FeePool newFeePool = FeePool(0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996);
        (
                        uint64 feePeriodId_1,
                        uint64 startingDebtIndex_1,
                        uint64 startTime_1,
                        uint feesToDistribute_1,
                        uint feesClaimed_1,
                        uint rewardsToDistribute_1,
                        uint rewardsClaimed_1
                    ) = existingFeePool.recentFeePeriods(1);
        newFeePool.importFeePeriod(
                        1,
                        feePeriodId_1,
                        startingDebtIndex_1,
                        startTime_1,
                        feesToDistribute_1,
                        feesClaimed_1,
                        rewardsToDistribute_1,
                        rewardsClaimed_1
                    );
    }
}
