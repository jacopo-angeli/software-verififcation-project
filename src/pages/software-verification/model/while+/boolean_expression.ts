import { Token, TokenType } from "../token";
import { ArithmeticExpression } from "./arithmetic_expression"

export abstract class BooleanExpression {
  abstract negate(): BooleanExpression;
}

export class BooleanBinaryOperator extends BooleanExpression {
  leftOperand: ArithmeticExpression;
  rightOperand: ArithmeticExpression;
  operator: Token;

  constructor(
    leftOperand: ArithmeticExpression,
    rightOperand: ArithmeticExpression,
    operator: Token,
  ) {
    super();
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
    this.operator = operator;
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