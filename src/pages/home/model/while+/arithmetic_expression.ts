import { Token } from "../token";
import { AST } from "./ast";

export abstract class ArithmeticExpression extends AST { }

export class ArithmeticBinaryOperator extends ArithmeticExpression {
  constructor(
    public leftOperand: ArithmeticExpression,
    public rightOperand: ArithmeticExpression,
    public operator: Token,
  ) {
    super();
  }

  toString(): string {
    return `(${this.leftOperand.toString()} ${this.operator.value} ${this.rightOperand.toString()})`;
  }

  iter(fn: (expr: AST) => void): void {
    fn(this);
    this.leftOperand.iter(fn);
    this.rightOperand.iter(fn);
  }

  map(fn: (expr: AST) => AST): AST {
    return fn(new ArithmeticBinaryOperator(
      this.leftOperand.map(fn),
      this.rightOperand.map(fn),
      this.operator
    ));
  }
}

export class ArithmeticUnaryOperator extends ArithmeticExpression {
  constructor(
    public operand: ArithmeticExpression,
    public operator: Token,
  ) { super(); }

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

  constructor(
    public value: number,
  ) { super() }

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

  constructor(
    public name: string
  ) { super(); }

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
  
  constructor(
    public variable: Variable,
  ) { super(); }

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
  constructor(
    public variable: Variable,
  ) { super(); }

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
