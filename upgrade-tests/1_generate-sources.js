const { bscscan } = require('./sources/bscscan');
const { bitquery } = require('./sources/bitquery');
const { covalent } = require('./sources/covalent');
const { subgraph } = require('./sources/subgraph');

const generateSource = async() => { 
    await bscscan();
    console.log("bscscan complete");
    await bitquery();
    console.log("bitquery complete");
    await covalent();
    console.log("covalent complete");
    await subgraph();
    console.log("subgraph complete");
 }

 generateSource();
