grammar DocLang

entry Model:
    elements+=Element*;

Element:
    Obj | Func;

Obj:
    'Obj' name=ID '{'
        members+=Member*
    '}';

Member:
    Field ';';

Field:
    name=ID (
        ':' type=Type
    )?
    (
        '=' ref=[Func:ID]
    )?;

Func:
    'Func' name=ID '{'
        params+=Param*
        returnType=Type?
    '}';

Param:
    name=ID ':' type=Type ';';

Type:
    PrimitiveType | ref=[Obj:ID];

PrimitiveType returns string:
    'string' | 'int' | 'void';

terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal WS: /[ \t\r\n]+/;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
