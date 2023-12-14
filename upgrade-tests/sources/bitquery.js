const fs = require('fs');

const subgraph_url = "https://streaming.bitquery.io/graphql";
// https://graphql.bitquery.io/graphql";

const bitquery = async () => {
    try {
        // console.log(skip);

        let results = await fetch(subgraph_url, {
            method: 'POST',

            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": "BQYDXRZjcPapCxGQ71GvRBzp4LddeAWH",
            },

            body: JSON.stringify({
                query: `
                {
                    EVM(dataset: archive, network: bsc) {
                      TokenHolders(
                        date: "2023-12-14"
                        tokenSmartContract: "0xC0eFf7749b125444953ef89682201Fb8c6A917CD"
                        where: {Balance: {Amount: {gt: "0"}}}
                      ) {
                        Holder {
                          Address
                        }
                        Balance {
                          Amount
                        }
                      }
                    }
                }              
                `
            })
        })
        let { data } = await results.json();
        // console.log(data, data.snxholders.length);
        console.log(data.EVM.TokenHolders);
        
        const bitqueryUsers = [];

        fs.writeFileSync('files/sources/bitquery-horizon-holders.json', JSON.stringify(data.EVM.TokenHolders.map(element => {
            bitqueryUsers.push(element.Holder.Address.toLowerCase());
            return {
                HolderAddress: element.Holder.Address.toLowerCase(),
                Balance: element.Balance.Amount
                // Balance: ethers.utils.formatEther(element.Balance.Amount.toString())
            }
        })), err => {
            if (err) {
                throw err;
            }
        })

        fs.writeFileSync('files/sources/bitquery-users.json', JSON.stringify(bitqueryUsers), err => {
            if (err) {
                throw err;
            }
        })

        console.log(data.EVM.TokenHolders.length);


        return data;
        // console.log(characters.data, characters.data.length);

    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    bitquery,

}