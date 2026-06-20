import { nanoid } from "nanoid";

import {
    DlangField,
    DlangFunction,
    DlangObject,
    DlangSection,
    DlangType,
} from "./dlangModel.js";

function stringToId(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

export function generateSection(
    section: DlangSection
): string {
    // Section output stays self-contained so the main markdown file only orchestrates the order.
    let markdownContent = "";
    let sectionBody = "";

    const sectionId = section.title
        ? stringToId(section.title)
        : nanoid(16);

    if (section.title) {
        markdownContent += `## ${section.title} {#${sectionId}}\n\n`;
    }

    const toc: string[] = [];

    if (section.objects.length > 0) {
        const id = `#${sectionId}-objects`;

        toc.push(`- [Objects](${id})\n`);
        sectionBody += `### Objects {${id}}\n\n`;

        for (const object of section.objects) {
            toc.push(`   - [${object.name}](#${stringToId(object.name)})\n`);
            sectionBody += generateObject(object);
        }
    }

    if (section.functions.length > 0) {
        const id = `#${sectionId}-functions`;

        toc.push(`- [Functions](${id})\n`);
        sectionBody += `### Functions {${id}}\n\n`;

        for (const func of section.functions) {
            toc.push(`   - [${func.name}](#${stringToId(func.name)})\n`);
            sectionBody += generateFunction(func);
        }
    }

    markdownContent += `${toc.join("")}\n---\n\n`;
    markdownContent += sectionBody;

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
    // Both objects and functions share the same entity footer, so the common formatting lives here.
    let markdown = `#### ${title} {#${stringToId(
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
        markdown += "**See also**\n";

        for (const ref of entity.references) {
            markdown += `[\`${ref}\`](#${stringToId(
                ref
            )}) `;
        }

        markdown += "\n";
    }

    markdown += "\n---\n\n";

    return markdown;
}

function generateFieldSection(
    title: string,
    fields: DlangField[]
): string {
    if (fields.length === 0) {
        return "";
    }

    let markdown = `**${title}**\n\n`;

    for (const field of fields) {
        markdown += generateField(field) + "\n";
    }

    markdown += "\n";

    return markdown;
}

export function generateCodeBlock(
    code: string
): string {
    // Keep the code block wrapper simple so usage examples stay visually distinct.
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
