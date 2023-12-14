const {ethers} = require('ethers');
const fs = require("fs");
const CSVToJSON = require('csvtojson')
const { MULTICALL_ADDRESS, RPC_URL, SYNTHETIX_ABI_ETHERS, MULTICALL_ABI_ETHERS, } = require('./constants.js');
const deployments = require('../publish/deployed/mainnet/deployment.json');

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const zUSD = ethers.utils.formatBytes32String('zUSD');

async function convertCsvToJson(inputfile, outputfile) {
    return CSVToJSON()
        .fromFile('files/' + inputfile)
        .then(users => {
            fs.writeFileSync('files/sources/' + outputfile, JSON.stringify(users, null, 4), err => {
                if (err) {
                    throw err;
                }
            });
        })
        .then(() => {
            console.log(`CSV file ${inputfile} is converted and saved to ${outputfile}`);
        })
        .catch(err => {
            // log error if any
            console.error(err);
            process.exit(0);
        });
}

const getContractFromDeployment = (contractname) => {
    return deployments.targets[contractname].address;
}

const synthetix = new ethers.Contract(getContractFromDeployment('ProxySynthetix'), SYNTHETIX_ABI_ETHERS, provider);
const rewardEscrowV2 = new ethers.Contract(getContractFromDeployment('RewardEscrowV2'), SYNTHETIX_ABI_ETHERS, provider)

const multicall = new ethers.Contract(MULTICALL_ADDRESS, MULTICALL_ABI_ETHERS, provider);

// Multicall function definition
async function readMulticall(items, call, onResult, write = 0, batch = 500) {
    const results = [];
    for (let i = 0; i < items.length; i += batch) {
        console.log('call', i, 'of', items.length);
        
        const calls = [];
        
        for (let j = i; j < Math.min(i + batch, items.length); j++) {
            // console.log('call', items[j]);
            const populatedCall = await call(items[j]);
            calls.push({
                target: populatedCall.to,
                callData: populatedCall.data,
                allowFailure: false,
            });
        }

        const values = await multicall.callStatic.aggregate3(calls);

        let succeeded = 0;

        for (let j = i; j < Math.min(i + batch, items.length); j++) {
            await onResult(items[j], values[j - i]);
            if (values[j - i].success) succeeded++;
        }

        if (write && succeeded / values.length >= write) {
            const gasUsage = await multicall.estimateGas.aggregate3(calls);
            const tx = await multicall.aggregate3(calls, {
                gasLimit: gasUsage,
            });
            console.log('submitted tx:', tx.hash);
            await tx.wait();
        }
    }

    return results;
}

module.exports = {
    convertCsvToJson,
    provider,
    synthetix,
    rewardEscrowV2,
    multicall,
    zUSD,
    getContractFromDeployment,
    readMulticall,

}