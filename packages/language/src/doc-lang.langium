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

/* ---------- General Entity Attributes ----------- */

Description:
    text=STRING;

UsageExample:
    code=CODE_BLOCK;

/* -------------------- Object -------------------- */

Obj:
    'Obj' name=ID '{'
        description=Description?
        members+=Member*
        code=CODE_BLOCK?
    '}';

Member:
    Field ';';



/* -------------------- Functions -------------------- */

Func:
    'Func' name=ID '{'
        description=Description?
        params+=Param*
        returnType=Type?
        code=CODE_BLOCK?
    '}';

Param:
    name=ID ':' type=Type ';';


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


/* -------------------- Types -------------------- */

Type:
    PrimitiveType | ref=[Obj:ID];

PrimitiveType returns string:
    'string' | 'int' | 'void';


/* -------------------- Terminals -------------------- */

terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT: /[0-9]+/;
terminal STRING: /"[^"]*"/;
terminal CODE_BLOCK: /```[^`]*```/;


/* -------------------- Hidden tokens -------------------- */

hidden terminal WS: /[ \t\r\n]+/;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
