pragma solidity ^0.5.16;

import "../BaseMigration.sol";
import "../AddressResolver.sol";
import "../Proxy.sol";
import "../FeePoolEternalStorage.sol";
import "../FeePoolState.sol";
import "../ProxyERC20.sol";
import "../Proxy.sol";
import "../legacy/LegacyTokenState.sol";
import "../SynthetixState.sol";
import "../RewardEscrow.sol";
import "../RewardsDistribution.sol";
import "../FeePool.sol";
import "../Issuer.sol";

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
    FeePoolEternalStorage public constant feepooleternalstorage_i =
        FeePoolEternalStorage(0x3FA0b2Cfb293eb61F42146e0C699F767B103998C);
    // https://testnet.bscscan.com/address/0x046F8e3D1AF5B67659164Fd6beD688580d936FCE
    FeePoolState public constant feepoolstate_i = FeePoolState(0x046F8e3D1AF5B67659164Fd6beD688580d936FCE);
    // https://testnet.bscscan.com/address/0x426F971981353f71414aa0ED1D72073d00308Ad4
    ProxyERC20 public constant proxyerc20_i = ProxyERC20(0x426F971981353f71414aa0ED1D72073d00308Ad4);
    // https://testnet.bscscan.com/address/0xc7815D983cbE593a49c361c82918d63E14b2ecd9
    Proxy public constant proxysynthetix_i = Proxy(0xc7815D983cbE593a49c361c82918d63E14b2ecd9);
    // https://testnet.bscscan.com/address/0x50F667B964e9574C7112bE68eD3B189ef05f764f
    LegacyTokenState public constant tokenstatesynthetix_i = LegacyTokenState(0x50F667B964e9574C7112bE68eD3B189ef05f764f);
    // https://testnet.bscscan.com/address/0x49408983B4215B319EEE2d172Bf7B859d47C5246
    SynthetixState public constant synthetixstate_i = SynthetixState(0x49408983B4215B319EEE2d172Bf7B859d47C5246);
    // https://testnet.bscscan.com/address/0xE4c2B8FDBD8D829FAce1C0B2FA0CE6F0d3B6279E
    RewardEscrow public constant rewardescrow_i = RewardEscrow(0xE4c2B8FDBD8D829FAce1C0B2FA0CE6F0d3B6279E);
    // https://testnet.bscscan.com/address/0x07664B910D67bA543Aa3aC1E3e166E1FC444eEfD
    RewardsDistribution public constant rewardsdistribution_i =
        RewardsDistribution(0x07664B910D67bA543Aa3aC1E3e166E1FC444eEfD);
    // https://testnet.bscscan.com/address/0x55355412494C9e85bEeA35E2c2267D07912da914
    FeePool public constant feepool_i = FeePool(0x55355412494C9e85bEeA35E2c2267D07912da914);
    // https://testnet.bscscan.com/address/0x56180f1e6a75b37BA90622cf7a03139a4E3e22FD
    Issuer public constant issuer_i = Issuer(0x56180f1e6a75b37BA90622cf7a03139a4E3e22FD);

    // ----------------------------------
    // NEW CONTRACTS DEPLOYED TO BE ADDED
    // ----------------------------------

    // https://testnet.bscscan.com/address/0x354621394B2ba379E5Ac1d95101e0D6992dB71a8
    address public constant new_SynthetixDebtShare_contract = 0x354621394B2ba379E5Ac1d95101e0D6992dB71a8;
    // https://testnet.bscscan.com/address/0x55355412494C9e85bEeA35E2c2267D07912da914
    address public constant new_FeePool_contract = 0x55355412494C9e85bEeA35E2c2267D07912da914;
    // https://testnet.bscscan.com/address/0x07f09bDBAe0f8C99Fbe639D3721F7784b24F050a
    address public constant new_Synthetix_contract = 0x07f09bDBAe0f8C99Fbe639D3721F7784b24F050a;
    // https://testnet.bscscan.com/address/0x56180f1e6a75b37BA90622cf7a03139a4E3e22FD
    address public constant new_Issuer_contract = 0x56180f1e6a75b37BA90622cf7a03139a4E3e22FD;

    constructor() public BaseMigration(OWNER) {}

    function contractsRequiringOwnership() public pure returns (address[] memory contracts) {
        contracts = new address[](12);
        contracts[0] = address(addressresolver_i);
        contracts[1] = address(proxyfeepool_i);
        contracts[2] = address(feepooleternalstorage_i);
        contracts[3] = address(feepoolstate_i);
        contracts[4] = address(proxyerc20_i);
        contracts[5] = address(proxysynthetix_i);
        contracts[6] = address(tokenstatesynthetix_i);
        contracts[7] = address(synthetixstate_i);
        contracts[8] = address(rewardescrow_i);
        contracts[9] = address(rewardsdistribution_i);
        contracts[10] = address(feepool_i);
        contracts[11] = address(issuer_i);
    }

    function migrate() external onlyOwner {
        require(
            ISynthetixNamedContract(new_SynthetixDebtShare_contract).CONTRACT_NAME() == "SynthetixDebtShare",
            "Invalid contract supplied for SynthetixDebtShare"
        );
        require(
            ISynthetixNamedContract(new_FeePool_contract).CONTRACT_NAME() == "FeePool",
            "Invalid contract supplied for FeePool"
        );
        require(
            ISynthetixNamedContract(new_Synthetix_contract).CONTRACT_NAME() == "Synthetix",
            "Invalid contract supplied for Synthetix"
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
        // Ensure the ProxyFeePool contract has the correct FeePool target set;
        proxyfeepool_i.setTarget(Proxyable(new_FeePool_contract));
        // Ensure the FeePool contract can write to its EternalStorage;
        feepooleternalstorage_i.setAssociatedContract(new_FeePool_contract);
        // Ensure the FeePool contract can write to its State;
        feepoolstate_i.setFeePool(IFeePool(new_FeePool_contract));
        // Ensure the SNX proxy has the correct Synthetix target set;
        proxyerc20_i.setTarget(Proxyable(new_Synthetix_contract));
        // Ensure the SNX proxy has the correct Synthetix target set;
        proxysynthetix_i.setTarget(Proxyable(new_Synthetix_contract));
        // Ensure the Synthetix contract can write to its TokenState contract;
        tokenstatesynthetix_i.setAssociatedContract(new_Synthetix_contract);
        // Ensure that Synthetix can write to its State contract;
        synthetixstate_i.setAssociatedContract(new_Issuer_contract);
        // Ensure the legacy RewardEscrow contract is connected to the Synthetix contract;
        rewardescrow_i.setSynthetix(ISynthetix(new_Synthetix_contract));
        // Ensure the legacy RewardEscrow contract is connected to the FeePool contract;
        rewardescrow_i.setFeePool(IFeePool(new_FeePool_contract));
        // Ensure the RewardsDistribution has Synthetix set as its authority for distribution;
        rewardsdistribution_i.setAuthority(new_Synthetix_contract);
        // Import fee period from existing fee pool at index 0;
        importFeePeriod_0();
        // Import fee period from existing fee pool at index 1;
        importFeePeriod_1();
        // Add synths to the Issuer contract - batch 1;
        issuer_addSynths_20();

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
        addressresolver_importAddresses_names_0_0[0] = bytes32("SynthetixDebtShare");
        addressresolver_importAddresses_names_0_0[1] = bytes32("FeePool");
        addressresolver_importAddresses_names_0_0[2] = bytes32("Synthetix");
        addressresolver_importAddresses_names_0_0[3] = bytes32("Issuer");
        address[] memory addressresolver_importAddresses_destinations_0_1 = new address[](4);
        addressresolver_importAddresses_destinations_0_1[0] = address(new_SynthetixDebtShare_contract);
        addressresolver_importAddresses_destinations_0_1[1] = address(new_FeePool_contract);
        addressresolver_importAddresses_destinations_0_1[2] = address(new_Synthetix_contract);
        addressresolver_importAddresses_destinations_0_1[3] = address(new_Issuer_contract);
        addressresolver_i.importAddresses(
            addressresolver_importAddresses_names_0_0,
            addressresolver_importAddresses_destinations_0_1
        );
    }

    function addressresolver_rebuildCaches_1() internal {
        MixinResolver[] memory addressresolver_rebuildCaches_destinations_1_0 = new MixinResolver[](20);
        addressresolver_rebuildCaches_destinations_1_0[0] = MixinResolver(new_FeePool_contract);
        addressresolver_rebuildCaches_destinations_1_0[1] = MixinResolver(new_Issuer_contract);
        addressresolver_rebuildCaches_destinations_1_0[2] = MixinResolver(new_SynthetixDebtShare_contract);
        addressresolver_rebuildCaches_destinations_1_0[3] = MixinResolver(0x6D410Ca59489701819c8745C8be7a657DdA7d8Bb);
        addressresolver_rebuildCaches_destinations_1_0[4] = MixinResolver(0x5Cb64df83a4C9C101a9d56c412E1854f7F4ED662);
        addressresolver_rebuildCaches_destinations_1_0[5] = MixinResolver(0x5Bb00d61Ff6CbaB3e64CA5e44DE7f484E8de6406);
        addressresolver_rebuildCaches_destinations_1_0[6] = MixinResolver(0x84441540DbE2ed6F777532562B146545a4C463f6);
        addressresolver_rebuildCaches_destinations_1_0[7] = MixinResolver(0xBCa3b068fAf56dfD223095e953f9ec2421BCCA0D);
        addressresolver_rebuildCaches_destinations_1_0[8] = MixinResolver(0x643a1877e0F362a3f6F895Dbc507ee9e488B21F6);
        addressresolver_rebuildCaches_destinations_1_0[9] = MixinResolver(0xe7aa9D240bC1c54990C2BfEBE5e4bC4F13463AA0);
        addressresolver_rebuildCaches_destinations_1_0[10] = MixinResolver(0x1be0A2243E8c26d3B037acC45eC7D45B66e8d732);
        addressresolver_rebuildCaches_destinations_1_0[11] = MixinResolver(0x5CDb926cB4bd1a7939352f3B56c182b255CBF21B);
        addressresolver_rebuildCaches_destinations_1_0[12] = MixinResolver(0xc4242537Da4c066267907C237D28431D79C065eD);
        addressresolver_rebuildCaches_destinations_1_0[13] = MixinResolver(0xB381B73989e1a99Fe80702b5696518F14413D8c3);
        addressresolver_rebuildCaches_destinations_1_0[14] = MixinResolver(0x879d165002F8b8C2332df0aa6A967bDbA02377E1);
        addressresolver_rebuildCaches_destinations_1_0[15] = MixinResolver(0x2B28415dE6B615cF01877084f482Ff544d21c569);
        addressresolver_rebuildCaches_destinations_1_0[16] = MixinResolver(0x54b5770fA53D8017bfF6f360034469D1bA61D1D3);
        addressresolver_rebuildCaches_destinations_1_0[17] = MixinResolver(0xFC454901FB1068d79f6323E7f3E60526DA859eb3);
        addressresolver_rebuildCaches_destinations_1_0[18] = MixinResolver(0x9EDfA1De9B4c3a686503B01479C12384C30c8021);
        addressresolver_rebuildCaches_destinations_1_0[19] = MixinResolver(0x52F75C79B8b9E89373aCf0A417feB274EB9b3a80);
        addressresolver_i.rebuildCaches(addressresolver_rebuildCaches_destinations_1_0);
    }

    function addressresolver_rebuildCaches_2() internal {
        MixinResolver[] memory addressresolver_rebuildCaches_destinations_2_0 = new MixinResolver[](9);
        addressresolver_rebuildCaches_destinations_2_0[0] = MixinResolver(0x6c9b0B2914c89f9Ea254425B90D93db3Dc549C34);
        addressresolver_rebuildCaches_destinations_2_0[1] = MixinResolver(0x09BeC511d1eAFE5Dd05D652fE86b91AE42D3FdF1);
        addressresolver_rebuildCaches_destinations_2_0[2] = MixinResolver(0x5C894b248a89865429aa907785A564beaaD6a871);
        addressresolver_rebuildCaches_destinations_2_0[3] = MixinResolver(0x6e61Ef19f0e74cBfe21ae848d1367BF445732f59);
        addressresolver_rebuildCaches_destinations_2_0[4] = MixinResolver(0x823eabCaEdAcbB5F0e18A32e20760C5c4e42daae);
        addressresolver_rebuildCaches_destinations_2_0[5] = MixinResolver(new_Synthetix_contract);
        addressresolver_rebuildCaches_destinations_2_0[6] = MixinResolver(0x413E56E9971E3999dd01F137797708E68B53ADA0);
        addressresolver_rebuildCaches_destinations_2_0[7] = MixinResolver(0x2E745EA43699d0e8adE169eE3cE0A869E8123E32);
        addressresolver_rebuildCaches_destinations_2_0[8] = MixinResolver(0x5708ACfE8325c635D7aa1Dfe920d656a6cBB83C0);
        addressresolver_i.rebuildCaches(addressresolver_rebuildCaches_destinations_2_0);
    }

    function importFeePeriod_0() internal {
        // https://testnet.bscscan.com/address/0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996;
        FeePool existingFeePool = FeePool(0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996);
        // https://testnet.bscscan.com/address/0x55355412494C9e85bEeA35E2c2267D07912da914;
        FeePool newFeePool = FeePool(0x55355412494C9e85bEeA35E2c2267D07912da914);
        (
            uint64 feePeriodId_0,
            uint64 unused_0,
            uint64 startTime_0,
            uint feesToDistribute_0,
            uint feesClaimed_0,
            uint rewardsToDistribute_0,
            uint rewardsClaimed_0
        ) = existingFeePool.recentFeePeriods(0);
        newFeePool.importFeePeriod(
            0,
            feePeriodId_0,
            startTime_0,
            feesToDistribute_0,
            feesClaimed_0,
            rewardsToDistribute_0,
            rewardsClaimed_0
        );
    }

    function importFeePeriod_1() internal {
        // https://testnet.bscscan.com/address/0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996;
        FeePool existingFeePool = FeePool(0xD5c622d78Ea2F1E1473eE7faD78FdAe4d2CbE996);
        // https://testnet.bscscan.com/address/0x55355412494C9e85bEeA35E2c2267D07912da914;
        FeePool newFeePool = FeePool(0x55355412494C9e85bEeA35E2c2267D07912da914);
        (
            uint64 feePeriodId_1,
            uint64 unused_1,
            uint64 startTime_1,
            uint feesToDistribute_1,
            uint feesClaimed_1,
            uint rewardsToDistribute_1,
            uint rewardsClaimed_1
        ) = existingFeePool.recentFeePeriods(1);
        newFeePool.importFeePeriod(
            1,
            feePeriodId_1,
            startTime_1,
            feesToDistribute_1,
            feesClaimed_1,
            rewardsToDistribute_1,
            rewardsClaimed_1
        );
    }

    function issuer_addSynths_20() internal {
        ISynth[] memory issuer_addSynths_synthsToAdd_20_0 = new ISynth[](11);
        issuer_addSynths_synthsToAdd_20_0[0] = ISynth(0x84441540DbE2ed6F777532562B146545a4C463f6);
        issuer_addSynths_synthsToAdd_20_0[1] = ISynth(0xBCa3b068fAf56dfD223095e953f9ec2421BCCA0D);
        issuer_addSynths_synthsToAdd_20_0[2] = ISynth(0x643a1877e0F362a3f6F895Dbc507ee9e488B21F6);
        issuer_addSynths_synthsToAdd_20_0[3] = ISynth(0xe7aa9D240bC1c54990C2BfEBE5e4bC4F13463AA0);
        issuer_addSynths_synthsToAdd_20_0[4] = ISynth(0x1be0A2243E8c26d3B037acC45eC7D45B66e8d732);
        issuer_addSynths_synthsToAdd_20_0[5] = ISynth(0x5CDb926cB4bd1a7939352f3B56c182b255CBF21B);
        issuer_addSynths_synthsToAdd_20_0[6] = ISynth(0xc4242537Da4c066267907C237D28431D79C065eD);
        issuer_addSynths_synthsToAdd_20_0[7] = ISynth(0xB381B73989e1a99Fe80702b5696518F14413D8c3);
        issuer_addSynths_synthsToAdd_20_0[8] = ISynth(0x879d165002F8b8C2332df0aa6A967bDbA02377E1);
        issuer_addSynths_synthsToAdd_20_0[9] = ISynth(0x2B28415dE6B615cF01877084f482Ff544d21c569);
        issuer_addSynths_synthsToAdd_20_0[10] = ISynth(0x54b5770fA53D8017bfF6f360034469D1bA61D1D3);
        issuer_i.addSynths(issuer_addSynths_synthsToAdd_20_0);
    }
}
