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

/* -------------------- Object -------------------- */

Obj:
    'Obj' name=ID
        description=Description?
        members+=Field*
        code=CODE_BLOCK?
    ;

/* -------------------- Functions -------------------- */

Func:
    'Func' name=ID
        description=Description?
        params+=Field*
        returnType=ReturnType?
        code=CODE_BLOCK?
    ;

ReturnType:
    'return:' type=Type;

/* -------------------- Field System -------------------- */

Field:
    name=ID (
        ':' type=Type
    )?
    (
        '=' value=Value
    )?
;

/* -------------------- Types -------------------- */

Type:
    PrimitiveType | EntityType;

PrimitiveType:
    primitive=('void' | 'string' | 'int' | 'boolean' | 'float' | 'double' |  'long' | 'byte' | 'short' | 'char');

EntityType:
    ref=[Entity:ID];

/* -------------------- Values -------------------- */

Value returns string:
    STRING
    | CHAR
    | BOOL
    | HEX_BYTE
    | BIN_BYTE
    | BYTE
    | FLOAT
    | DOUBLE
    | LONG
    | SHORT
    | INT
;

/* -------------------- Terminals -------------------- */
terminal STRING: /"[^"]*"/;
terminal CHAR: /'.'/;

terminal BOOL: 'true' | 'false';

terminal HEX_BYTE: /0[xX][0-9a-fA-F]+/;
terminal BIN_BYTE: /0[bB][01]+/;
terminal BYTE: /[0-9]+b/;

terminal FLOAT: /[0-9]+\.[0-9]+f/;
terminal DOUBLE: /[0-9]+\.[0-9]+/;
terminal LONG: /[0-9]+L/;
terminal SHORT: /[0-9]+s/;
terminal INT: /[0-9]+/;

terminal ID: /[_a-zA-Z][\w_]*/;

terminal CODE_BLOCK: /```[^`]*```/;

/* -------------------- Hidden tokens -------------------- */

hidden terminal WS: /[ \t\r\n]+/;
hidden terminal LINE_COMMENT: /\/\/[^\n\r]*/;
hidden terminal BLOCK_COMMENT: /\/\*[\s\S]*?\*\//;
