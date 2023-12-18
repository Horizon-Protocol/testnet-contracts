const fs = require('fs');
const { ethers } = require('ethers');
const _ = require('lodash');
const { synthetix, multicall, zUSD, readMulticall } = require('./utils.js');

let backup_collaterals = JSON.parse(fs.readFileSync('./files/backup/collaterals.json'));
let backup_debtBalances = JSON.parse(fs.readFileSync('./files/backup/debtBalances.json'));
let backup_totalEscrowedAccountBalances = JSON.parse(fs.readFileSync('./files/backup/totalEscrowedAccountBalances.json'));
let backup_totalVestedAccountBalances = JSON.parse(fs.readFileSync('./files/backup/totalVestedAccountBalances.json'));

let data_collaterals = JSON.parse(fs.readFileSync('./files/data/collaterals.json'));
let data_debtBalances = JSON.parse(fs.readFileSync('./files/data/debtBalances.json'));
let data_totalEscrowedAccountBalances = JSON.parse(fs.readFileSync('./files/data/totalEscrowedAccountBalances.json'));
let data_totalVestedAccountBalances = JSON.parse(fs.readFileSync('./files/data/totalVestedAccountBalances.json'));

const compare = (array1, array2, name1, name2) => {
    // // console.log(array1 == array2);
    // const arr1 = [{ id: 1, name: 'Tom' }];
    // const arr2 = [
    //     { id: 1, name: 'Tom' },
    //     { id: 2, name: 'bobby hadz' },
    // ];
    return array1.filter(
        object1 => !array2.some(
            object2 => object1.wallet === object2.wallet
        ),
    );

    // fs.writeFileSync(`./files/compare/${name1}-${name2}.json`, JSON.stringify(array1), err => {
    //     if (err) {
    //         throw err;
    //     }
    // })
}

const compareAll = async () => {
    // const difference_collaterals = [
    //     ...compare(backup_collaterals, data_collaterals),
    //     ...compare(data_collaterals, backup_collaterals)
    // ];
    // console.log('difference_collaterals', difference_collaterals);

    const difference_debtBalances = [
        ...compare(backup_debtBalances, data_debtBalances),
        ...compare(data_debtBalances, backup_debtBalances)
    ];
    console.log('difference_debtBalances', difference_debtBalances);

    // const difference_totalEscrowedAccountBalances = [
    //     ...compare(backup_totalEscrowedAccountBalances, data_totalEscrowedAccountBalances),
    //     ...compare(data_totalEscrowedAccountBalances, backup_totalEscrowedAccountBalances)
    // ];
    // console.log('difference_totalEscrowedAccountBalances', difference_totalEscrowedAccountBalances);

    // const difference_totalVestedAccountBalances = [
    //     ...compare(backup_totalVestedAccountBalances, data_totalVestedAccountBalances),
    //     ...compare(data_totalVestedAccountBalances, backup_totalVestedAccountBalances)
    // ];
    // console.log('difference_totalVestedAccountBalances', difference_totalVestedAccountBalances);

}

compareAll();