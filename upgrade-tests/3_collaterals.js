const { program } = require('commander');
const { ethers } = require('ethers');
const fs = require('fs');
const { synthetix, multicall, zUSD, readMulticall } = require('./utils.js');

const users = JSON.parse(fs.readFileSync('./files/sources/subgraph-users.json'));

const checkCollateralBeforeMigration = async () => {
    const options = program.opts();
    console.log('FolderName', options.folder);

    console.log(`Reading function collateral using multicall from synthetix  for ${users.length}`);

    let collaterals = [];


    try {
        await readMulticall(
            users,
            (address) => synthetix.populateTransaction.collateral(address),
            // (a, r) => {},
            (address, response) => {
                const output = ethers.utils.defaultAbiCoder.decode(['uint256'], response.returnData);
                console.log(`User ${address} has ${output[0]} collateral`);
                collaterals.push({
                    wallet: address,
                    collateral: output[0].toString(),
                })
                // if (output[0].gt(0)) {
                //     filteredAddresses.push(a);
                // }
            },
            0, // 0 = READ; 1 = WRITE;
            50, // L1 max size = ~200; L2 max size = ~150;
        );


        fs.writeFileSync(`files/${options.folder}/collaterals.json`, JSON.stringify(collaterals), err => {
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
    .action(checkCollateralBeforeMigration)

program.parse();

module.exports = {
    checkCollateralBeforeMigration,
}