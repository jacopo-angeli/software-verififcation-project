import { Token } from "../token";
import { ArithmeticExpression } from "./arithmetic_expression"

export abstract class BooleanExpression { }

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

  toString(): string {
    return `!(${this.booleanExpression.toString()})`;
  }
}

export class Boolean extends BooleanExpression {
  value: boolean;

  constructor(value: boolean) { super(); this.value = value; };

  toString(): string {
    return this.value.toString();
  }

}