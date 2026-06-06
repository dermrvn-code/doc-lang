import { Field, Func, Model, Obj, Type } from "doc-lang-language";

/* =========================
   Core Dlang Types
========================= */

export type EntityId = string;

export type DlangModel = {
    title: string;
    description?: string;
    sections: DlangSection[];
    graphBuilder: GraphBuilder;
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
    references: EntityId[];
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

export type GraphBuilder = {
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

        if (
            currentSection.objects.length > 0 ||
            currentSection.functions.length > 0
        ) {
            sections.push(currentSection);
        }

        currentSection = null;
    };

    for (const element of model.elements) {
        switch (element.$type) {
            case "Sect":
                flushSection();
                currentSection = createSection(element.text);
                break;

            case "Obj":
                currentSection ??= createSection();

                currentSection.objects.push(
                    toObj(element, entities, graphBuilder)
                );
                break;

            case "Func":
                currentSection ??= createSection();

                currentSection.functions.push(
                    toFunc(element, entities, graphBuilder)
                );
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
        graphBuilder,
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
    const fields = node.members.map(toField);

    const obj: DlangObject = {
        ...createEntityBase(node.name, node.description?.text),
        members: fields,
        code: stripCode(node.code),
    };

    registerEntity(obj, dict, builder);

    // ---------------------------------
    // EDGE EXTRACTION
    // ---------------------------------
    collectEntityReferences(
        obj.id,
        fields,
        "owns",
        obj,
        builder
    );

    return obj;
}

/* =========================
   Function Conversion
========================= */

/** Convert AST function → DLang function */
function toFunc(
    node: Func,
    dict: EntityDict,
    builder: GraphBuilder
): DlangFunction {
    const parameters = node.params.map(toField);

    const func: DlangFunction = {
        ...createEntityBase(node.name, node.description?.text),
        parameters,
        returnType: resolveType(node.returnType?.type),
        code: stripCode(node.code),
    };

    registerEntity(func, dict, builder);

    // ---------------------------------
    // EDGE EXTRACTION
    // ---------------------------------
    collectEntityReferences(
        func.id,
        parameters,
        "dependsOn",
        func,
        builder
    );

    return func;
}

/* =========================
   Field Conversion
========================= */

/** Convert AST field → DLang field */
function toField(node: Field): DlangField {
    return {
        name: node.name,
        type: resolveType(node.type),
        value: node.value,
    };
}

/* =========================
   Type Resolution
========================= */

/** Resolve declared or inferred type */
function resolveType(type?: Type): DlangType | undefined {
    if (!type) return;

    switch (type.$type) {
        case "PrimitiveType":
            return {
                kind: "primitive",
                name: type.primitive,
            };

        case "EntityType":
            return {
                kind: "entity",
                name: unwrap(type.ref).name,
            };

        default:
            return;
    }
}

/* =========================
   Helpers
========================= */

function createSection(title = ""): DlangSection {
    return {
        title,
        objects: [],
        functions: [],
    };
}

function createEntityBase(
    name: string,
    description?: string
): DlangEntity {
    return {
        id: createEntityId(name),
        name,
        description,
        references: [],
    };
}

function registerEntity(
    entity: DlangEntity,
    dict: EntityDict,
    builder: GraphBuilder
): void {
    assertUnique(entity.id, dict);

    dict.set(entity.id, entity);
    builder.nodes.push(entity.id);
}

function collectEntityReferences(
    sourceId: EntityId,
    fields: DlangField[],
    kind: DlangEdgeKind,
    entity: DlangEntity,
    builder: GraphBuilder
): void {
    for (const field of fields) {
        if (field.type?.kind !== "entity") continue;

        builder.edges.push({
            from: sourceId,
            to: field.type.name,
            kind,
        });

        // Track references for use in "See also" section
        entity.references.push(field.type.name);
    }
}

function stripCode(code?: string): string | undefined {
    return code?.replace(/`/g, "");
}

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
