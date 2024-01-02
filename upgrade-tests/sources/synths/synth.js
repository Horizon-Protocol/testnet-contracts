const fs = require('fs');
const subgraph_url = "https://api.thegraph.com/subgraphs/name/rout-horizon/bsc-issuance";

const subgraph = async (synthSymbol) => {
    let lasttimestamp = 1618470337;
    let holdersdata = [];
    let users = [];

    console.log(`Fetching ${synthSymbol} synth holders list`);

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
                synthBalances(
                    first: 1000
                    orderBy: timestamp
                    orderDirection: asc
                    where: {timestamp_gte: "${lasttimestamp}", synth_: {symbol: "${synthSymbol}"}}
                ) {
                    account
                    amount
                    timestamp
                    synth {
                        symbol
                    }
              }
            }`
            })
        })
        data = await results.json();
        console.log(data.data.synthBalances.length, data.data.synthBalances[data.data.synthBalances.length - 1].timestamp);
        lasttimestamp = data.data.synthBalances[data.data.synthBalances.length - 1].timestamp
        data.data.synthBalances.map(element => {
            holdersdata.push(element)
            users.push(element.account)
        });
    }
    while (data.data.synthBalances.length == 1000);

    // Can contain duplicates so remove duplicates
    holdersdata = await removeDuplicates(holdersdata);
    users = users.filter((item, index) => users.indexOf(item) === index);

    console.log(holdersdata.length, users.length);

    fs.writeFileSync(`files/sources/synths/subgraph-${synthSymbol}-holders.json`, JSON.stringify(holdersdata), err => {
        if (err) {
            throw err;
        }
    })

    fs.writeFileSync(`files/sources/synths/${synthSymbol}-users.json`, JSON.stringify(users), err => {
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

const synth = async () => {
    const synths = [
        "zUSD",
        "zBNB",
        "zBTC",
        "zETH",
        "zADA",
        "zDOT",
        "zSOL",
        "zXRP",
        "zCAKE",
        "zLINK",
        "zXAU",
        "zXAG",
        "zWTI",
        "zEUR",
        "zJPY",
        "zSPY",
        "zQQQ",
        "zGOOGL",
        "zAAPL",
        "zTSLA",
        "zCOIN",
        "zAMZN",
        "zMSFT",
        "zNVDA",
        "zAVAX",
        "zMATIC",
    ]


    for (let index = 0; index < synths.length; index++) {
        const element = synths[index];
        await subgraph(element);
    }
}

module.exports = {
    synth,

}

// subgraph()