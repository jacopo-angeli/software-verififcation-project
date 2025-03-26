import { Token, TokenType } from "../token";
import { ArithmeticBinaryOperator, ArithmeticExpression, Numeral } from "./arithmetic_expression";

/**
 * Abstract class representing a boolean expression.
 */
export abstract class BooleanExpression {
  /**
   * Returns the negation of the boolean expression.
   */
  abstract negate(): BooleanExpression;
  
  /**
   * Converts the boolean expression to its canonical form.
   */
  abstract canonicalForm(): BooleanExpression;

  /**
   * Recursively applies a transformation function to all subexpressions.
   * @param fn The transformation function.
   */
  abstract map(fn: (expr: BooleanExpression) => BooleanExpression): BooleanExpression;

  /**
   * Recursively applies an iteration function to all subexpressions.
   * @param fn The iteration function.
   */
  abstract iter(fn: (expr: BooleanExpression) => void): void;
}

/**
 * Represents a binary boolean operator (e.g., <, <=, >, >=, ==, !=).
 */
export class BooleanBinaryOperator extends BooleanExpression {
  constructor(
    public leftOperand: ArithmeticExpression,
    public rightOperand: ArithmeticExpression,
    public operator: Token
  ) {
    super();
  }

  canonicalForm(): BooleanExpression {
    switch (this.operator.type) {
      case TokenType.LESSEQ:
        return this.createCanonicalForm(this.leftOperand, this.rightOperand, "-");
      case TokenType.LESS:
        return this.createCanonicalForm(
          new ArithmeticBinaryOperator(this.leftOperand, this.rightOperand, new Token(TokenType.MINUS, "-")),
          new Numeral(1),
          "-"
        );
      case TokenType.MORE:
        return this.createCanonicalForm(
          new ArithmeticBinaryOperator(this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-")),
          new Numeral(1),
          "-"
        );
      case TokenType.MOREEQ:
        return this.createCanonicalForm(this.rightOperand, this.leftOperand, "-");
      case TokenType.EQ:
        return new BooleanConcatenation(
          this.createCanonicalForm(this.leftOperand, this.rightOperand, "-"),
          this.createCanonicalForm(this.rightOperand, this.leftOperand, "-"),
          new Token(TokenType.AND, "&&")
        );
      case TokenType.INEQ:
        return new BooleanConcatenation(
          this.createCanonicalForm(
            new ArithmeticBinaryOperator(
              new ArithmeticBinaryOperator(
                this.leftOperand,
                this.rightOperand,
                new Token(TokenType.MINUS, "-")
              ),
              new Numeral(1),
              new Token(TokenType.MORE, "+")
            ),
            new Numeral(0),
            "<="
          ),
          this.createCanonicalForm(
            new ArithmeticBinaryOperator(
              new ArithmeticBinaryOperator(
                this.rightOperand,
                this.leftOperand,
                new Token(TokenType.MINUS, "-")
              ),
              new Numeral(1),
              new Token(TokenType.MORE, "+")
            ),
            new Numeral(1),
            "+"
          ),
          new Token(TokenType.OR, "||")
        );
      default:
        throw new Error("BooleanBinaryOperator: Invalid operator type.");
    }
  }

  private createCanonicalForm(left: ArithmeticExpression, right: ArithmeticExpression, op: string): BooleanExpression {
    return new BooleanBinaryOperator(
      new ArithmeticBinaryOperator(left, right, new Token(TokenType.MINUS, op)),
      new Numeral(0),
      new Token(TokenType.LESSEQ, "<=")
    );
  }

  negate(): BooleanExpression {
    const negationMap = new Map([
      [TokenType.LESS, TokenType.MOREEQ],
      [TokenType.LESSEQ, TokenType.MORE],
      [TokenType.MORE, TokenType.LESSEQ],
      [TokenType.MOREEQ, TokenType.LESS],
      [TokenType.EQ, TokenType.INEQ],
      [TokenType.INEQ, TokenType.EQ]
    ]);

    if (negationMap.has(this.operator.type)) {
      return new BooleanBinaryOperator(this.leftOperand, this.rightOperand, new Token(negationMap.get(this.operator.type)!, ""));
    }

    throw new Error(`Negation of "${this.toString()}": Invalid operator.`);
  }

  toString(): string {
    return `${this.leftOperand.toString()} ${this.operator.value} ${this.rightOperand.toString()}`;
  }

  map(fn: (expr: BooleanExpression) => BooleanExpression): BooleanExpression {
    return fn(
      new BooleanBinaryOperator(this.leftOperand, this.rightOperand, this.operator)
    );
  }

  iter(fn: (expr: BooleanExpression) => void): void {
    fn(this);
    this.leftOperand instanceof BooleanExpression && this.leftOperand.iter(fn);
    this.rightOperand instanceof BooleanExpression && this.rightOperand.iter(fn);
  }
}

/**
 * Represents a boolean concatenation (AND, OR) between boolean expressions.
 */
export class BooleanConcatenation extends BooleanExpression {
  constructor(
    public leftOperand: BooleanExpression,
    public rightOperand: BooleanExpression,
    public operator: Token
  ) {
    super();
  }

  negate(): BooleanExpression {
    const negationMap = new Map([
      [TokenType.AND, TokenType.OR],
      [TokenType.OR, TokenType.AND]
    ]);
    if (negationMap.has(this.operator.type)) {
      return new BooleanConcatenation(
        this.leftOperand.negate(),
        this.rightOperand.negate(),
        new Token(negationMap.get(this.operator.type)!, "")
      );
    }
    throw new Error(`Negation of "${this.toString()}": Invalid operator.`);
  }

  canonicalForm(): BooleanExpression {
    return new BooleanConcatenation(this.leftOperand.canonicalForm(), this.rightOperand.canonicalForm(), this.operator);
  }

  map(fn: (expr: BooleanExpression) => BooleanExpression): BooleanExpression {
    return fn(
      new BooleanConcatenation(this.leftOperand.map(fn), this.rightOperand.map(fn), this.operator)
    );
  }

  iter(fn: (expr: BooleanExpression) => void): void {
    fn(this);
    this.leftOperand.iter(fn);
    this.rightOperand.iter(fn);
  }
}

/**
 * Represents a unary boolean operator (e.g., NOT).
 */
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

  canonicalForm(): BooleanExpression {
    return new BooleanUnaryOperator(this.booleanExpression.canonicalForm(), this.operator);
  }

  map(fn: (expr: BooleanExpression) => BooleanExpression): BooleanExpression {
    return fn(new BooleanUnaryOperator(this.booleanExpression.map(fn), this.operator));
  }

  iter(fn: (expr: BooleanExpression) => void): void {
    fn(this);
    this.booleanExpression.iter(fn);
  }
}

/**
 * Represents a boolean constant (true/false).
 */
export class Boolean extends BooleanExpression {
  constructor(public value: boolean) {
    super();
  }

  negate(): BooleanExpression {
    return new Boolean(!this.value);
  }

  canonicalForm(): BooleanExpression {
    return new Boolean(this.value);
  }

  map(fn: (expr: BooleanExpression) => BooleanExpression): BooleanExpression {
    return fn(new Boolean(this.value));
  }

  iter(fn: (expr: BooleanExpression) => void): void {
    fn(this);
  }
}
