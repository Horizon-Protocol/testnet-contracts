const { program } = require('commander');
const { ethers } = require('ethers');
const fs = require('fs');
const { getContractFromDeployment, readMulticall, provider } = require('./utils.js');

const synthBalances = async (synth) => {
    const options = program.opts();
    console.log('FolderName', options.folder);

    const users = JSON.parse(fs.readFileSync(`./files/sources/synths/${synth}-users.json`));
    console.log(`Reading function balanceOf using multicall from proxy ${synth} for ${users.length}`);

    const ABI = [
        'function balanceOf(address) external view returns (uint)',    
    ]
    const proxySynth = new ethers.Contract(getContractFromDeployment(synth == 'zUSD' ? "ProxyERC20" + synth : "Proxy" + synth), ABI, provider);


    let synthBalances = [];
    let filteredAddresses = [];

    try {
        await readMulticall(
            users,
            (address) => proxySynth.populateTransaction.balanceOf(address),
            // (a, r) => {},
            (address, response) => {
                const output = ethers.utils.defaultAbiCoder.decode(['uint256'], response.returnData);
                console.log(`User ${address} has ${output[0]} synth balance`);
                synthBalances.push({
                    wallet: address,
                    balance: output[0].toString(),
                })
                if (output[0].gt(0)) {
                    filteredAddresses.push({
                        wallet: address,
                        balance: output[0].toString(),
                    });
                }
            },
            0, // 0 = READ; 1 = WRITE;
            50, // L1 max size = ~200; L2 max size = ~150;
        );


        fs.writeFileSync(`files/${options.folder}/synths/${synth}-balances.json`, JSON.stringify(synthBalances), err => {
            if (err) {
                throw err;
            }
        })

        if (synth == 'zUSD') {
            fs.writeFileSync(`files/${options.folder}/synths/${synth}-positive-balances.json`, JSON.stringify(filteredAddresses), err => {
                if (err) {
                    throw err;
                }
            })
        }

        return true;

    } catch (error) {
        console.error(error);
        process.exit(0);
    }
}

const synths = async () => {
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
        // const proxy = await getContractFromDeployment("Proxy" + element);
        await synthBalances(element);
    }
}

program
    .requiredOption('-f, --folder <value>', 'Folder to save the output')
    .action(synths)

program.parse();

module.exports = {
    synths,
}
