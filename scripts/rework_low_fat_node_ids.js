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
    console.log('USAGE: node rework_low_fat_node_ids.js <inPath> <outPath>');
}

const inJson = fse.readJsonSync(path.resolve(process.argv[2]));
const outJson = reworkNodeIds(inJson);
fse.writeJsonSync(path.resolve(process.argv[3]), outJson, {spaces: 2});
