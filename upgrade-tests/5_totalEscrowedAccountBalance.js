const { program } = require('commander');
const { ethers } = require('ethers');
const fs = require('fs');
const { multicall, zUSD, readMulticall, rewardEscrowV2 } = require('./utils.js');

const users = JSON.parse(fs.readFileSync('./files/sources/subgraph-users.json'));
console.log("rewardescrowv2 address", rewardEscrowV2.address);

const checktotalEscrowedAccountBalanceBeforeMigration = async () => {
    const options = program.opts();
    console.log('FolderName', options.folder);

    console.log(`Reading function totalEscrowedAccountBalance using multicall from synthetix  for ${users.length}`);

    let totalEscrowedAccountBalances = [];

    try {
        await readMulticall(
            users,
            (address) => rewardEscrowV2.populateTransaction.totalEscrowedAccountBalance(address),
            // (a, r) => {},
            (address, response) => {
                const output = ethers.utils.defaultAbiCoder.decode(['uint256'], response.returnData);
                console.log(`User ${address} has ${output[0]} totalEscrowedAccountBalance`);
                totalEscrowedAccountBalances.push({
                    wallet: address,
                    totalEscrowedAccountBalances: output[0].toString(),
                })
                // if (output[0].gt(0)) {
                //     filteredAddresses.push(a);
                // }
            },
            0, // 0 = READ; 1 = WRITE;
            50, // L1 max size = ~200; L2 max size = ~150;
        );


        fs.writeFileSync(`files/${options.folder}/totalEscrowedAccountBalances.json`, JSON.stringify(totalEscrowedAccountBalances), err => {
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
    .action(checktotalEscrowedAccountBalanceBeforeMigration)

program.parse();

module.exports = {
    checktotalEscrowedAccountBalanceBeforeMigration,
}
