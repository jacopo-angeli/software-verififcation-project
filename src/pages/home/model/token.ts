export enum TokenType {
  // Numeral
  NUM,
  // Variable
  VAR,
  // Booleans
  TRUE,
  FALSE,

  // Arithmetic operator
  PLUS,
  MINUS,
  STAR,
  MODULE,
  SLASH,
  PPLUS,
  MMINUS,

  // Binary operators
  EQ,
  INEQ,
  LESS,
  LESSEQ,
  MORE,
  MOREEQ,
  NOT,
  AND,
  OR,

  // Parenthesis and braces
  BRA,
  bra,
  KET,
  ket,

  // Base cases
  ASS,
  SKIP,
  // Concatenation
  CONC,
  // Conditional
  IF,
  THEN,
  ELSE,
  // While loop
  WHILE,
  // Repeat-until loop
  REPEAT,
  UNTIL,
  // For loop
  FOR,

  ERROR,

  // AbstractStates
  COLON,
  BOXB,
  BBOX,
  COMMA,
  INF,
  TOP,
  BOTTOM
}


export class Token {
  private _type: TokenType;
  private _value: string;

  private tokenTypeToString = [
  // Numeral
  "NUM",
  // Variable
  "VAR",
  // Booleans
  "TRUE",
  "FALSE",

  // Arithmetic operator
  "PLUS",
  "MINUS",
  "STAR",
  "MODULE",
  "SLASH",
  "PPLUS",
  "MMINUS",

  // Binary operators
  "EQ",
  "INEQ",
  "LESS",
  "LESSEQ",
  "MORE",
  "MOREEQ",
  "NOT",
  "AND",
  "OR",

  // Parenthesis and braces
  "BRA",
  "bra",
  "KET",
  "ket",

  // Base cases
  "ASS",
  "SKIP",
  // Concatenation
  "CONC",
  // Conditional
  "IF",
  "THEN",
  "ELSE",
  // While loop
  "WHILE",
  // Repeat-until loop
  "REPEAT",
  "UNTIL",
  // For loop
  "FOR",

  "ERROR",

  // AbstractStates
  "COLON",
  "BOXB",
  "BBOX",
  "COMMA",
  "INF",
  "TOP",
  "BOTTOM"
  ];
  
  constructor(type: TokenType, value: string) {
    this._type = type;
    this._value = value;
  };

  public toString(): string {
    return `${this.tokenTypeToString[this._type]}`;
  }

  public get type(): TokenType { return this._type; }
  public get value(): string { return this._value; }
}
