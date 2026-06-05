import { DlangField, DlangFunction, DlangObject, DlangSection, DlangType, GraphBuilder } from "./dlangModel.js";
import { nanoid } from "nanoid";

export const stringToId = (str: string): string => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

export function generateHeader(title: string, description?: string): string {
    let markdown = `# ${title}\n\n`;

    if (description) {
        markdown += `${description}\n\n`;
    }

    return markdown;
}

export function generateGraphs(graphBuilder: GraphBuilder): string {
    let markdown = "## Diagrams {#diagrams}\n\n";

    markdown += "### Class Diagram {#class-diagram}\n\n";
    markdown += "> TODO: Add class diagram here\n\n";

    markdown += "### Dependency Diagram {#dependency-diagram}\n\n";
    markdown += generateDependencyMermaidGraph(graphBuilder);

    markdown += "\n---\n\n";

    return markdown;
}

export function generateDependencyMermaidGraph(graphBuilder: GraphBuilder): string {
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
        mermaid += "classDef loose fill:#ffebee,stroke:#f44336,stroke-width:4px;\n";
        mermaid += `class ${looseNodeIds.join(",")} loose;\n`;
    }

    return mermaid + "```\n";
}


export function generateSection(section: DlangSection): string {

    let markdownContent = "";
    let sectionId = nanoid(16); // use generated short id, if no section title is given

    if (section.title) {
        sectionId = stringToId(section.title);
        markdownContent += `## ${section.title} {#${sectionId}}\n\n`;
    }

    let toc = "";
    let objects = ""
    let functions = ""


    if (section.objects.length > 0) {
        let id = `#${sectionId}-objects`;

        toc += `- [Objects](${id})\n`;
        objects += `### Objects {${id}}\n\n`;


        for (const object of section.objects) {
            objects += generateObject(object);

            toc += `  - [${object.name}](#${stringToId(object.name)})\n`;
        }
    }

    if (section.functions.length > 0) {
        const id = `#${sectionId}-functions`;

        toc += `- [Functions](${id})\n`;
        functions += `### Functions {${id}}\n\n`;

        for (const func of section.functions) {
            functions += generateFunction(func);

            toc += `  - [${func.name}](#${stringToId(func.name)})\n`;
        }
    }

    markdownContent += `${toc}\n---\n\n`;
    markdownContent += objects;
    markdownContent += functions;


    return markdownContent;
}

export function generateObject(object: DlangObject): string {

    let markdown = `### \`${object.name}\` {#${stringToId(object.name)}}\n\n`;

    if (object.description) {
        markdown += `${object.description}\n\n`;
    }

    if (object.members.length > 0) {
        markdown += "**Fields**\n\n";

        for (const field of object.members) {
            markdown += generateField(field) + "\n";
        }
        markdown += "\n";
    }

    if (object.code) {
        markdown += generateCodeBlock(object.code);
    }

    // TODO: Add "See also"

    markdown += "---\n\n";
    return markdown;
}

export function generateFunction(func: DlangFunction): string {
    let markdown = `### \`${func.name}()\` {#${stringToId(func.name)}}\n\n`;

    if (func.description) {
        markdown += `${func.description}\n\n`;
    }

    if (func.parameters.length > 0) {
        markdown += "**Parameters**\n\n";

        for (const param of func.parameters) {
            markdown += generateField(param) + "\n";
        }
        markdown += "\n";
    }


    if (func.returnType) {
        markdown += `**Returns**: ${generateType(func.returnType)}\n\n`;
    }

    if (func.code) {
        markdown += generateCodeBlock(func.code);
    }

    // TODO: Add "See also"

    markdown += "---\n\n";
    return markdown;
}

export function generateCodeBlock(code: string): string {
    return "**Usage**\n" +
        "```" +
        code +
        "```\n\n";
}

export function generateType(type: DlangType): string {
    let markdown = "";

    if (type.kind === "primitive") {
        markdown += `\`${type.name}\``;
    } else if (type.kind === "entity") {
        markdown += `\`${type.name}\``;
    }

    return markdown;
}


export function generateField(field: DlangField): string {
    let markdown = `- **${field.name}**`;

    if (field.type) {
        markdown += `: ${generateType(field.type)}`;
    }


    if (field.value !== undefined) {

        if (field.type?.kind === "primitive") {
            markdown += ` = ${field.value}`;

        } else if (field.type?.kind === "entity") {
            // TODO: linking

            markdown += ` = [\`${field.value}\`]()`;
        }
    }

    return markdown;
}
