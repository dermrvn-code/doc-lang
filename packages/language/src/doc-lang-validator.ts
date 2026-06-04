import { AstUtils, type ValidationAcceptor, type ValidationChecks } from 'langium';
import { Description, Entity, Field, Func, Proj, Sect, type DocLangAstType } from './generated/ast.js';
import type { DocLangServices } from './doc-lang-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: DocLangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DocLangValidator;
    const checks: ValidationChecks<DocLangAstType> = {
        Proj: validator.checkProjectNameOnlyOneLine,
        Sect: validator.checkSectionNamingConvention,
        Func: validator.checkFunctionHasReturnType,
        Entity: [
            validator.checkEntityNamingConvention,
            validator.checkEntityHasEmptyLinesAround
        ],
        Description: validator.checkEntityDescriptionOnlyOneLine,
        Field: validator.checkFieldNamingConvention
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class DocLangValidator {

    // Error checks
    checkSectionNamingConvention(section: Sect, accept: ValidationAcceptor): void {
        if (section.text && !this._checkOneLineString(section.text)) {
            accept('error', 'Section text can be only one line.', { node: section, property: 'text' });
        }
    }

    // Warning
    checkProjectNameOnlyOneLine(proj: Proj, accept: ValidationAcceptor): void {
        if (proj.text && !this._checkOneLineString(proj.text)) {
            accept('warning', 'Project name should be only one line.', { node: proj });
        }
    }

    checkEntityDescriptionOnlyOneLine(description: Description, accept: ValidationAcceptor): void {
        if (description.text && !this._checkOneLineString(description.text)) {
            accept('warning', 'Description should be only one line.', { node: description });
        }
    }

    checkFunctionHasReturnType(func: Func, accept: ValidationAcceptor): void {
        if (!func.returnType) {
            accept('warning', `Function should have a return type. ${func.returnType}`, { node: func, property: 'returnType' });
        }
    }

    checkEntityHasEmptyLinesAround(entity: Entity, accept: ValidationAcceptor): void {
        const cstNode = entity.$cstNode;
        if (!cstNode) {
            return;
        }

        const text = AstUtils.getDocument(entity).textDocument.getText();
        const lines = text.split(/\r?\n/);

        const startLine = cstNode.range.start.line;
        const endLine = cstNode.range.end.line;

        // Check line before (unless entity starts the file)
        const hasContentBefore = lines
            .slice(0, startLine)
            .some(line => line.trim() !== '');

        if (hasContentBefore) {
            const lineBefore = lines[startLine - 1] ?? '';
            if (lineBefore.trim() !== '') {
                accept(
                    'warning',
                    'Entity should be preceded by an empty line.',
                    { node: entity }
                );
            }
        }

        // Check line after (unless entity ends the file)
        const hasContentAfter = lines
            .slice(endLine + 1)
            .some(line => line.trim() !== '');

        if (hasContentAfter) {
            const lineAfter = lines[endLine + 1] ?? '';
            if (lineAfter.trim() !== '') {
                accept(
                    'warning',
                    'Entity should be followed by an empty line.',
                    { node: entity }
                );
            }
        }
    }

    // Info
    checkEntityNamingConvention(entity: Entity, accept: ValidationAcceptor): void {
        if (entity.name && !this._checkCamelCaseString(entity.name)) {
            accept('info', 'Entity name should be in upper camelCase.', { node: entity, property: 'name' });
        }
    }

    checkFieldNamingConvention(field: Field, accept: ValidationAcceptor): void {
        if (field.name && !this._checkCamelCaseString(field.name, true)) {
            accept('info', 'Field name should be in lowerCamelCase.', { node: field, property: 'name' });
        }
    }

    // Helper methods for validation checks
    _checkCamelCaseString(value: string, isLowerCamelCase: boolean = false): boolean {
        const camelCasePattern = isLowerCamelCase ? /^[a-z]+([A-Z][a-z]*)*$/ : /^[A-Z][a-zA-Z]*$/;
        return camelCasePattern.test(value);
    }

    _checkOneLineString(value: string): boolean {
        return !value.includes('\n');
    }
}


