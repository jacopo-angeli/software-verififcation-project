import { ArithmeticExpression, Variable } from "./arithmetic_expression";
import { BooleanExpression } from "./boolean_expression";

export abstract class Statement {
  preCondition: string | undefined;
  postCondition: string | undefined;

  public setPreCondition(c: string) { this.preCondition = c; }
  public setPostCondition(c: string) { this.postCondition = c; }

  protected indent(level: number = 0): string {
    return ' '.repeat(level * 2);
  }
  public annotatedProgram(level: number = 0): string { throw Error('Abstract class object cannot exists.') };

  abstract iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void;
}

export class Assignment extends Statement {
  public annotatedProgram(level: number = 0): string {
    return `${this.indent(level)}${this.variable.name}=${this.value}`;
  }
  constructor(public variable: Variable, public value: ArithmeticExpression) {
    super();
  }

  // Apply the function to this statement and its components
  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.variable.iter(fn);
    this.value.iter(fn);
  }
}

export class Skip extends Statement {
  public annotatedProgram(level: number = 0): string {
    return `${this.indent(level)}skip`;
  }
  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
  }
}

export class Concatenation extends Statement {
  public annotatedProgram(level: number = 0): string {
    return `${this.firstStatement.annotatedProgram(level)};\n${this.secondStatement.annotatedProgram(level)}`;
  }
  constructor(public firstStatement: Statement, public secondStatement: Statement) {
    super();
  }

  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.firstStatement.iter(fn);
    this.secondStatement.iter(fn);
  }
}

export class IfThenElse extends Statement {
  public annotatedProgram(level: number = 0): string {
    return `${this.indent(level)}if(${this.guard.toString()})then{\n${this.thenBranch.annotatedProgram(level + 1)}\n${this.indent(level)}}else{\n${this.elseBranch.annotatedProgram(level + 1)}\n${this.indent(level)}}`;
  }
  constructor(
    public guard: BooleanExpression,
    public thenBranch: Statement,
    public elseBranch: Statement
  ) {
    super();
  }

  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.thenBranch.iter(fn);
    this.elseBranch.iter(fn);
  }
}

export abstract class Loop extends Statement {
  invariant: string | undefined;
  constructor(public body: Statement, public guard: BooleanExpression) {
    super();
  }
  public setInvariant(c: string) { this.invariant = c; }

  // Body iter function
  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }
}

export class WhileLoop extends Loop {
  public annotatedProgram(level: number = 0): string {
    return `${this.indent(level)}//pre:${this.preCondition}\n${this.indent(level)}while(${this.guard.toString()}){\n${this.indent(level + 1)}//inv:${this.invariant}\n${this.body.annotatedProgram(level + 1)}\n${this.indent(level+1)}//post:${this.postCondition}\n${this.indent(level)}}`;
  }
  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }
}

export class RepeatUntilLoop extends Loop {
  public annotatedProgram(level: number = 0): string {
    return `${this.indent(level)}//pre:${this.preCondition}\n${this.indent(level)}repeat{\n${this.body.annotatedProgram(level + 1)}\n${this.indent(level)}${this.indent(level + 1)}//inv:${this.invariant}\n}until(${this.guard.toString()})\n${this.indent(level)}//post:${this.postCondition}`;
  }
  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }
}

export class ForLoop extends Loop {
  public annotatedProgram(level: number = 0): string {
    return `${this.indent(level)}//pre:${this.preCondition}\n${this.indent(level)}for(${this.initialStatement.annotatedProgram()};${this.guard.toString()};${this.incrementStatement.annotatedProgram()}){\n${this.indent(level + 1)}//inv:${this.invariant}\n${this.body.annotatedProgram(level + 1)}\n${this.indent(level)}}\n${this.indent(level)}//post:${this.postCondition}`;
  }
  constructor(
    body: Statement,
    guard: BooleanExpression,
    public initialStatement: Statement,
    public incrementStatement: Statement
  ) {
    super(body, guard);
  }

  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.initialStatement.iter(fn);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
    this.incrementStatement.iter(fn);
  }
}
