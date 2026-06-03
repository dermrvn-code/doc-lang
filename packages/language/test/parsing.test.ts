import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { clearDocuments, parseHelper } from 'langium/test';

import type {
    Func,
    Literal,
    Model,
    Obj,
    PrimitiveType
} from 'doc-lang-language';

import {
    createDocLangServices,
    isModel
} from 'doc-lang-language';

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
    }
});

describe('Parser tests', () => {

    test('parses minimal model', async () => {
        document = await parse(`
            Proj "My Project"
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const model = document.parseResult.value;

        expect(model.proj.text).toBe('My Project');
        expect(model.elements).toHaveLength(0);
    });

    test('parses project with description and section', async () => {
        document = await parse(`
            Proj "My Project"
            Descr "Documentation"

            Sect "Introduction"
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const model = document.parseResult.value;

        expect(model.desc?.text).toBe('Documentation');
        expect(model.elements).toHaveLength(1);
    });

    test('parses object without members', async () => {
        document = await parse(`
            Proj "Test"

            Obj Empty {}
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const obj = document.parseResult.value.elements[0] as Obj;

        expect(obj.name).toBe('Empty');
        expect(obj.members).toHaveLength(0);
    });

    test('parses object with fields', async () => {
        document = await parse(`
            Proj "Test"

            Obj Person {
                name: string
                age: int = 42
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const obj = document.parseResult.value.elements[0] as Obj;

        expect(obj.name).toBe('Person');
        expect(obj.members).toHaveLength(2);
    });

    test('parses function without return type', async () => {
        document = await parse(`
            Proj "Test"

            Func log {}
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const func = document.parseResult.value.elements[0] as Func;

        expect(func.name).toBe('log');
        expect(func.returnType).toBeUndefined();
    });

    test('parses function with primitive return type', async () => {
        document = await parse(`
            Proj "Test"

            Func greet {
                return: string
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const func = document.parseResult.value.elements[0] as Func;
        const returnType = func.returnType?.type as PrimitiveType;

        expect(returnType.$type).toBe('PrimitiveType');
        expect(returnType.primitive).toBe('string');
    });

    test('parses primitive int type', async () => {
        document = await parse(`
            Proj "Test"

            Obj Example {
                count: int
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const obj = document.parseResult.value.elements[0] as Obj;
        const type = obj.members[0].type as PrimitiveType;

        expect(type.primitive).toBe('int');
    });

    test('parses primitive void return type', async () => {
        document = await parse(`
            Proj "Test"

            Func reset {
                return: void
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const func = document.parseResult.value.elements[0] as Func;
        const type = func.returnType?.type as PrimitiveType;

        expect(type.primitive).toBe('void');
    });

    test('parses string literal field value', async () => {
        document = await parse(`
            Proj "Test"

            Obj User {
                name = "John"
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const obj = document.parseResult.value.elements[0] as Obj;
        expect(obj.members[0].value?.$type).toBe('Literal');

        const literal = obj.members[0].value as Literal;
        expect(literal.value).toBe('John');
    });

    test('parses integer literal field value', async () => {
        document = await parse(`
            Proj "Test"

            Obj User {
                age = 42
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const obj = document.parseResult.value.elements[0] as Obj;

        expect(obj.members[0].value?.$type).toBe('Literal');

        const literal = obj.members[0].value as Literal;
        expect(literal.value).toBe(42);
    });

    test('parses code block on object', async () => {
        document = await parse(`
            Proj "Test"

            Obj User {
                \`\`\`const x = 1;\`\`\`
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();

        const obj = document.parseResult.value.elements[0] as Obj;

        expect(obj.code).toContain('const x = 1');
    });

    test('fails without project declaration', async () => {
        document = await parse(`
            Obj Person {}
        `);

        expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('fails on missing object name', async () => {
        document = await parse(`
            Proj "Test"

            Obj {
            }
        `);

        expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length
        ? document.parseResult.parserErrors.map(e => e.message).join('\n')
        : document.parseResult.value === undefined
            ? 'ParseResult is undefined.'
            : !isModel(document.parseResult.value)
                ? `Root AST object is ${document.parseResult.value.$type}, expected Model.`
                : undefined;
}
