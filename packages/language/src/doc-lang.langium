grammar DocLang

entry Model:
    elements+=Element*;

Element:
    Sect | Entity;

Entity:
    Obj | Func;


/* -------------------- Section -------------------- */

Sect:
    'Sect' text=STRING ';';


/* -------------------- Object -------------------- */

Obj:
    'Obj' name=ID '{'
        description=Description?
        members+=Member*
    '}';

Member:
    Field ';';

Description:
    text=STRING;


/* -------------------- Field System -------------------- */

Field:
    name=ID (
        ':' type=Type
    )?
    (
        '=' value=FieldValue
    )?;

FieldValue:
    Ref | Literal;

Ref:
    ref=[Entity:ID];

Literal returns string:
    STRING | INT;


/* -------------------- Functions -------------------- */

Func:
    'Func' name=ID '{'
        description=Description?
        params+=Param*
        returnType=Type?
    '}';

Param:
    name=ID ':' type=Type ';';


/* -------------------- Types -------------------- */

Type:
    PrimitiveType | ref=[Obj:ID];

PrimitiveType returns string:
    'string' | 'int' | 'void';


/* -------------------- Terminals -------------------- */

terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT: /[0-9]+/;
terminal STRING: /"[^"]*"/;


/* -------------------- Hidden tokens -------------------- */

hidden terminal WS: /[ \t\r\n]+/;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
