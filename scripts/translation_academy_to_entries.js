const path = require('path');
const fse = require('fs-extra');
const {Proskomma, blocksSpecUtils} = require('proskomma');
const {tokenizeString, blocksSpec2Query} = blocksSpecUtils;

const itemTokens =
    str => tokenizeString(str)
        .map(tr => ({
                type: 'token',
                subType: tr[1],
                payload: tr[0],
            }),
        );

const entryRecord = entry => {
    return {
        'bs': {
            'type': 'scope',
            'subType': 'start',
            'payload': `kvPrimary/${entry.key}`,
        },
        'bg': [],
        'os': [],
        'is': [
            {
                'type': 'scope',
                'subType': 'start',
                'payload': 'kvField/title',
            },
            {
                'type': 'scope',
                'subType': 'start',
                'payload': 'kvField/subTitle',
            },
            {
                'type': 'scope',
                'subType': 'start',
                'payload': 'kvField/content',
            },
        ],
        'items': [
            {
                'type': 'scope',
                'subType': 'start',
                'payload': 'kvField/title',
            },
            ...itemTokens(entry.title),
            {
                'type': 'scope',
                'subType': 'end',
                'payload': 'kvField/title',
            },
            {
                'type': 'scope',
                'subType': 'start',
                'payload': 'kvField/subTitle',
            },
            ...itemTokens(entry.subTitle),
            {
                'type': 'scope',
                'subType': 'end',
                'payload': 'kvField/subTitle',
            },
            {
                'type': 'scope',
                'subType': 'start',
                'payload': 'kvField/content',
            },
            ...itemTokens(entry.content),
            {
                'type': 'scope',
                'subType': 'end',
                'payload': 'kvField/content',
            },
        ],
    };
};

if (process.argv.length !== 3) {
    console.log('USAGE: node translation_academy_to_entries <taDirPath>');
    process.exit(1);
}
const taDir = path.resolve(process.argv[2]);
const taContent = [];
fse.readdirSync(taDir)
    .filter(d => fse.lstatSync(path.resolve(taDir, d)).isDirectory())
    .forEach(
        categoryName => {
            fse.readdirSync(path.resolve(taDir, categoryName))
                .filter(d => fse.lstatSync(path.resolve(taDir, categoryName, d)).isDirectory())
                .forEach(
                    entryName => {
                        taContent.push({
                            key: `${categoryName}>>${entryName}`,
                            title: fse.readFileSync(path.resolve(taDir, categoryName, entryName, 'title.md')).toString(),
                            subTitle: fse.readFileSync(path.resolve(taDir, categoryName, entryName, 'sub-title.md')).toString(),
                            content: fse.readFileSync(path.resolve(taDir, categoryName, entryName, '01.md')).toString(),
                        });
                    },
                );
        },
    );

const entries =
    blocksSpec2Query(
        taContent.map(
            entry => {
                return entryRecord(entry);
            },
        ),
    );
const pk = new Proskomma();

const query = `mutation { addDocument(` +
    `selectors: [{key: "lang", value: "eng"}, {key: "abbr", value: "uwta"}], ` +
    `contentType: "usfm", ` +
    `content: """\id TA1\n\toc Translation Academy\n\imt Translation Academy\n""") }`;
pk.gqlQuery(query)
    .then(() => {
        const query = '{ docSets { documents { id } } }';
        pk.gqlQuery(query)
            .then(result => {
                const docId = result.data.docSets[0].documents[0].id;
                const query = `mutation { newSequence(` +
                    ` documentId: "${docId}"` +
                    ` type: "kv"` +
                    ` blocksSpec: ${entries}` +
                    ` graftToMain: true) }`;
                pk.gqlQuery(query)
                    .then(() => {
                        const serial = pk.serializeSuccinct('eng_uwta');
                        console.log(JSON.stringify(serial, null, 2));
                    });
            });
    });
