


export const languageId = 'doc-lang';
export const dslExtension = '.dlang';

export const dslpublisher = 'Grunwald';
export const dslversion = '0.0.1';

export const exampleCode = `
Proj "Example Project"
Descr "Here will be the documentation for the 'Example Project'. "

Sect "Example Section"

Obj Logger{ 
    "Core logging component of the system."
    
    name: string
    id: int = 0
    log = Log

    \`\`\`
    Logger logger = new Logger()
    \`\`\`
} 

Obj Backend{
    "Main backend container object."

    logger: Logger
    
    \`\`\`
    Backend backend = new Backend()
    backend.logger.log("This is a log message.")
    \`\`\`
} 

Func Log{ 
    "Handles logging of messages."

    message: string
    return: void

    \`\`\`
    logger.Log("This is a log message.")
    \`\`\`
}
`;

export const codeUri = '/workspace/doc.dlang';
