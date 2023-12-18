const { ethers } = require('ethers');
const fs = require('fs');
const { synthetix, multicall, zUSD, readMulticall } = require('./utils.js');

// const users = JSON.parse(fs.readFileSync('./files/positiveDebtBalances-users.json'));
const users = JSON.parse(fs.readFileSync('./files/sources/subgraph-users.json'));

// console.log('users', users);

const checkDebtBeforeMigration = async () => {

    console.log(`Reading function debtBalanceOf using multicall from synthetix  for ${users.length}`);

    let debtBalances = [];

    try {
        await readMulticall(
            users,
            (address) => synthetix.populateTransaction.debtBalanceOf(address, zUSD),
            // (a, r) => {},
            (address, response) => {
                const output = ethers.utils.defaultAbiCoder.decode(['uint256'], response.returnData);
                console.log(`User ${address} has ${output[0]} debtbalance`);
                debtBalances.push({
                    wallet: address,
                    debtBalance: output[0].toString(),
                })
                // if (output[0].gt(0)) {
                //     filteredAddresses.push(a);
                // }
            },
            0, // 0 = READ; 1 = WRITE;
            25, // L1 max size = ~200; L2 max size = ~150;
        );


        fs.writeFileSync('files/data/debtBalances.json', JSON.stringify(debtBalances), err => {
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

module.exports = {
    checkDebtBeforeMigration,
}

checkDebtBeforeMigration();