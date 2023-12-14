const fs = require('fs');
const subgraph_url = "https://api.thegraph.com/subgraphs/name/rout-horizon/bsc-issuance";

const subgraph = async () => {
    let lasttimestamp = 1618470337;
    let holdersdata = [];
    let users = [];

    let data;
    do {
        // code block to be executed
        let results = await fetch(subgraph_url, {
            method: 'POST',

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                query: `{
                snxholders(
                    first: 1000
                    orderBy: timestamp
                    orderDirection: asc
                    where: {timestamp_gte: "${lasttimestamp}", collateral_not: "0"}

                ) {
                    id
                    block
                    timestamp
                    collateral
                    balanceOf
                    transferable
                    initialDebtOwnership
                    debtEntryAtIndex
                    claims
                    mints
              }
            }`
            })
        })
        data = await results.json();
        console.log(data.data.snxholders.length, data.data.snxholders[data.data.snxholders.length - 1].timestamp);
        lasttimestamp = data.data.snxholders[data.data.snxholders.length - 1].timestamp
        data.data.snxholders.map(element => {
            holdersdata.push(element)
            users.push(element.id)
        });
    }
    while (data.data.snxholders.length == 1000);

    // Can contain duplicates so remove duplicates
    holdersdata = await removeDuplicates(holdersdata);
    users = users.filter((item, index) => users.indexOf(item) === index);

    console.log(holdersdata.length, users.length);

    fs.writeFileSync('files/sources/subgraph-horizon-holders.json', JSON.stringify(holdersdata), err => {
        if (err) {
            throw err;
        }
    })

    fs.writeFileSync('files/sources/subgraph-users.json', JSON.stringify(users), err => {
        if (err) {
            throw err;
        }
    })
}

async function removeDuplicates(books) {
    jsonObject = books.map(JSON.stringify);
    uniqueSet = new Set(jsonObject);
    uniqueArray = Array.from(uniqueSet).map(JSON.parse);
 
    // console.log(uniqueArray);
    return uniqueArray;
}


module.exports = {
    subgraph,

}


// where: {timestamp_gte: "${lasttimestamp}", collateral_not: "0", balanceOf_not: "0"}
