import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import type { Model } from "doc-lang-language";
import { createDocLangServices } from "doc-lang-language";

let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(() => {
    const services = createDocLangServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.DocLang);
});

/**
 * Extract diagnostics from a parsed document
 */
function getDiagnostics(doc: LangiumDocument<Model>): Diagnostic[] {
    return doc.diagnostics ?? [];
}

/**
 * Helper: parse + return diagnostics only
 */
async function validate(input: string): Promise<Diagnostic[]> {
    const doc = await parse(input, { validation: true });
    return getDiagnostics(doc);
}

/**
 * Helper: match diagnostic by message substring
 */
function hasDiagnostic(diags: Diagnostic[], messagePart: string) {
    return diags.some(d => d.message.includes(messagePart));
}

/* -------------------------------------------------
   Project / Section / Description rules
-------------------------------------------------- */

describe("Project / Section / Description validation", () => {

    test("valid single-line project, section, description produces no diagnostics", async () => {
        const diags = await validate(`
            Proj "MyProject"
            Sect "Main Section"

            Obj TestObj
            "Simple description"
            
        `);

        expect(diags).toHaveLength(0);
    });

    test("multiline project text produces warning", async () => {
        const diags = await validate(`
            Proj "My
Project"
        `);

        expect(hasDiagnostic(diags, "Project name should be only one line.")).toBe(true);
    });

    test("multiline section text produces error", async () => {
        const diags = await validate(`
            Sect "Bad
Section"
        `);

        expect(hasDiagnostic(diags, "Section text can be only one line.")).toBe(true);
    });

    test("multiline description produces warning", async () => {
        const diags = await validate(`
            Proj "X"

            Obj A
            "line1
            line2"
        
        `);
        expect(hasDiagnostic(diags, "Description should be only one line.")).toBe(true);
    });
});

/* -------------------------------------------------
   Function validation
-------------------------------------------------- */

describe("Function validation", () => {

    test("function without return type produces warning", async () => {
        const diags = await validate(`
            Func MyFunc
            description "test"
        `);

        expect(hasDiagnostic(diags, "Function should have a return type")).toBe(true);
    });

    test("function with return type is valid", async () => {
        const diags = await validate(`
            Func MyFunc 
            return: int
        `);

        expect(hasDiagnostic(diags, "Function should have a return type")).toBe(false);
    });
});

/* -------------------------------------------------
   Naming conventions
-------------------------------------------------- */

describe("Naming conventions", () => {

    test("entity name must be UpperCamelCase", async () => {
        const diags = await validate(`
            Proj "X"

            Obj badName
        `);

        expect(hasDiagnostic(diags, "Entity name should be in upper camelCase.")).toBe(true);
    });

    test("field name must be lowerCamelCase", async () => {
        const diags = await validate(`
            Proj "X"

            Obj Test
            BadField: string
        `);

        expect(hasDiagnostic(diags, "Field name should be in lowerCamelCase.")).toBe(true);
    });

    test("valid naming produces no naming diagnostics", async () => {
        const diags = await validate(`
            Proj "X"

            Obj GoodName
            goodField: string
        `);

        const namingIssues = diags.filter(d =>
            d.message.includes("camelCase")
        );

        expect(namingIssues).toHaveLength(0);
    });

    test("lowerCamelCase allows trailing digits", async () => {
        const diags = await validate(`
            Proj "X"

            Obj Test
            logger1: string
        `);

        const namingIssues = diags.filter(d =>
            d.message.includes("camelCase")
        );

        expect(namingIssues).toHaveLength(0);
    });
});

/* -------------------------------------------------
   Entity spacing validation (empty lines around entities)
-------------------------------------------------- */

describe("Entity spacing rules", () => {

    test("entity with proper empty lines is valid", async () => {
        const diags = await validate(`

            Proj "X"

            Obj GoodEntity

            Sect "After"

        `);

        expect(hasDiagnostic(diags, "Entity should be preceded by an empty line.")).toBe(false);
        expect(hasDiagnostic(diags, "Entity should be followed by an empty line.")).toBe(false);
    });

    test("entity without preceding empty line produces warning", async () => {
        const diags = await validate(`
            Proj "X"
            Obj BadEntity
        `);

        expect(hasDiagnostic(diags, "Entity should be preceded by an empty line.")).toBe(true);
    });

    test("entity without trailing empty line produces warning", async () => {
        const diags = await validate(`
            Proj "X"

            Obj BadEntity 
            Sect "Next"
        `);

        expect(hasDiagnostic(diags, "Entity should be followed by an empty line.")).toBe(true);
    });

    test("entity surrounded by other content produces both warnings", async () => {
        const diags = await validate(`
            Proj "X"
            Obj BadEntity
            Sect "Next"
        `);

        expect(hasDiagnostic(diags, "Entity should be preceded by an empty line.")).toBe(true);
        expect(hasDiagnostic(diags, "Entity should be followed by an empty line.")).toBe(true);
    });

});

/* -------------------------------------------------
   Field type/value consistency validation
-------------------------------------------------- */

describe("Field type/value consistency", () => {

    test("primitive field allows value", async () => {
        const diags = await validate(`
            Proj "X"

            Obj Test
            name: string = "hello"
            count: int = 42
        `);

        expect(hasDiagnostic(diags, "Entity-typed fields cannot have a value assigned.")).toBe(false);
    });

    test("entity type field with value produces error", async () => {
        const diags = await validate(`
            Proj "X"

            Obj Test
            ref: SomeEntity = "invalid"
        `);

        expect(hasDiagnostic(diags, "Entity-typed fields cannot have a value assigned.")).toBe(true);
    });

    test("entity type field without value is valid", async () => {
        const diags = await validate(`
            Proj "X"

            Obj Test
            ref: SomeEntity
        `);

        expect(hasDiagnostic(diags, "Entity-typed fields cannot have a value assigned.")).toBe(false);
    });

    test("comp is only allowed for object references", async () => {
        const diags = await validate(`
            Proj "X"

            Obj Test
            comp name: string

            Func Helper
            comp value: string
        `);

        expect(hasDiagnostic(diags, "The comp modifier is only allowed for object references to other entities.")).toBe(true);
    });

    test("comp on object entity reference is valid", async () => {
        const diags = await validate(`
            Proj "X"

            Obj Parent
            comp child: Child

            Obj Child
        `);

        expect(hasDiagnostic(diags, "The comp modifier is only allowed for object references to other entities.")).toBe(false);
    });

    test("missing type with value is allowed", async () => {
        const diags = await validate(`
            Proj "X"

            Obj Test
            loose = "value"
        `);

        expect(hasDiagnostic(diags, "Entity-typed fields cannot have a value assigned.")).toBe(false);
    });

});

/* -------------------------------------------------
   Combined / realistic scenario
-------------------------------------------------- */

describe("Combined validation scenarios", () => {

    test("multiple violations are all reported", async () => {
        const diags = await validate(`
            Proj "Bad
Project"

            Sect "Bad
Section"

            Func badFunc
            BadField: string

            Obj badObj
        `);

        expect(hasDiagnostic(diags, "Project name should be only one line.")).toBe(true);
        expect(hasDiagnostic(diags, "Section text can be only one line.")).toBe(true);
        expect(hasDiagnostic(diags, "Function should have a return type")).toBe(true);
        expect(hasDiagnostic(diags, "Field name should be in lowerCamelCase.")).toBe(true);
        expect(hasDiagnostic(diags, "Entity name should be in upper camelCase.")).toBe(true);
    });
});
