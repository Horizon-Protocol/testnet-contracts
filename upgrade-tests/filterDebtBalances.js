const fs = require('fs');

let unFilteredAddresses = JSON.parse(fs.readFileSync('./files/backup/debtBalances.json'));

let filteredAddresses = [];

unFilteredAddresses.map(element => {
    if (element.debtBalance != '0') filteredAddresses.push(element.wallet);    
});

fs.writeFileSync('files/positiveDebtBalances-users.json', JSON.stringify(filteredAddresses), err => {
    if (err) {
        throw err;
    }
})



console.log('filteredAddresses', filteredAddresses, 'completed');