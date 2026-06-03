grammar DocLang

entry Model:
    proj=Proj
    desc=Descr?
    elements+=Element*;

Element:
    Sect | Entity;

Entity:
    Obj | Func;

/* ----------------- Document Header --------------- */

Proj:
    'Proj' text=STRING;

Descr:
    'Descr' text=STRING;

/* -------------------- Section -------------------- */

Sect:
    'Sect' text=STRING;

/* ---------- General Entity Attributes ----------- */

Description:
    text=STRING;

UsageExample:
    code=CODE_BLOCK;

/* -------------------- Object -------------------- */

Obj:
    'Obj' name=ID '{'
        description=Description?
        members+=Field*
        code=CODE_BLOCK?
    '}';

/* -------------------- Functions -------------------- */

Func:
    'Func' name=ID '{'
        description=Description?
        params+=Field*
        returnType=ReturnType?
        code=CODE_BLOCK?
    '}';

ReturnType:
    'return:' type=Type;

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

Literal:
    value=(STRING | INT);


/* -------------------- Types -------------------- */

Type:
    PrimitiveType | ObjectType;

PrimitiveType:
    primitive=('string' | 'int' | 'void');

ObjectType:
    ref=[Obj:ID];


/* -------------------- Terminals -------------------- */

terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT: /[0-9]+/;
terminal STRING: /"[^"]*"/;
terminal CODE_BLOCK: /```[^`]*```/;


/* -------------------- Hidden tokens -------------------- */

hidden terminal WS: /[ \t\r\n]+/;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
