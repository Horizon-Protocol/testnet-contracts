const { program } = require('commander');
const { ethers } = require('ethers');
const fs = require('fs');
const { synthetix, readMulticall, getContractFromDeployment, provider } = require('./utils.js');

// const users = JSON.parse(fs.readFileSync('./files/positiveDebtBalances-users.json'));
const users = JSON.parse(fs.readFileSync('./files/sources/subgraph-users.json'));

// console.log('users', users);

const checkDebtBeforeMigration = async () => {
    const options = program.opts();
    console.log('FolderName', options.folder);

    console.log(`Reading function balanceOf using multicall from SynthetixDebtShare  for ${users.length}`);

    const abi = [
        'function balanceOf(address) external view returns (uint)',
    ]
    const synthetixDebtShare = new ethers.Contract(getContractFromDeployment('SynthetixDebtShare'), abi, provider);
    

    let debtBalances = [];
    let filteredAddresses = [];

    try {
        await readMulticall(
            users,
            (address) => synthetixDebtShare.populateTransaction.balanceOf(address),
            // (a, r) => {},
            (address, response) => {
                const output = ethers.utils.defaultAbiCoder.decode(['uint256'], response.returnData);
                console.log(`User ${address} has ${output[0]} debt share balance`);
                debtBalances.push({
                    wallet: address,
                    debtBalance: output[0].toString(),
                })
                if (output[0].gt(0)) {
                    filteredAddresses.push(address);
                }
            },
            0, // 0 = READ; 1 = WRITE;
            40, // L1 max size = ~200; L2 max size = ~150;
        );


        fs.writeFileSync(`files/${options.folder}/debtShareBalances.json`, JSON.stringify(debtBalances), err => {
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
    .action(checkDebtBeforeMigration)

program.parse();

module.exports = {
    checkDebtBeforeMigration,
}