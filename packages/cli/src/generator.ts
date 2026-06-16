import { createDocLangServices, type Model } from 'doc-lang-language';
// import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractAstNode, extractDestinationAndName, parseModelFromString } from './util.js';
import { astModelToDlangModel, DlangModel } from './dlangModel.js';
import { generateGraphs, generateHeader, generateSection, stringToId } from './markdownCodeGenerator.js';

import { NodeFileSystem } from 'langium/node';

export async function dlangStringToMarkdown(dlang: string): Promise<string> {

    const services = createDocLangServices(NodeFileSystem).DocLang;
    const model = await parseModelFromString<Model>(dlang, services);

    return modelToMarkdown(model);
}


export async function dlangFileToMarkdown(
    filePath: string,
    destination: string | undefined
): Promise<string> {

    const services = createDocLangServices(NodeFileSystem).DocLang;
    const model = await extractAstNode<Model>(filePath, services);

    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.md`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    const content = modelToMarkdown(model);

    fs.writeFileSync(generatedFilePath, content);

    return generatedFilePath;
}

export function modelToMarkdown(model: Model): string {

    const dlangModel: DlangModel = astModelToDlangModel(model);

    let markdownContent = generateHeader(dlangModel.title, dlangModel.description);

    let toc = `## Table of Contents\n\n` +
        `- [Diagrams](#diagrams)\n` +
        `  - [Class Diagram](#class-diagram)\n` +
        `  - [Dependency Diagram](#dependency-diagram)\n`;

    let sections = "";
    for (const section of dlangModel.sections) {

        if (section.title) {
            toc += `- [${section.title}](#${stringToId(section.title)})\n`;
        }

        sections += generateSection(section);
    }

    markdownContent += toc +
        "\n---\n\n" +
        generateGraphs(dlangModel.graphBuilder) +
        sections;

    return markdownContent;
}

