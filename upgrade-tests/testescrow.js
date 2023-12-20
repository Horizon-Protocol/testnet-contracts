const { ethers } = require('ethers');
const fs = require('fs');
const { rewardEscrowV2, multicall, zUSD, getContractFromDeployment, provider } = require('./utils.js');

// const zUSD = ethers.utils.formatBytes32String('zUSD');

const first = async () => {
    const abi = [
        'function balanceOf(address) external view returns (uint)',
    ]
    // const synthetixDebtShare = new ethers.Contract(getContractFromDeployment('SynthetixDebtShare'), abi, provider);
    // const debtBalance = synthetix.address;
    // const debtBalance = await synthetix.target();
    // const debtBalance = await synthetix.debtBalanceOf('0xe51738ef83a47aeff4bb4f0b426385a81b543ef6', zUSD)
    const debtBalance = await rewardEscrowV2.totalEscrowedAccountBalance('0xf619db42dbb5ba5fd6da8bb4374d61e317c8b52b')
    // console.log("debtBlance", synthetix);
    console.log("debtBlance", debtBalance.toString());
}


first()