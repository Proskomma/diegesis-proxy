const path = require('path');
const fse = require('fs-extra');
const fileNames = [
    ["01-matthew", "MAT"],
    ["02-mark", "MRK"],
    ["03-luke", "LUK"],
    ["04-john", "JHN"],
    ["05-acts", "ACT"],
    ["06-romans", "ROM"],
    ["07-1corinthians", "1CO"],
    ["08-2corinthians", "2CO"],
    ["09-galatians", "GAL"],
    ["10-ephesians", "EPH"],
    ["11-philippians", "PHP"],
    ["12-colossians", "COL"],
    ["13-1thessalonians", "1TH"],
    ["14-2thessalonians", "2TH"],
    ["15-1timothy", "1TI"],
    ["16-2timothy", "2TI"],
    ["17-titus", "TIT"],
    ["18-philemon", "PHM"],
    ["19-hebrews", "HEB"],
    ["20-james", "JAS"],
    ["21-1peter", "1PE"],
    ["22-2peter", "2PE"],
    ["23-1john", "1JN"],
    ["24-2john", "2JN"],
    ["25-3john", "3JN"],
    ["26-jude", "JUD"],
    ["27-revelation", "REV"],
];

const reworkNodeIds = (ob, cv) => {
    if (ob.children && ob.children.length === 1) {
        return reworkNodeIds(ob.children[0], cv);
    }
    const ret = {...ob};
    delete ob.content.role;
    delete ob.content.osisId;
    delete ob.content.discontinuous;
    delete ob.content.head;
    delete ob.content.elementType;
    delete ob.content.articular;
    const nodeId = ob.content && ob.content.n;
    if (nodeId) {
        delete ob.content.n;
        const chapter = parseInt(nodeId.substring(2, 5)).toString();
        const verse = parseInt(nodeId.substring(5, 8)).toString();
        const newCV = `${chapter}:${verse}`;
        if (true || newCV !== cv) {
            ret.content.cv = newCV;
            cv = newCV;
        }
    }
    if (ret.children) {
        ret.children = ob.children
            .filter(c => !(c.content.text && !c.content.lemma))
            .map(c => reworkNodeIds(c, cv));
    }
    return ret;
};
for (const [inName, outName] of fileNames) {
    console.log(outName);
    const inJson = fse.readJsonSync(path.resolve('..', 'sources', 'low_fat_nt_trees', 'original', inName + '.json'));
    const outJson = reworkNodeIds(inJson, '', true);
    fse.writeJsonSync(path.resolve('..', 'sources', 'low_fat_nt_trees', 'reworked', outName + '.json'), outJson, {spaces: 2});
}
