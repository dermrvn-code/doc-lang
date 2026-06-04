import type { Model } from 'doc-lang-language';
// import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './util.js';
import { astModelToDlangModel, DlangModel } from './dlangModel.js';
import { generateFunction, generateHeader, generateObject, generateSection } from './markdownCodeGenerator.js';

export function generateMarkdown(
    model: Model,
    filePath: string,
    destination: string | undefined
): string {
    
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.md`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    const content = modelToMarkdown(model);

    fs.writeFileSync(generatedFilePath, content);

    return generatedFilePath;
}

function modelToMarkdown(model: Model): string {

    const dlangModel: DlangModel = astModelToDlangModel(model);

    let markdownContent = generateHeader(dlangModel.title, dlangModel.description);

    for (const element of dlangModel.elements) {

        switch (element.kind) {
            case "section":
                markdownContent += generateSection(element.value);
                break;
            case "object":
                markdownContent += generateObject(element.value);
                break;
            case "function":
                markdownContent += generateFunction(element.value);
                break;
            default:
                break;
        }
    }

    return markdownContent;
}

