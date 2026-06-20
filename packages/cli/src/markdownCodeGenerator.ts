import {
    DlangField,
    DlangFunction,
    DlangObject,
    DlangSection,
    DlangType,
    EntityDict,
    GraphBuilder,
} from "./dlangModel.js";
import { nanoid } from "nanoid";

export const stringToId = (str: string): string => {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
};

export function generateHeader(
    title: string,
    description?: string
): string {
    let markdown = `# ${title}\n\n`;

    if (description) {
        markdown += `${description}\n\n`;
    }

    return markdown;
}

export function generateGraphs(
    entitiesDict: EntityDict,
    graphBuilder: GraphBuilder
): string {
    let markdown = "## Diagrams {#diagrams}\n\n";

    markdown += "### Class Diagram {#class-diagram}\n\n";
    markdown += generateClassDiagramMermaidGraph(entitiesDict, graphBuilder);

    markdown += "### Dependency Diagram {#dependency-diagram}\n\n";
    markdown += generateDependencyMermaidGraph(graphBuilder);

    markdown += "\n---\n\n";

    return markdown;
}

export function generateDependencyMermaidGraph(
    graphBuilder: GraphBuilder
): string {
    let mermaid = "```mermaid\n";
    mermaid += "graph LR\n\n";

    const connectedNodes = new Set<string>();

    for (const edge of graphBuilder.edges) {
        connectedNodes.add(edge.from);
        connectedNodes.add(edge.to);
    }

    const looseNodeIds: string[] = [];

    for (const node of graphBuilder.nodes) {
        const nodeId = stringToId(node);

        mermaid += `${nodeId}["${node}"]\n`;

        if (!connectedNodes.has(node)) {
            looseNodeIds.push(nodeId);
        }
    }

    mermaid += "\n";

    for (const edge of graphBuilder.edges) {
        const fromId = stringToId(edge.from);
        const toId = stringToId(edge.to);

        let relation = "---";

        if (edge.kind === "owns") {
            relation = '-->|"owns"|';
        } else if (edge.kind === "dependsOn") {
            relation = '-->|"depends on"|';
        }

        mermaid += `${fromId} ${relation} ${toId}\n`;
    }

    // Highlight loose nodes (not connected to any edge)
    if (looseNodeIds.length > 0) {
        mermaid += "\n";
        mermaid +=
            "classDef loose fill:#ffebee,stroke:#f44336,stroke-width:4px;\n";
        mermaid += `class ${looseNodeIds.join(",")} loose;\n`;
    }

    return mermaid + "```\n";
}

export function generateClassDiagramMermaidGraph(
    entitiesDict: EntityDict,
    graphBuilder: GraphBuilder,
): string {
    let mermaid = "```mermaid\n";
    mermaid += "classDiagram\n";
    mermaid += "direction LR\n\n";

    for (const [, entity] of entitiesDict) {
        if (!("members" in entity)) continue;

        const object = entity as DlangObject;
        mermaid += `class ${object.name} {\n`;

        for (const member of object.members) {
            const type = member.type;

            if (type?.kind === "unknown") continue;

            // Function member
            if (type?.kind === "entity") {
                const referenced = entitiesDict.get(type.name);

                if (referenced && "parameters" in referenced) {
                    const func = referenced as DlangFunction;
                    const returnType =
                        func.returnType?.kind !== "unknown"
                            ? func.returnType?.name
                            : "void";

                    mermaid += `  ${returnType} ${member.name}: ${type.name}\n`;
                    continue;
                }
            }

            // Field member
            let line = "  ";

            if (type?.name) {
                line += `${type.name} `;
            }

            line += member.name;

            if (member.value !== undefined) {
                line += ` = ${member.value}`;
            }

            mermaid += `${line}\n`;
        }

        mermaid += "}\n\n";
    }

    for (const edge of graphBuilder.edges) {
        const fromEntity = entitiesDict.get(edge.from);
        const toEntity = entitiesDict.get(edge.to);

        if (!fromEntity || !toEntity) continue;

        if (fromEntity.id === toEntity.id) continue; // Skip self-referencing edges

        if (!("members" in fromEntity) || !("members" in toEntity)) continue; // Skip if either is not an object

        const fromName = fromEntity.name;
        const toName = toEntity.name;
        let relation = "-->";

        mermaid += `${fromName} ${relation} ${toName}\n`;
    }

    return `${mermaid}\`\`\`\n`;
}

