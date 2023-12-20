const { program } = require('commander');
const { ethers } = require('ethers');
const fs = require('fs');
const { multicall, zUSD, readMulticall, rewardEscrowV2 } = require('./utils.js');

const users = JSON.parse(fs.readFileSync('./files/sources/subgraph-users.json'));
console.log("rewardescrowv2 address", rewardEscrowV2.address);

const checktotalVestedAccountBalanceBeforeMigration = async () => {
    const options = program.opts();
    console.log('FolderName', options.folder);

    console.log(`Reading function totalVestedAccountBalance using multicall from synthetix  for ${users.length}`);

    let totalVestedAccountBalances = [];

    try {
        await readMulticall(
            users,
            (address) => rewardEscrowV2.populateTransaction.totalVestedAccountBalance(address),
            // (a, r) => {},
            (address, response) => {
                const output = ethers.utils.defaultAbiCoder.decode(['uint256'], response.returnData);
                console.log(`User ${address} has ${output[0]} totalVestedAccountBalance`);
                totalVestedAccountBalances.push({
                    wallet: address,
                    totalVestedAccountBalance: output[0].toString(),
                })
                // if (output[0].gt(0)) {
                //     filteredAddresses.push(a);
                // }
            },
            0, // 0 = READ; 1 = WRITE;
            50, // L1 max size = ~200; L2 max size = ~150;
        );


        fs.writeFileSync(`files/${options.folder}/totalVestedAccountBalances.json`, JSON.stringify(totalVestedAccountBalances), err => {
            if (err) {
                throw err;
            }
        })

        return true;

    } catch (error) {
        console.error(error);
        process.exit(0);
    }
}

program
    .requiredOption('-f, --folder <value>', 'Folder to save the output')
    .action(checktotalVestedAccountBalanceBeforeMigration)

program.parse();

module.exports = {
    checktotalVestedAccountBalanceBeforeMigration
}