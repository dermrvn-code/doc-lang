import { createDocLangServices, type Model } from 'doc-lang-language';
// import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractAstNode, extractDestinationAndName, parseModelFromString } from './util.js';
import { astModelToDlangModel } from './dlangModel.js';
import { modelToMarkdown } from './markdownCodeGenerator.js';

import { NodeFileSystem } from 'langium/node';

export async function dlangStringToMarkdown(dlang: string): Promise<string> {

    const services = createDocLangServices(NodeFileSystem).DocLang;
    const model = await parseModelFromString<Model>(dlang, services);

    return modelToMarkdown(astModelToDlangModel(model));
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

    const content = modelToMarkdown(astModelToDlangModel(model));

    fs.writeFileSync(generatedFilePath, content);

    return generatedFilePath;
}

