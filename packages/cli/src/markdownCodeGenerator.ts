import { DlangField, DlangFunction, DlangObject, DlangType } from "./dlangModel.js";


const stringToId = (str: string): string => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

export function generateHeader(title: string, description?: string): string {
    let markdown = `# ${title}\n\n`;

    if (description) {
        markdown += `${description}\n\n`;
    }

    return markdown;
}


export function generateSection(title: string): string {
    return `## ${title} {#${stringToId(title)}}\n\n`;
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
    } else if (type.kind === "object") {
        markdown += `\`${type.name}\``;
    }

    return markdown;
}


export function generateField(field: DlangField): string {
    let markdown = `- **${field.name}**`;

    if (field.type) {
        markdown += `": ${generateType(field.type)}`;
    }


    if (field.value !== undefined) {

        if (field.type?.kind === "primitive") {
            markdown += ` = ${field.value}`;

        } else if (field.type?.kind === "object" || field.type?.kind === "function") {
            // TODO: linking

            markdown += ` = [\`${field.value}\`]()`;
        }
    }

    return markdown;
}
