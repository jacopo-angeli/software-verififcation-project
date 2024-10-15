import { Token } from "../token";

export abstract class ArithmeticExpression { }

export class ArithmeticBinaryOperator extends ArithmeticExpression {
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
    return `(${this.leftOperand.toString()} ${this.operator.value} ${this.rightOperand.toString()})`;
  }
}

export class ArithmeticUnaryOperator extends ArithmeticExpression{
  operand: ArithmeticExpression;
  operator: Token;
  constructor(
    operand: ArithmeticExpression,
    operator: Token,
  ) {
    super();
    this.operand = operand;
    this.operator = operator;
  };

  toString(): string {
    return `(${this.operator.value}${this.operand.toString()})`;
  }
}

export class Numeral extends ArithmeticExpression {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  };

  toString(): string {
    return this.value.toString();
  }
}

export class Variable extends ArithmeticExpression {
  name: string;

  constructor(name: string) { super(); this.name = name; };

  toString(): string {
    return this.name;
  }
}