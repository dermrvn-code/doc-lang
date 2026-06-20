import { Field, Func, Model, Obj, Type } from "doc-lang-language";

/* =========================
   Core Dlang Types
========================= */

export type EntityId = string;

export type DlangEntityKind = "object" | "function";

type DlangEntityBase = {
    id: EntityId;
    name: string;
    description?: string;
    kind: DlangEntityKind;
    references: EntityId[];
};

export type DlangModel = {
    title: string;
    description?: string;
    sections: DlangSection[];
    entities: EntityDict;
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

export type DlangObject = DlangEntityBase & {
    kind: "object";
    members: DlangField[];
    code?: string;
};

export type DlangFunction = DlangEntityBase & {
    kind: "function";
    parameters: DlangField[];
    returnType?: DlangType;
    code?: string;
};

export type DlangEntity = DlangObject | DlangFunction;

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

export type EntityDict = Map<EntityId, DlangEntity>;

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

        // Skip empty sections so the generated markdown stays focused.
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
        entities,
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
        ...createEntityBase(node.name, node.description?.text, "object"),
        kind: "object",
        members: fields,
        code: stripCode(node.code),
    };

    registerEntity(obj, dict, builder);

    // Use the full entity so the helper can update both graph edges and back-references.
    recordLinkedEntityReferences(
        obj,
        fields,
        "owns",
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
        ...createEntityBase(node.name, node.description?.text, "function"),
        kind: "function",
        parameters,
        returnType: resolveType(node.returnType?.type),
        code: stripCode(node.code),
    };

    registerEntity(func, dict, builder);

    // Use the full entity so the helper can update both graph edges and back-references.
    recordLinkedEntityReferences(
        func,
        parameters,
        "dependsOn",
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
    description: string | undefined,
    kind: DlangEntityKind
): DlangEntityBase {
    return {
        id: createEntityId(name),
        name,
        description,
        kind,
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

function recordLinkedEntityReferences(
    entity: DlangEntity,
    fields: DlangField[],
    kind: DlangEdgeKind,
    builder: GraphBuilder
): void {
    for (const field of fields) {
        if (field.type?.kind !== "entity") continue;

        const referencedId = field.type.name;

        // Store the edge and the human-facing reference in one place.
        builder.edges.push({
            from: entity.id,
            to: referencedId,
            kind,
        });

        entity.references.push(referencedId);
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
