const path = require('path');
const fse = require('fs-extra');
const {Proskomma, blocksSpecUtils} = require('proskomma');
const {tokenizeString, blocksSpec2Query, treeToInputBlock} = blocksSpecUtils;

const itemTokens =
    str => tokenizeString(str)
        .map(tr => ({
                type: 'token',
                subType: tr[1],
                payload: tr[0],
            }),
        );

if (process.argv.length !== 3) {
    console.log('USAGE: node low_fat_to_trees <treeJsonDirPath>');
    process.exit(1);
}
const pk = new Proskomma();

const importBook = async () => {
    for (const bookFile of fse.readdirSync(process.argv[2])) {
        const bookName = bookFile.split('.')[0];
        console.warn(bookName);
        let query = `mutation { addDocument(` +
            `selectors: [{key: "lang", value: "eng"}, {key: "abbr", value: "cblft"}], ` +
            `contentType: "usfm", ` +
            `content: """\\id ${bookName}\n\\toc Clear.Bible Low Fat Syntax Trees\n\\imt Syntax Trees for ${bookName}\n"""` +
            `tags: ["doctype:tree"]) }`;
        let result = await pk.gqlQuery(query);
        query = `{ docSets { document(bookCode:"${bookName}") { id } } }`;
        result = await pk.gqlQuery(query);
        const docId = result.data.docSets[0].document.id;
        const fileContent = fse.readFileSync(path.resolve(process.argv[2], bookFile));
        const trees = treeToInputBlock(JSON.parse(fileContent));
        const treesQuery = blocksSpec2Query(trees);
        query = `mutation { newSequence(` +
            ` documentId: "${docId}"` +
            ` type: "tree"` +
            ` blocksSpec: ${treesQuery}` +
            ` graftToMain: true) }`;
        await pk.gqlQuery(query);
        // break;
    }
    const query = '{documents { bookCode: header(id:"bookCode") treeSequences { nNodes } } }';
    console.warn(JSON.stringify(await pk.gqlQuery(query), null, 2));
    const serial = pk.serializeSuccinct('eng_cblft');
    console.log(JSON.stringify(serial, null, 2));
}

importBook().then();
