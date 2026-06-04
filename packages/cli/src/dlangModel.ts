import { Field, Func, Model, Obj, Type } from "doc-lang-language";

/* =========================
   Core Dlang Types
========================= */

export type EntityId = string;

export type DlangModel = {
    title: string;
    description?: string;
    sections: DlangSection[];
};

export type DlangSection = {
    title: string;
    objects: DlangObject[];
    functions: DlangFunction[];
};

export type DlangField = {
    name: string;
    type?: DlangType;
    value?: string;
};

export type DlangEntity = {
    id: EntityId;
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
    Edge System
========================= */

export type DlangEdgeKind =
    | "owns"
    | "dependsOn";

export type DlangEdge = {
    from: EntityId;
    to: EntityId;
    kind: DlangEdgeKind;
};

type GraphBuilder = {
    edges: DlangEdge[];
    nodes: EntityId[];
};

/* =========================
   Type System
========================= */

export type DlangType =
    | { kind: "primitive"; name: string }
    | { kind: "entity"; name: string }
    | { kind: "unknown" };

/* =========================
   Entity Registry
========================= */

type EntityDict = Map<EntityId, DlangEntity>;

/* =========================
   Entry Point
========================= */

/** Convert AST model → DLang model */
export function astModelToDlangModel(model: Model): DlangModel {
    const entities: EntityDict = new Map();
    const graphBuilder: GraphBuilder = { edges: [], nodes: [] };

    const sections: DlangSection[] = [];

    let currentSection: DlangSection | null = null;

    const flushSection = () => {
        if (!currentSection) return;

        if (currentSection.objects.length > 0 || currentSection.functions.length > 0) {
            sections.push(currentSection);
        }

        currentSection = null;
    };

    for (const element of model.elements) {
        switch (element.$type) {
            case "Sect":
                flushSection();

                currentSection = {
                    title: element.text,
                    objects: [],
                    functions: [],
                };
                break;

            case "Obj":
                if (!currentSection) {
                    currentSection = {
                        title: "",
                        objects: [],
                        functions: [],
                    };
                }

                currentSection.objects.push(toObj(element, entities, graphBuilder));
                break;

            case "Func":
                if (!currentSection) {
                    currentSection = {
                        title: "",
                        objects: [],
                        functions: [],
                    };
                }

                currentSection.functions.push(toFunc(element, entities, graphBuilder));
                break;

            default:
                throw new Error(
                    `Unsupported element type: ${(element as any).$type}`
                );
        }
    }

    flushSection();

    return {
        title: model.proj.text,
        description: model.desc?.text,
        sections,
    };
}

/* =========================
   ID Generation
========================= */

function createEntityId(name: string): EntityId {
    return name; // temporary identity mapping
}

/* =========================
   Object Conversion
========================= */

/** Convert AST object → DLang object */
function toObj(
    node: Obj,
    dict: EntityDict,
    builder: GraphBuilder
): DlangObject {
    const id = createEntityId(node.name);

    assertUnique(id, dict);

    const fields = node.members.map(toField);

    const obj: DlangObject = {
        id,
        name: node.name,
        description: node.description?.text,
        members: fields,
        code: node.code?.replace(/`/g, ""),
    };

    dict.set(id, obj);

    // ---------------------------------
    // EDGE EXTRACTION
    // ---------------------------------
    for (const field of fields) {

        if (field.type?.kind === "entity") {
            builder.edges.push({
                from: id,
                to: field.type.name,
                kind: "owns",
            });
        }
    }
    builder.nodes.push(id); // always add to nodes, to expose entities without edges

    return obj;
}

/* =========================
   Function Conversion
========================= */

/** Convert AST function → DLang function */
function toFunc(node: Func, dict: EntityDict, builder: GraphBuilder): DlangFunction {
    const id = createEntityId(node.name);

    assertUnique(id, dict);

    const parameters = node.params.map(toField);

    const func: DlangFunction = {
        id,
        name: node.name,
        description: node.description?.text,
        parameters: parameters,
        returnType: resolveType(node.returnType?.type),
        code: node.code?.replace(/`/g, ""),
    };

    // ---------------------------------
    // EDGE EXTRACTION
    // ---------------------------------
    for (const parameter of parameters) {

        if (parameter.type?.kind === "entity") {
            builder.edges.push({
                from: id,
                to: parameter.type.name,
                kind: "dependsOn",
            });
        }
    }
    builder.nodes.push(id); // always add to nodes, to expose entities without edges

    dict.set(id, func);
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
        value: node.value,
    };
}

/* =========================
   Type Resolution
========================= */

/** Resolve declared or inferred type */
function resolveType(type?: Type, value?: string): DlangType | undefined {
    return resolveDeclaredType(type);
}

/** Convert explicit AST type */
function resolveDeclaredType(type?: Type): DlangType | undefined {
    if (type == undefined) return;

    switch (type.$type) {
        case "PrimitiveType":
            return { kind: "primitive", name: type.primitive };

        case "EntityType":
            return { kind: "entity", name: unwrap(type.ref).name };

        default:
            return;
    }
}

/* =========================
   Helpers
========================= */

/** Ensure unique entity names in scope */
function assertUnique(id: EntityId, dict: EntityDict): void {
    if (dict.has(id)) {
        throw new Error(`Duplicate entity: ${id}`);
    }
}

/** Unwrap AST reference node */
function unwrap<T extends { ref?: unknown }>(wrapper: T): any {
    if (!wrapper?.ref) {
        throw new Error("Invalid AST reference: missing ref");
    }
    return wrapper.ref;
}
