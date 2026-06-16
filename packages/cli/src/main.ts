import { Command } from 'commander';
import chalk from 'chalk';

import { dlangFileToMarkdown } from './generator.js';

export type GenerateOptions = {
    destination?: string;
};

export async function generateAction(
    file: string,
    options: GenerateOptions
): Promise<void> {
    try {
        console.log(chalk.blue(`Generating documentation for: ${file}...`));

        const outputPath = await dlangFileToMarkdown(
            file,
            options.destination
        );

        console.log(
            chalk.green(`Generation completed: ${outputPath}`)
        );
    } catch (err) {
        console.error(
            chalk.red(`Generation failed:`),
            err
        );
        process.exit(1);
    }
}

export default function main(): void {
    const program = new Command();

    program
        .name('doc-lang')
        .description('DSL toolchain for structured documentation generation')
        .version('0.1.0');

    program
        .command('generate')
        .argument('<file>', 'DSL source file')
        .option(
            '-d, --destination <dir>',
            'output directory'
        )
        .action(generateAction);

    program.parse(process.argv);
}
