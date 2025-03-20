import { Token, TokenType } from "../token";
import { ArithmeticBinaryOperator, ArithmeticExpression, Numeral } from "./arithmetic_expression"

export abstract class BooleanExpression {
  abstract negate(): BooleanExpression;
}

export class BooleanBinaryOperator extends BooleanExpression {

  constructor(
    public leftOperand: ArithmeticExpression,
    public rightOperand: ArithmeticExpression,
    public operator: Token,
  ) {
    super();
  };

  canonicalForm(): BooleanBinaryOperator | BooleanConcatenation {
    switch (this.operator.type) {
      case TokenType.LESSEQ:
        return new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            this.leftOperand, this.rightOperand, new Token(TokenType.MINUS, "-")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
      case TokenType.LESS:
        return new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(
              this.leftOperand, this.rightOperand, new Token(TokenType.MINUS, "-")
            ),
            new Numeral(1),
            new Token(TokenType.MINUS, "+")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
      case TokenType.MORE:
        return new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            new ArithmeticBinaryOperator(
              this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-")
            ),
            new Numeral(1),
            new Token(TokenType.MINUS, "+")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
      case TokenType.MOREEQ:
        return new BooleanBinaryOperator(
          new ArithmeticBinaryOperator(
            this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-")
          ),
          new Numeral(0),
          new Token(TokenType.LESSEQ, "<=")
        );
      case TokenType.EQ:
        return new BooleanConcatenation(
          new BooleanBinaryOperator(
            new ArithmeticBinaryOperator(
              this.leftOperand, this.rightOperand, new Token(TokenType.MINUS, "-")
            ),
            new Numeral(0),
            new Token(TokenType.LESSEQ, "<=")
          ),
          new BooleanBinaryOperator(
            new ArithmeticBinaryOperator(
              this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-")
            ),
            new Numeral(0),
            new Token(TokenType.LESSEQ, "<=")
          ),
          new Token(TokenType.AND, "&&")
        )
      case TokenType.INEQ:
        return new BooleanConcatenation(
          new BooleanBinaryOperator(
            new ArithmeticBinaryOperator(
              new ArithmeticBinaryOperator(
                new ArithmeticBinaryOperator(
                  this.leftOperand, this.rightOperand, new Token(TokenType.MINUS, "-")
                ),
                new Numeral(1),
                new Token(TokenType.MORE, "+",)
              ),
              new Numeral(0),
              new Token(TokenType.LESSEQ, "<=",)
            ),
            new Numeral(0),
            new Token(TokenType.LESSEQ, "<=")
          ),
          new BooleanBinaryOperator(
            new ArithmeticBinaryOperator(
              new ArithmeticBinaryOperator(
                new ArithmeticBinaryOperator(
                  this.rightOperand, this.leftOperand, new Token(TokenType.MINUS, "-")
                ),
                new Numeral(1),
                new Token(TokenType.MORE, "+",)
              ),
              new Numeral(0),
              new Token(TokenType.LESSEQ, "<=",)
            ),
            new Numeral(1),
            new Token(TokenType.PLUS, "+")
          ),
          new Token(TokenType.AND, "||")
        )
      default:
        throw Error("Boolean binary operator constructor: impossible build.")
    }
  };

  negate(): BooleanExpression {
    const dic = new Map([
      [TokenType.LESS, TokenType.MOREEQ],
      [TokenType.LESSEQ, TokenType.MORE],
      [TokenType.MORE, TokenType.LESSEQ],
      [TokenType.MOREEQ, TokenType.LESS],
      [TokenType.EQ, TokenType.INEQ],
      [TokenType.INEQ, TokenType.EQ],
    ]);
    if (dic.has(this.operator.type)) {
      return new BooleanBinaryOperator(this.leftOperand, this.rightOperand, new Token(dic.get(this.operator.type) as TokenType, ""));
    }
    throw Error(`Negation of "${this.toString()}": Invalid operator.`)
  }

  toString(): string {
    return `${this.leftOperand.toString()} ${this.operator.value} ${this.rightOperand.toString()}`;
  }
}

export class BooleanConcatenation extends BooleanExpression {
  leftOperand: BooleanExpression;
  rightOperand: BooleanExpression;
  operator: Token;

  constructor(
    leftOperand: BooleanExpression,
    rightOperand: BooleanExpression,
    operator: Token,
  ) {
    super();
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
    this.operator = operator;
  };

  negate(): BooleanExpression {
    const dic = new Map([[TokenType.AND, TokenType.OR], [TokenType.OR, TokenType.AND]]);
    if (dic.has(this.operator.type)) {
      return new BooleanConcatenation(
        this.leftOperand.negate(),
        this.rightOperand.negate(),
        new Token(dic.get(this.operator.type) as TokenType, "")
      );
    }
    throw Error(`Negation of "${this.toString()}": Invalid operator.`)
  }

  toString(): string {
    return `${this.leftOperand.toString()} ${this.operator.value} ${this.rightOperand.toString()}`;
  }

}

export class BooleanUnaryOperator extends BooleanExpression {
  booleanExpression: BooleanExpression;
  operator: Token;

  constructor(booleanExpression: BooleanExpression, operator: Token) {
    super();
    this.booleanExpression = booleanExpression;
    this.operator = operator;
  };
  negate(): BooleanExpression {
    if (this.operator.type === TokenType.NOT) return this.booleanExpression;
    throw Error(`Negation of "${this.toString()}": Invalid operator.`)
  }
  toString(): string {
    return `!(${this.booleanExpression.toString()})`;
  }
}

export class Boolean extends BooleanExpression {
  value: boolean;

  constructor(value: boolean) { super(); this.value = value; };

  negate(): BooleanExpression {
    return new Boolean(!this.value);
  }

  toString(): string {
    return this.value.toString();
  }

}