export function generateSection(
    section: DlangSection
): string {
    let markdownContent = "";

    const sectionId = section.title
        ? stringToId(section.title)
        : nanoid(16);

    if (section.title) {
        markdownContent += `## ${section.title} {#${sectionId}}\n\n`;
    }

    let toc = "";
    let objects = "";
    let functions = "";

    if (section.objects.length > 0) {
        const id = `#${sectionId}-objects`;

        toc += `- [Objects](${id})\n`;
        objects += `### Objects {${id}}\n\n`;

        for (const object of section.objects) {
            objects += generateObject(object);

            toc += `  - [${object.name}](#${stringToId(
                object.name
            )})\n`;
        }
    }

    if (section.functions.length > 0) {
        const id = `#${sectionId}-functions`;

        toc += `- [Functions](${id})\n`;
        functions += `### Functions {${id}}\n\n`;

        for (const func of section.functions) {
            functions += generateFunction(func);

            toc += `  - [${func.name}](#${stringToId(
                func.name
            )})\n`;
        }
    }

    markdownContent += `${toc}\n---\n\n`;
    markdownContent += objects;
    markdownContent += functions;

    return markdownContent;
}

export function generateObject(
    object: DlangObject
): string {
    let body = "";

    body += generateFieldSection(
        "Fields",
        object.members
    );

    return generateEntity(
        object,
        `\`${object.name}\``,
        body
    );
}

export function generateFunction(
    func: DlangFunction
): string {
    let body = "";

    body += generateFieldSection(
        "Parameters",
        func.parameters
    );

    if (func.returnType) {
        body += `**Returns**: ${generateType(
            func.returnType
        )}\n\n`;
    }

    return generateEntity(
        func,
        `\`${func.name}()\``,
        body
    );
}

function generateEntity(
    entity: DlangObject | DlangFunction,
    title: string,
    body: string
): string {
    let markdown = `### ${title} {#${stringToId(
        entity.name
    )}}\n\n`;

    if (entity.description) {
        markdown += `${entity.description}\n\n`;
    }

    markdown += body;

    if (entity.code) {
        markdown += generateCodeBlock(entity.code);
    }

    if (entity.references.length > 0) {
        markdown += "**See also**\n\n";

        for (const ref of entity.references) {
            markdown += `- [\`${ref}\`](#${stringToId(
                ref
            )})\n`;
        }

        markdown += "\n";
    }

    markdown += "---\n\n";

    return markdown;
}

function generateFieldSection(
    title: string,
    fields: DlangField[]
): string {
    if (fields.length === 0) {
        return "";
    }

    let markdown = `**${title}**\n`;

    for (const field of fields) {
        markdown += generateField(field) + "\n";
    }

    markdown += "\n";

    return markdown;
}

export function generateCodeBlock(
    code: string
): string {
    return (
        "**Usage**\n" +
        "```" +
        code +
        "```\n\n"
    );
}

export function generateType(
    type: DlangType
): string {
    switch (type.kind) {
        case "primitive":
            return `\`${type.name}\``;

        case "entity":
            return `[\`${type.name}\`](#${stringToId(
                type.name
            )})`;

        default:
            return "";
    }
}

export function generateField(
    field: DlangField
): string {
    let markdown = `- **${field.name}**`;

    if (field.type) {
        markdown += `: ${generateType(field.type)}`;
    }

    if (
        field.value !== undefined &&
        field.type?.kind === "primitive"
    ) {
        markdown += ` = ${field.value}`;
    }

    return markdown;
}
