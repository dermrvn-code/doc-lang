import { describe, expect, test } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { dlangStringToMarkdown } from '../src/generator.js';

const validFixtureRoot = path.resolve(__dirname, 'fixtures', 'valid');
const fixturePairs = findFixturePairs(validFixtureRoot);

describe('CLI markdown generation fixtures', () => {
    for (const fixture of fixturePairs) {
        const title = fixture.metadata ? ` — ${fixture.metadata}` : '';

        test(`generates expected markdown for ${fixture.name}${title}`, async () => {
            const input = fs.readFileSync(fixture.inputPath, 'utf-8');
            const actual = normalizeMarkdown(await dlangStringToMarkdown(input));
            const expected = normalizeMarkdown(fs.readFileSync(fixture.expectedPath, 'utf-8'));

            expect(actual).toBe(expected);
        });
    }
});

type FixturePair = {
    name: string;
    inputPath: string;
    expectedPath: string;
    metadata?: string;
};

function findFixturePairs(rootDir: string): FixturePair[] {
    return fs
        .readdirSync(rootDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => {
            const name = entry.name;
            const inputPath = path.join(rootDir, name, 'input.dlang');
            const expectedPath = path.join(rootDir, name, 'expected.md');

            if (!fs.existsSync(inputPath)) {
                throw new Error(`Missing fixture input: ${inputPath}`);
            }

            if (!fs.existsSync(expectedPath)) {
                throw new Error(`Missing expected markdown: ${expectedPath}`);
            }

            const metadata = readFixtureMetadata(inputPath);

            return { name, inputPath, expectedPath, metadata } satisfies FixturePair;
        });
}

function readFixtureMetadata(inputPath: string): string | undefined {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const projectMatch = content.match(/^\s*Proj\s+(['"])(.*?)\1/m);
    const descriptionMatch = content.match(/^\s*Descr\s+(['"])(.*?)\1/m);

    if (projectMatch && descriptionMatch) {
        return `${projectMatch[2]} — ${descriptionMatch[2]}`;
    }

    if (projectMatch) {
        return projectMatch[2];
    }

    return descriptionMatch?.[2];
}

function normalizeMarkdown(markdown: string): string {
    return markdown
        .replace(/\r\n/g, '\n')
        .replace(/#([A-Za-z0-9_-]+-(objects|functions))/g, '#section-$2');
}
