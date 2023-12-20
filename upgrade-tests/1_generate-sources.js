const { bscscan } = require('./sources/bscscan');
const { bitquery } = require('./sources/bitquery');
const { covalent } = require('./sources/covalent');
const { subgraph } = require('./sources/subgraph');

const generateSource = async (source) => {
    switch (source) {
        case "bscscan":
            console.log("Generating bscscan holder list");
            await bscscan();
            console.log("bscscan complete");
            break;
        case "bitquery":
            console.log("Generating bitquery holder list");
            await bitquery();
            console.log("bitquery complete");
            break;
        case "covalent":
            console.log("Generating covalent holder list");
            await covalent();
            console.log("covalent complete");
            break;
        case "subgraph":
            console.log("Generating subgraph holder list");
            await subgraph();
            console.log("subgraph complete");
            break;
        case "all":
            console.log("Generating all sources");
            await bscscan();
            console.log("bscscan complete");
            await bitquery();
            console.log("bitquery complete");
            await covalent();
            console.log("covalent complete");
            await subgraph();
            console.log("subgraph complete");
            break;

        default:
            console.log("No source selected");
    }
}

program
    .requiredOption('-s, --source <value>', 'Sources')
    .action(generateSource)

program.parse();

module.exports = {
    generateSource,
}

