import { Field, FieldValue, Func, Model, Obj, Type } from "doc-lang-language";

/* =========================
   Core Dlang Types
========================= */

export type DlangModel = {
    title: string;
    description?: string;
    elements: DlangElement[];
};

export type DlangElement =
    | { kind: "section"; value: string }
    | { kind: "object"; value: DlangObject }
    | { kind: "function"; value: DlangFunction };

export type DlangField = {
    name: string;
    type?: DlangType;
    value?: string;
};

export type DlangEntity = {
    name: string;
    description?: string;
};

export type DlangObject = DlangEntity & {
    members: DlangField[];
    code?: string;
};

export type DlangFunction = DlangEntity & {
    parameters: DlangField[];
    returnType?: DlangType;
    code?: string;
};

/* =========================
   Type System
========================= */

export type DlangType =
    | { kind: "primitive"; name: string }
    | { kind: "object"; name: string }
    | { kind: "function" }
    | { kind: "unknown" };

/* =========================
   Entity Registry
========================= */

type EntityDict = Map<string, DlangEntity>;

/* =========================
   Entry Point
========================= */

/** Convert AST model → DLang model */
export function astModelToDlangModel(model: Model): DlangModel {
    const entities: EntityDict = new Map();

    const elements: DlangElement[] = model.elements.map((el) => {
        switch (el.$type) {
            case "Sect":
                return {
                    kind: "section",
                    value: el.text,
                } satisfies DlangElement;

            case "Obj":
                return {
                    kind: "object",
                    value: toObj(el, entities),
                } satisfies DlangElement;

            case "Func":
                return {
                    kind: "function",
                    value: toFunc(el, entities),
                } satisfies DlangElement;

            default:
                throw new Error(`Unsupported element type: ${(el as any).$type}`);
        }
    });

    return {
        title: model.proj.text,
        description: model.desc?.text,
        elements,
    };
}

/* =========================
   Object Conversion
========================= */

/** Convert AST object → DLang object */
function toObj(node: Obj, dict: EntityDict): DlangObject {
    assertUnique(node.name, dict);

    const obj: DlangObject = {
        name: node.name,
        description: node.description?.text,
        members: node.members.map(toField),
        code: node.code?.replace(/`/g, ""),
    };

    dict.set(node.name, obj);
    return obj;
}

/* =========================
   Function Conversion
========================= */

/** Convert AST function → DLang function */
function toFunc(node: Func, dict: EntityDict): DlangFunction {
    assertUnique(node.name, dict);

    const func: DlangFunction = {
        name: node.name,
        description: node.description?.text,
        parameters: node.params.map(toField),
        returnType: resolveType(node.returnType?.type),
        code: node.code?.replace(/`/g, ""),
    };

    dict.set(node.name, func);
    return func;
}

/* =========================
   Field Conversion
========================= */

/** Convert AST field → DLang field */
function toField(node: Field): DlangField {
    return {
        name: node.name,
        type: resolveType(node.type, node.value),
        value: resolveValue(node.value),
    };
}

/* =========================
   Type Resolution
========================= */

/** Resolve declared or inferred type */
function resolveType(type?: Type, value?: FieldValue): DlangType | undefined {
    return resolveDeclaredType(type) ?? inferType(value);
}

/** Convert explicit AST type */
function resolveDeclaredType(type?: Type): DlangType | undefined {
    if (type == undefined) return;

    switch (type.$type) {
        case "PrimitiveType":
            return { kind: "primitive", name: type.primitive };

        case "ObjectType":
            return { kind: "object", name: unwrap(type.ref).name };

        default:
            return;
    }
}

/** Infer type from value (best-effort) */
function inferType(value?: FieldValue): DlangType | undefined {
    if (value == undefined || value.$type !== "Ref") return;

    const ref = unwrap(value.ref);
    return ref.$type === "Func"
        ? { kind: "function" }
        : { kind: "unknown" };
}

/* =========================
   Value Resolution
========================= */

/** Convert field value → string representation */
function resolveValue(value?: FieldValue): string | undefined {
    if (value == undefined) return;

    switch (value.$type) {
        case "Literal":
            return value.value;

        case "Ref":
            return unwrap(value.ref).name;

        default:
            return;
    }
}

/* =========================
   Helpers
========================= */

/** Ensure unique entity names in scope */
function assertUnique(name: string, dict: EntityDict): void {
    if (dict.has(name)) {
        throw new Error(`Duplicate entity: ${name}`);
    }
}

/** Unwrap AST reference node */
function unwrap<T extends { ref?: unknown }>(wrapper: T): any {
    if (!wrapper?.ref) {
        throw new Error("Invalid AST reference: missing ref");
    }
    return wrapper.ref;
}
