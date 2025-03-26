import { Token } from "../token";

export abstract class ArithmeticExpression {
  abstract map(fn: (expr: ArithmeticExpression) => ArithmeticExpression): ArithmeticExpression;
  abstract iter(fn: (expr: ArithmeticExpression) => void): void;
}

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
  }

  toString(): string {
    return `(${this.leftOperand.toString()} ${this.operator.value} ${this.rightOperand.toString()})`;
  }

  map(fn: (expr: ArithmeticExpression) => ArithmeticExpression): ArithmeticExpression {
    return fn(new ArithmeticBinaryOperator(
      this.leftOperand.map(fn),
      this.rightOperand.map(fn),
      this.operator
    ));
  }
  iter(fn: (expr: ArithmeticExpression) => void): void {
    fn(this);
    this.leftOperand.iter(fn);
    this.rightOperand.iter(fn);
  }
}

export class ArithmeticUnaryOperator extends ArithmeticExpression {
  operand: ArithmeticExpression;
  operator: Token;

  constructor(
    operand: ArithmeticExpression,
    operator: Token,
  ) {
    super();
    this.operand = operand;
    this.operator = operator;
  }

  toString(): string {
    return `(${this.operator.value}${this.operand.toString()})`;
  }

  map(fn: (expr: ArithmeticExpression) => ArithmeticExpression): ArithmeticExpression {
    return fn(new ArithmeticUnaryOperator(this.operand.map(fn), this.operator));
  }

  iter(fn: (expr: ArithmeticExpression) => void): void {
    fn(this);
    this.operand.iter(fn);
  }
}

export class Numeral extends ArithmeticExpression {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  toString(): string {
    return this.value.toString();
  }

  map(fn: (expr: ArithmeticExpression) => ArithmeticExpression): ArithmeticExpression {
    return fn(new Numeral(this.value));
  }
  iter(fn: (expr: ArithmeticExpression) => void): void {
    fn(this);
  }
}

export class Variable extends ArithmeticExpression {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  toString(): string {
    return this.name;
  }

  map(fn: (expr: ArithmeticExpression) => ArithmeticExpression): ArithmeticExpression {
    return fn(new Variable(this.name));
  }

  iter(fn: (expr: ArithmeticExpression) => void): void {
    fn(this);
  }
}

export class IncrementOperator extends ArithmeticExpression {
  variable: Variable;

  constructor(
    variable: Variable,
  ) {
    super();
    this.variable = variable;
  }

  toString(): string {
    return `${this.variable.name}++`;
  }

  map(fn: (expr: ArithmeticExpression) => ArithmeticExpression): ArithmeticExpression {
    return fn(new IncrementOperator(this.variable.map(fn) as Variable));
  }

  iter(fn: (expr: ArithmeticExpression) => void): void {
    fn(this);
    this.variable.iter(fn);
  }
}

export class DecrementOperator extends ArithmeticExpression {
  variable: Variable;

  constructor(
    variable: Variable,
  ) {
    super();
    this.variable = variable;
  }

  toString(): string {
    return `${this.variable.name}--`;
  }

  map(fn: (expr: ArithmeticExpression) => ArithmeticExpression): ArithmeticExpression {
    return fn(new DecrementOperator(this.variable.map(fn) as Variable));
  }

  iter(fn: (expr: ArithmeticExpression) => void): void {
    fn(this);
    this.variable.iter(fn);
  }
}
