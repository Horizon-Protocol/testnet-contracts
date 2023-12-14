const fs = require('fs');
const chainName = 'bsc-mainnet';
const tokenAddress = '0xC0eFf7749b125444953ef89682201Fb8c6A917CD';
const API_KEY = 'cqt_rQGqpFHFhmPQJGBH9rybQRVtbby3';



// use-fetch await style
const callCovalent = async (page) => {
  const url = `https://api.covalenthq.com/v1/${chainName}/tokens/${tokenAddress}/token_holders_v2/?page-size=1000&page-number=${page}`;

  const results = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  const { data } = await results.json();
  console.log('data', data.items);
  return data.items;
}

const covalent = async () => {
  let covalentHolders = [];
  let users = [];

  // We know the number of holders so we're running the loop 9 times for 9k users. 
  for (let index = 0; index <= 9; index++) {
    let data = await callCovalent(index);
    data.map(element => {
      covalentHolders.push({
        HolderAddress: element.address,
        Balance: element.balance
      });
      users.push(element.address);
    })
  }

  fs.writeFileSync('files/sources/covalent-horizon-holders.json', JSON.stringify(covalentHolders), err => {
    if (err) {
      throw err;
    }
  })

  fs.writeFileSync('files/sources/covalent-users.json', JSON.stringify(users), err => {
    if (err) {
      throw err;
    }
  })
}

module.exports = {
  covalent,
}