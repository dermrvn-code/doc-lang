import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { Description, Entity, Field, Func, Sect, type DocLangAstType } from './generated/ast.js';
import type { DocLangServices } from './doc-lang-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: DocLangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DocLangValidator;
    const checks: ValidationChecks<DocLangAstType> = {
        Sect: validator.checkSectionNamingConvention,
        Func: validator.checkFunctionHasReturnType,
        Entity: validator.checkEntityNamingConvention,
        Description: validator.checkDescriptionOnlyOneLine,
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
    checkDescriptionOnlyOneLine(description: Description, accept: ValidationAcceptor): void {
        if (!this._checkOneLineString(description.text)) {
            accept('warning', 'Description should be only one line.', { node: description });
        }
    }

    checkFunctionHasReturnType(func: Func, accept: ValidationAcceptor): void {
        if (!func.returnType) {
            accept('warning', `Function should have a return type. ${func.returnType}`, { node: func, property: 'returnType' });
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


