import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { clearDocuments, parseHelper } from 'langium/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { createDocLangServices, type Model } from 'doc-lang-language';

let services: ReturnType<typeof createDocLangServices>;
let parse: ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(() => {
    services = createDocLangServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.DocLang);
});

afterEach(() => {
    if (document) {
        clearDocuments(services.shared, [document]);
        document = undefined;
    }
});

describe('CLI invalid input tests', () => {
    for (const fixturePath of findInvalidFixtures(path.resolve(__dirname, 'fixtures', 'invalid'))) {
        test(`rejects ${path.basename(fixturePath)}`, async () => {
            document = await parse(fs.readFileSync(fixturePath, 'utf-8'));

            expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
        });
    }
});

function findInvalidFixtures(rootDir: string): string[] {
    return fs
        .readdirSync(rootDir)
        .filter(entry => entry.endsWith('.dlang'))
        .map(entry => path.join(rootDir, entry));
}
