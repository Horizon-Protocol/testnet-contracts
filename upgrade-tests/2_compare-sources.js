const fs = require('fs');
const { ethers } = require('ethers');
const { synthetix, multicall, zUSD, readMulticall } = require('./utils.js');

let bscscan = JSON.parse(fs.readFileSync('./files/bscscan-users.json'));
let bitquery = JSON.parse(fs.readFileSync('./files/bitquery-users.json'));
let covalent = JSON.parse(fs.readFileSync('./files/covalent-users.json'));
let subgraph = JSON.parse(fs.readFileSync('./files/subgraph-users.json'));

const compare = async (array1, array2, name1, name2) => {
    // console.log(`Comparing ${name1} and ${name2}`);
    array1 = array1.filter(val => !array2.includes(val));
    console.log(`${name1} found ${array1.length} non duplicates with ${name2}`);
    fs.writeFileSync(`./files/compare/${name1}-${name2}.json`, JSON.stringify(array1), err => {
        if (err) {
            throw err;
        }
    })
}

const readHznBalancesForEachApi = async (name1, name2) => {
    const users = JSON.parse(fs.readFileSync(`./files/compare/${name1}-${name2}.json`));

    console.log(`Reading function HZN BalanceOf using multicall from synthetix for file ${name1}-${name2}}`);

    let balances = [];

    try {
        if (users.length) {
            await readMulticall(
                users,
                (address) => synthetix.populateTransaction.balanceOf(address),
                // (a, r) => {},
                (address, response) => {
                    const output = ethers.utils.defaultAbiCoder.decode(['uint256'], response.returnData);
                    console.log(`User ${address} has ${output[0]} balanceOf`);
                    balances.push({
                        wallet: address,
                        balance: output[0].toString(),
                    })
                    // if (output[0].gt(0)) {
                    //     filteredAddresses.push(a);
                    // }
                },
                0, // 0 = READ; 1 = WRITE;
                50, // L1 max size = ~200; L2 max size = ~150;
            );
        }


        fs.writeFileSync(`files/compare/${name1}-${name2}-balances.json`, JSON.stringify(balances), err => {
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

const readCollateralForEachApi = async (name1, name2) => {
    const users = JSON.parse(fs.readFileSync(`./files/compare/${name1}-${name2}.json`));

    console.log(`Reading function HZN BalanceOf using multicall from synthetix for file ${name1}-${name2}}`);

    let collaterals = [];

    try {
        if (users.length) {
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
        }


        fs.writeFileSync(`files/compare/${name1}-${name2}-collaterals.json`, JSON.stringify(collaterals), err => {
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

const compareAll = async () => {
    await compare(bscscan, subgraph, 'bscscan', 'subgraph');
    await compare(subgraph, bscscan, 'subgraph', 'bscscan');
    await readHznBalancesForEachApi('bscscan', 'subgraph');
    await readHznBalancesForEachApi('subgraph', 'bscscan');
    await readCollateralForEachApi('bscscan', 'subgraph');
    await readCollateralForEachApi('subgraph', 'bscscan');

    await compare(bscscan, bitquery, 'bscscan', 'bitquery');
    await compare(bitquery, bscscan, 'bitquery', 'bscscan');
    await readHznBalancesForEachApi('bscscan', 'bitquery');
    await readHznBalancesForEachApi('bitquery', 'bscscan');
    await readCollateralForEachApi('bscscan', 'bitquery');
    await readCollateralForEachApi('bitquery', 'bscscan');

    await compare(bscscan, covalent, 'bscscan', 'covalent');
    await compare(covalent, bscscan, 'covalent', 'bscscan');
    await readHznBalancesForEachApi('bscscan', 'covalent');
    await readHznBalancesForEachApi('covalent', 'bscscan');
    await readCollateralForEachApi('bscscan', 'covalent');
    await readCollateralForEachApi('covalent', 'bscscan');

    await compare(subgraph, bitquery, 'subgraph', 'bitquery');
    await compare(bitquery, subgraph, 'bitquery', 'subgraph');
    await readHznBalancesForEachApi('subgraph', 'bitquery');
    await readHznBalancesForEachApi('bitquery', 'subgraph');
    await readCollateralForEachApi('subgraph', 'bitquery');
    await readCollateralForEachApi('bitquery', 'subgraph');

    await compare(subgraph, covalent, 'subgraph', 'covalent');
    await compare(covalent, subgraph, 'covalent', 'subgraph');
    await readHznBalancesForEachApi('subgraph', 'covalent');
    await readHznBalancesForEachApi('covalent', 'subgraph');
    await readCollateralForEachApi('subgraph', 'covalent');
    await readCollateralForEachApi('covalent', 'subgraph');
}

compareAll();