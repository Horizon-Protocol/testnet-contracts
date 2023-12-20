const MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
// const RPC_URL = 'http://127.0.0.1:8545/';
const RPC_URL = 'https://rpc.ankr.com/bsc/95b3d954e100484050177ec4f7cf6c4c1c68b5b5c38a08020839e63b57958feb'

const SYNTHETIX_ABI_ETHERS = [
    'function debtBalanceOf(address,bytes32) view returns (uint256)',
    'function totalEscrowedAccountBalance(address) view returns (uint256)',
    'function totalVestedAccountBalance(address) view returns (uint256)',
    'function collateral(address) external view returns (uint)',
    'function balanceOf(address) external view returns (uint)',
    'function target() external view returns (address)',

]
const MULTICALL_ABI_ETHERS =
    [
        "function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)",
        "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
        "function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
        "function blockAndAggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)",
        "function getBasefee() view returns (uint256 basefee)",
        "function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)",
        "function getBlockNumber() view returns (uint256 blockNumber)",
        "function getChainId() view returns (uint256 chainid)",
        "function getCurrentBlockCoinbase() view returns (address coinbase)",
        "function getCurrentBlockDifficulty() view returns (uint256 difficulty)",
        "function getCurrentBlockGasLimit() view returns (uint256 gaslimit)",
        "function getCurrentBlockTimestamp() view returns (uint256 timestamp)",
        "function getEthBalance(address addr) view returns (uint256 balance)",
        "function getLastBlockHash() view returns (bytes32 blockHash)",
        "function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
        "function tryBlockAndAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)",
    ]


module.exports = {
    RPC_URL,
    SYNTHETIX_ABI_ETHERS,
    MULTICALL_ADDRESS,
    MULTICALL_ABI_ETHERS,

}