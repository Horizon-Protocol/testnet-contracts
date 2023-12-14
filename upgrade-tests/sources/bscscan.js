const fs = require('fs');

const { convertCsvToJson, getContractFromDeployment } = require('../utils');

const bscscan = async () => {
    try {
        // 1. Convert csv to json
        return convertCsvToJson('export-tokenholders-for-contract-0xC0eFf7749b125444953ef89682201Fb8c6A917CD.csv', 'bscscan-horizon-holders.json')
            .then(async () => {
                console.log(`Step 1 Complete - BSCSCAN CSV file is converted and saved to BSCSCAN JSON file`);
                const bscscanJsonFile = fs.readFileSync('files/sources/bscscan-horizon-holders.json');
                // const bscscanJsonFile = fs.readFileSync('../');
                // console.log("bscscanJsonFile", JSON.parse(bscscanJsonFile));

                // // 2. Prepare CSV for scripts
                let data = '';
                let users = [];

                JSON.parse(bscscanJsonFile).map(holder => {
                    data = data.concat(holder.HolderAddress + ',\n');
                    users.push(holder.HolderAddress.toLowerCase());
                })

                fs.writeFileSync('files/sources/snx-addrs.csv', data, err => {
                    if (err) {
                        throw err;
                    }
                })
                fs.writeFileSync('files/sources/bscscan-users.json', JSON.stringify(users), err => {
                    if (err) {
                        throw err;
                    }
                })

                console.log(`Step 2 Complete - HZN holders saved into csv file, Can use this file for running the migrate-debt-shares script`);
                // return;
            })
            // .then(() => {})

    } catch (error) {
        console.error(error);
        process.exit(0);
    }
}

module.exports = {
    bscscan,
}