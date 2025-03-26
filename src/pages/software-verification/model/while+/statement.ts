import { ArithmeticExpression, Variable } from "./arithmetic_expression";
import { BooleanExpression } from "./boolean_expression";

export abstract class Statement {
  preCondition: string | undefined;
  postCondition: string | undefined;

  public setPreCondition(c: string) { this.preCondition = c; }
  public setPostCondition(c: string) { this.postCondition = c; }

  protected static indent(level: number): string {
    return ' '.repeat(level * 2);
  }
  public abstract annotatedProgram(level: number): string;

  abstract iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void;
}

export class Assignment extends Statement {
  public annotatedProgram(level: number): string {
    return `${Statement.indent(level)}${this.preCondition}\n${Statement.indent(level)}${this.variable.name}=${this.value.toString()};\n${Statement.indent(level)}${this.postCondition}\n`;
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
    return `${Statement.indent(level)}skip;\n`;
  }
  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
  }
}

export class Concatenation extends Statement {
  public annotatedProgram(level: number): string {
    return `${this.firstStatement.annotatedProgram(level)};${this.secondStatement.annotatedProgram(level)};`;
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
  public annotatedProgram(level: number): string {
    return `${Statement.indent(level)}${this.preCondition}\nif(${this.guard.toString()})then{\n${this.thenBranch.annotatedProgram(level + 1)}\n${Statement.indent(level)}} else {${this.elseBranch.annotatedProgram(level + 1)}\n${Statement.indent(level)}}${Statement.indent(level)}${this.postCondition}\n`;
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
  public annotatedProgram(level: number): string {
    return `${Statement.indent(level)}${this.preCondition}\nwhile(${this.guard.toString()}){\n${Statement.indent(level)}${this.body.annotatedProgram(level+1)}\n${Statement.indent(level)}} \n${Statement.indent(level)}${this.postCondition}\n`;
  }
  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }
}

export class RepeatUntilLoop extends Loop {
  public annotatedProgram(level: number): string {
    return `${Statement.indent(level)}${this.preCondition}\nrepeat{\n${Statement.indent(level)}${this.body.annotatedProgram(level+1)}\n${Statement.indent(level)}}until(${this.guard.toString()})\n${Statement.indent(level)}${this.postCondition}\n`;
  }
  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }
}

export class ForLoop extends Loop {
  public annotatedProgram(level: number): string {
    return `${Statement.indent(level)}${this.preCondition}\n for(${this.initialStatement.toString()};${this.guard.toString()};${this.incrementStatement.toString()}){\n${this.body.annotatedProgram(level+1)}\n${Statement.indent(level)} \n${Statement.indent(level)}${this.postCondition}\n`;
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
