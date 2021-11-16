const path = require('path');
const fse = require('fs-extra');

const reworkNodeIds = ob => {
    const ret = {...ob};
    const nodeId = ob.content && ob.content.n;
    if (nodeId) {
        delete ob.content.n;
        ret.content.chapter = parseInt(nodeId.substring(2, 5)).toString();
        ret.content.verse = parseInt(nodeId.substring(5, 8)).toString();
    }
    if (ret.children) {
        ret.children = ob.children.map(c => reworkNodeIds(c));
    }
    return ret;
};

if (process.argv.length !== 4) {
    console.log('USAGE: node rework_low_fat_node_ids.js <inPath> <outName>');
    process.exit(1);
}

const inJson = fse.readJsonSync(path.resolve(process.argv[2]));
const outJson = reworkNodeIds(inJson);
fse.writeJsonSync(path.resolve("..", "sources", "low_fat_nt_trees", "reworked", process.argv[3] + ".json"), outJson, {spaces: 2});
