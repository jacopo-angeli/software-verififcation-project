import { Token, TokenType } from "../token";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, Numeral } from "./arithmetic_expression";
import { AST } from "./ast";

export abstract class BooleanExpression extends AST {
  abstract negate(): BooleanExpression;
  abstract eleq0(): void;
}

/**
 * Represents a binary boolean operator (e.g., <, <=, >, >=, ==, !=).
 */
export class BooleanBinaryOperator extends BooleanExpression {
  constructor(
    public leftOperand: ArithmeticExpression | BooleanExpression,
    public rightOperand: ArithmeticExpression | BooleanExpression,
    public operator: Token
  ) {
    super();
    if ([TokenType.AND, TokenType.OR].includes(operator.type)) {
      if (!(leftOperand instanceof BooleanExpression && rightOperand instanceof BooleanExpression)) {
        throw Error(`BooleanBinaryOperator construction constraints violated (${leftOperand},${rightOperand}, ${operator})`)
      }
    } else {
      if (leftOperand instanceof BooleanExpression || rightOperand instanceof BooleanExpression) {
        throw Error(`BooleanBinaryOperator construction constraints violated (${leftOperand},${rightOperand}, ${operator})`)
      }
    }
  }
  public concatenation(): boolean {
    return this.leftOperand instanceof BooleanExpression && this.rightOperand instanceof BooleanExpression;
  }
  eleq0(): void {
    const eleqForm = (expr: BooleanBinaryOperator): boolean => {
      return expr.leftOperand instanceof ArithmeticExpression && expr.rightOperand instanceof Numeral && expr.rightOperand.value === 0 && expr.operator.type === TokenType.LESSEQ;
    }
    if (eleqForm(this)) {
      if (this.leftOperand instanceof BooleanExpression && this.rightOperand instanceof BooleanExpression) {
        this.leftOperand.eleq0()
        this.rightOperand.eleq0()
      }
      return;
    }
    switch (this.operator.type) {
      case TokenType.LESSEQ:
        this.leftOperand = new ArithmeticBinaryOperator(
          this.leftOperand,
          this.rightOperand,
          new Token(TokenType.MINUS, "-")
        );
        break;
      case TokenType.LESS:
        this.leftOperand = new ArithmeticBinaryOperator(
          new ArithmeticBinaryOperator(this.leftOperand, this.rightOperand, new Token(TokenType.MINUS, "-")),
          new Numeral(1),
          new Token(TokenType.PLUS, "+")
        );
        break;
      case TokenType.MORE:
        this.leftOperand = new ArithmeticBinaryOperator(
          new ArithmeticBinaryOperator(this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-")),
          new Numeral(1),
          new Token(TokenType.PLUS, "+")
        );
        break;
      case TokenType.MOREEQ:
        this.leftOperand = new ArithmeticBinaryOperator(this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-"));
        break;
      case TokenType.EQ:
        this.leftOperand = new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            this.leftOperand,
            this.rightOperand,
            new Token(TokenType.MINUS, "-")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
        this.rightOperand = new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-")),
            new Numeral(0),
            new Token(TokenType.PLUS, "+")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
        this.operator = new Token(TokenType.AND, "&&");
        break;
      case TokenType.INEQ:
        this.leftOperand = new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-")),
            new Numeral(1),
            new Token(TokenType.PLUS, "+")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
        this.rightOperand = new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(this.leftOperand, this.rightOperand, new Token(TokenType.MINUS, "-")),
            new Numeral(1),
            new Token(TokenType.PLUS, "+")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
        this.operator = new Token(TokenType.OR, "||")
        break;
      default:
        throw new Error("BooleanBinaryOperator: Invalid operator type.");
    }

    this.rightOperand = new Numeral(0);
    this.operator = new Token(TokenType.LESSEQ, "<=")
  }

  negate(): BooleanExpression {
    var negationMap = new Map([
      [TokenType.LESS, { token: TokenType.MOREEQ, value: ">=" }],
      [TokenType.LESSEQ, { token: TokenType.MORE, value: ">" }],
      [TokenType.MORE, { token: TokenType.LESSEQ, value: "<=" }],
      [TokenType.MOREEQ, { token: TokenType.LESS, value: "<" }],
      [TokenType.EQ, { token: TokenType.INEQ, value: "!=" }],
      [TokenType.INEQ, { token: TokenType.EQ, value: "==" }],
    ]);
    this.eleq0();
    if (this.operator.type === TokenType.LESSEQ)
      return new BooleanBinaryOperator(
        new ArithmeticUnaryOperator(
          this.leftOperand,
          new Token(TokenType.MINUS, "-")
        ),
        new Numeral(0),
        new Token(TokenType.LESSEQ, "<=")
      )

    negationMap = new Map([
      [TokenType.AND, { token: TokenType.OR, value: "||" }],
      [TokenType.OR, { token: TokenType.AND, value: "&&" }]
    ]);

    if (negationMap.has(this.operator.type)) {
      let ret = new BooleanBinaryOperator((this.leftOperand as BooleanExpression).negate(), (this.rightOperand as BooleanExpression).negate(), new Token(negationMap.get(this.operator.type)?.token as TokenType, negationMap.get(this.operator.type)?.value as string));
      return ret;
    }

    throw new Error(`Negation of "${this.toString()}": Invalid operator.`);
  }

  toString(): string {
    return `${this.leftOperand.toString()} ${this.operator.value} ${this.rightOperand.toString()}`;
  }

  map(fn: (node: AST) => AST): AST {
    return fn(
      new BooleanBinaryOperator(this.leftOperand, this.rightOperand, this.operator)
    );
  }

  iter(fn: (node: AST) => void): void {
    fn(this);
    this.leftOperand instanceof BooleanExpression && this.leftOperand.iter(fn);
    this.rightOperand instanceof BooleanExpression && this.rightOperand.iter(fn);
  }
}

export class BooleanUnaryOperator extends BooleanExpression {
  constructor(
    public booleanExpression: BooleanExpression,
    public operator: Token
  ) {
    super();
  }

  negate(): BooleanExpression {
    if (this.operator.type === TokenType.NOT) return this.booleanExpression;
    throw new Error(`Negation of "${this.toString()}": Invalid operator.`);
  }

  eleq0(): void {
    this.booleanExpression.eleq0();
  }

  map(fn: (node: AST) => AST): AST {
    return fn(new BooleanUnaryOperator(this.booleanExpression.map(fn) as BooleanExpression, this.operator));
  }

  iter(fn: (node: AST) => void): void {
    fn(this);
    this.booleanExpression.iter(fn);
  }
}

export class Boolean extends BooleanExpression {
  constructor(public value: boolean) {
    super();
  }

  negate(): BooleanExpression {
    return new Boolean(!this.value);
  }

  eleq0(): void { }

  map(fn: (node: AST) => AST): AST {
    return fn(new Boolean(this.value));
  }

  iter(fn: (node: AST) => void): void {
    fn(this);
  }
}
