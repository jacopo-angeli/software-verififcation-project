import { Token, TokenType } from "../token";
import { ArithmeticBinaryOperator, ArithmeticExpression, Numeral } from "./arithmetic_expression";
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
    public left: ArithmeticExpression | BooleanExpression,
    public right: ArithmeticExpression | BooleanExpression,
    public operator: Token
  ) {
    super();
    if ([TokenType.AND, TokenType.OR].includes(operator.type)) {
      if (!(left instanceof BooleanExpression && right instanceof BooleanExpression)) {
        throw Error(`BooleanBinaryOperator construction constraints violated (${left},${right}, ${operator})`)
      }
    } else {
      if (left instanceof BooleanExpression || right instanceof BooleanExpression) {
        throw Error(`BooleanBinaryOperator construction constraints violated (${left},${right}, ${operator})`)
      }
    }
  }
  public concatenation(): boolean {
    return this.left instanceof BooleanExpression && this.right instanceof BooleanExpression;
  }
  eleq0(): void {
    const eleqForm = (expr: BooleanBinaryOperator): boolean => {
      return expr.left instanceof ArithmeticExpression && expr.right instanceof Numeral && expr.right.value === 0 && expr.operator.type === TokenType.LESSEQ;
    }
    if (eleqForm(this)) {
      if (this.left instanceof BooleanExpression && this.right instanceof BooleanExpression) {
        this.left.eleq0()
        this.right.eleq0()
      }
      return;
    }
    switch (this.operator.type) {
      case TokenType.LESSEQ:
        this.left = new ArithmeticBinaryOperator(
          this.left,
          this.right,
          new Token(TokenType.MINUS, "-")
        );
        break;
      case TokenType.LESS:
        if (this.right instanceof Numeral && this.right.value === 0) {
          this.left = new ArithmeticBinaryOperator(
            this.left,
            new Numeral(1),
            new Token(TokenType.PLUS, "+")
          );
        } else {
          this.left = new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(
              this.left,
              this.right,
              new Token(TokenType.PLUS, "-")
            ),
            new Numeral(1),
            new Token(TokenType.PLUS, "+")
          );
        }
        break;
      case TokenType.MORE:
        this.left = new ArithmeticBinaryOperator(
          new ArithmeticBinaryOperator(this.right, this.left, new Token(TokenType.MINUS, "-")),
          new Numeral(1),
          new Token(TokenType.PLUS, "+")
        );
        break;
      case TokenType.MOREEQ:
        this.left = new ArithmeticBinaryOperator(this.right, this.left, new Token(TokenType.MINUS, "-"));
        break;
      case TokenType.EQ:
        this.left = new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            this.left,
            this.right,
            new Token(TokenType.MINUS, "-")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
        this.right = new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(this.right, this.left, new Token(TokenType.MINUS, "-")),
            new Numeral(0),
            new Token(TokenType.PLUS, "+")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
        this.operator = new Token(TokenType.AND, "&&");
        break;
      case TokenType.INEQ:
        this.left = new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(this.right, this.left, new Token(TokenType.MINUS, "-")),
            new Numeral(1),
            new Token(TokenType.PLUS, "+")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
        this.right = new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(this.left, this.right, new Token(TokenType.MINUS, "-")),
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

    this.right = new Numeral(0);
    this.operator = new Token(TokenType.LESSEQ, "<=")
  }

  negate(): BooleanExpression {
    this.eleq0();
    if (this.operator.type === TokenType.LESSEQ) {
      let result = new BooleanBinaryOperator(
        this.left,
        this.right,
        new Token(TokenType.MORE, ">")
      );
      result.eleq0();
      return result;
    }

    const negationMap = new Map([
      [TokenType.AND, { token: TokenType.OR, value: "||" }],
      [TokenType.OR, { token: TokenType.AND, value: "&&" }]
    ]);

    if (negationMap.has(this.operator.type)) {
      let ret = new BooleanBinaryOperator((this.left as BooleanExpression).negate(), (this.right as BooleanExpression).negate(), new Token(negationMap.get(this.operator.type)?.token as TokenType, negationMap.get(this.operator.type)?.value as string));
      return ret;
    }

    throw new Error(`Negation of "${this.toString()}": Invalid operator.`);
  }

  toString(): string {
    return `${this.left.toString()} ${this.operator.value} ${this.right.toString()}`;
  }

  map(fn: (node: AST) => AST): AST {
    return fn(
      new BooleanBinaryOperator(this.left, this.right, this.operator)
    );
  }

  iter(fn: (node: AST) => void): void {
    fn(this);
    this.left instanceof BooleanExpression && this.left.iter(fn);
    this.right instanceof BooleanExpression && this.right.iter(fn);
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
