const { program } = require('commander');
const { ethers } = require('ethers');
const fs = require('fs');
const { readMulticall, getContractFromDeployment, provider } = require('./utils.js');

const users = JSON.parse(fs.readFileSync('./files/positiveDebtBalances-users.json'));
// console.log('users', users);

const liquidatorEntries = async () => {
    const options = program.opts();
    console.log('FolderName', options.folder);

    console.log(`Reading function initiated using multicall from LiquidatorRewards  for ${users.length}`);

    const abi = [
        'function initiated(address) external view returns (bool)',
    ]
    const LiquidatorRewards = new ethers.Contract(getContractFromDeployment('LiquidatorRewards'), abi, provider);
    

    let liquidatorEntries = [];
    let filteredAddresses = [];

    try {
        await readMulticall(
            users,
            (address) => LiquidatorRewards.populateTransaction.initiated(address),
            // (a, r) => {},
            (address, response) => {
                const output = ethers.utils.defaultAbiCoder.decode(['bool'], response.returnData);
                console.log(`User ${address} has ${output[0]} debt share balance`);
                liquidatorEntries.push({
                    wallet: address,
                    initiated: output[0].toString(),
                })
                // if (output[0] == 'false') {
                //     filteredAddresses.push(address);
                // }
            },
            0, // 0 = READ; 1 = WRITE;
            50, // L1 max size = ~200; L2 max size = ~150;
        );


        fs.writeFileSync(`files/${options.folder}/liquidatorEntries.json`, JSON.stringify(liquidatorEntries), err => {
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
    .action(liquidatorEntries)

program.parse();

module.exports = {
    liquidatorEntries,
}
