import { DlangModel, DlangSection } from "./dlangModel.js";
import { generateGraphs } from "./markdownDiagrams.js";
import { generateSection } from "./markdownEntitySections.js";

function stringToId(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

function generateHeader(
    title: string,
    description?: string
): string {
    let markdown = `# ${title}\n\n`;

    if (description) {
        markdown += `${description}\n\n`;
    }

    return markdown;
}

function generateTableOfContents(sections: DlangSection[]): string {
    // Keep the top-level TOC centralized so the page entry points stay easy to scan.
    let toc = `## Table of Contents\n\n` +
        `- [Diagrams](#diagrams)\n` +
        `  - [Class Diagram](#class-diagram)\n` +
        `  - [Dependency Diagram](#dependency-diagram)\n`;

    for (const section of sections) {
        if (section.title) {
            toc += `- [${section.title}](#${stringToId(section.title)})\n`;
        }
    }

    return toc;
}

export function modelToMarkdown(model: DlangModel): string {
    const markdownContent = generateHeader(
        model.title,
        model.description
    );

    const sections = model.sections.map((section) => generateSection(section)).join("");

    return markdownContent +
        generateTableOfContents(model.sections) +
        "\n---\n\n" +
        generateGraphs(model.entities, model.graphBuilder) +
        sections;
}
