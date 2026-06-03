import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { clearDocuments, parseHelper } from 'langium/test';

import type {
    Model,
    Obj,
    ObjectType,
    Func,
    Ref
} from 'doc-lang-language';

import {
    createDocLangServices
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

describe('Linking tests', () => {

    test('links object type reference to actual Obj node', async () => {
        document = await parse(`
            Proj "Test"

            Obj Person {}

            Obj Company {
                owner: Person
            }
        `);

        const model = document.parseResult.value;

        const person = model.elements[0] as Obj;
        const company = model.elements[1] as Obj;

        const ownerType = company.members[0].type as ObjectType;

        expect(ownerType.ref.ref).toBe(person);
    });

    test('links field value reference to actual Obj node', async () => {
        document = await parse(`
            Proj "Test"

            Obj Person {}

            Obj Company {
                owner = Person
            }
        `);

        const model = document.parseResult.value;

        const person = model.elements[0] as Obj;
        const company = model.elements[1] as Obj;

        const ownerValue = company.members[0].value as Ref;

        expect(ownerValue.ref.ref).toBe(person);
    });

    test('links function reference from object field', async () => {
        document = await parse(`
            Proj "Test"

            Func greet {}

            Obj Example {
                callback = greet
            }
        `);

        const model = document.parseResult.value;

        const greet = model.elements[0] as Func;
        const example = model.elements[1] as Obj;

        const callback = example.members[0].value as Ref;

        expect(callback.ref.ref).toBe(greet);
    });

    test('fails to link unknown object type', async () => {
        document = await parse(`
            Proj "Test"

            Obj Company {
                owner: UnknownType
            }
        `);

        const model = document.parseResult.value;

        const company = model.elements[0] as Obj;

        const ownerType = company.members[0].type as ObjectType;

        expect(ownerType.ref.ref).toBeUndefined();
        expect(ownerType.ref.error).toBeDefined();
        expect(ownerType.ref.error?.message).toContain('UnknownType');
    });

    test('fails to link unknown value reference', async () => {
        document = await parse(`
            Proj "Test"

            Obj Company {
                owner = UnknownEntity
            }
        `);

        const model = document.parseResult.value;

        const company = model.elements[0] as Obj;

        const ownerValue = company.members[0].value as Ref;

        expect(ownerValue.ref.ref).toBeUndefined();
        expect(ownerValue.ref.error).toBeDefined();
        expect(ownerValue.ref.error?.message).toContain('UnknownEntity');
    });
});
