import { ArithmeticExpression, Variable } from "./arithmetic_expression";
import { AST } from "./ast";
import { BooleanExpression } from "./boolean_expression";

export abstract class Statement extends AST {
  constructor(
    public pre?: string,
    public post?: string,
  ) { super() }
  protected static tab(level: number = 0): string {
    return ' '.repeat(level * 2);
  }
  abstract annotatedProgram(level: number): string;
}

export class Assignment extends Statement {
  constructor(
    public variable: Variable,
    public value: ArithmeticExpression) {
    super();
  }
  public annotatedProgram(level: number = 0): string {
    return `${Statement.tab(level)}${this.variable.name}=${this.value}`;
  }
  iter(fn: (node: AST) => void): void {
    fn(this);
    this.variable.iter(fn);
    this.value.iter(fn);
  }
  map(fn: (node: AST) => AST): AST {
    return fn(new Assignment(
      this.variable.map(fn) as Variable,
      this.value.map(fn) as ArithmeticExpression
    ));
  }
}

export class Skip extends Statement {
  public annotatedProgram(level: number = 0): string {
    return `${Statement.tab(level)}skip`;
  }
  iter(fn: (node: AST) => void): void {
    fn(this);
  }
  map(fn: (node: AST) => AST): AST {
    return fn(new Skip());
  }
}

export class Concatenation extends Statement {
  constructor(
    public f: Statement,
    public g: Statement) {
    super();
  }
  public annotatedProgram(level: number = 0): string {
    return `${this.f.annotatedProgram(level)};\n${this.g.annotatedProgram(level)}`;
  }
  iter(fn: (node: AST) => void): void {
    fn(this);
    this.f.iter(fn);
    this.g.iter(fn);
  }
  map(fn: (node: AST) => AST): AST {
    return fn(new Concatenation(
      this.f.map(fn) as Statement,
      this.g.map(fn) as Statement
    ));
  }
}

export class IfThenElse extends Statement {
  constructor(
    public guard: BooleanExpression,
    public thenB: Statement,
    public elseB: Statement
  ) { super(); }

  public annotatedProgram(level: number = 0): string {
    return `${Statement.tab(level)}if(${this.guard.toString()})then{\n${this.thenB.annotatedProgram(level + 1)}\n${Statement.tab(level)}}else{\n${this.elseB.annotatedProgram(level + 1)}\n${Statement.tab(level)}}`;
  }

  iter(fn: (node: AST) => void): void {
    fn(this);
    this.guard.iter(fn);
    this.thenB.iter(fn);
    this.elseB.iter(fn);
  }

  map(fn: (node: AST) => AST): AST {
    return fn(new IfThenElse(
      this.guard.map(fn) as BooleanExpression,
      this.thenB.map(fn) as Statement,
      this.elseB.map(fn) as Statement
    ));
  }

}

export abstract class Loop extends Statement {
  constructor(
    public body: Statement,
    public guard: BooleanExpression,
    public inv?: string,
  ) { super(); }
}

export class WhileLoop extends Loop {
  public annotatedProgram(level: number = 0): string {
    return `${Statement.tab(level)}//${this.pre}\n${Statement.tab(level)}while(${this.guard.toString()}){\n${Statement.tab(level + 1)}//${this.inv}\n${this.body.annotatedProgram(level + 1)}\n${Statement.tab(level)}}\n${Statement.tab(level)}//${this.post}`;
  }

  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }

  map(fn: (node: AST) => AST): AST {
    return fn(new WhileLoop(
      this.body.map(fn) as Statement,
      this.guard.map(fn) as BooleanExpression
    ));
  }
}

export class RepeatUntilLoop extends Loop {
  public annotatedProgram(level: number = 0): string {
    return `${Statement.tab(level)}${this.pre}\n${Statement.tab(level)}repeat{\n${this.body.annotatedProgram(level + 1)}\n${Statement.tab(level)}${Statement.tab(level + 1)}${this.inv}\n}until(${this.guard.toString()})\n${Statement.tab(level)}${this.post}`;
  }

  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }

  map(fn: (node: AST) => AST): AST {
    return fn(new RepeatUntilLoop(
      this.body.map(fn) as Statement,
      this.guard.map(fn) as BooleanExpression
    ));
  }
}

export class ForLoop extends Loop {
  constructor(
    body: Statement,
    guard: BooleanExpression,
    public initialStatement: Statement,
    public incrementStatement: Statement,
  ) { super(body, guard); }

  public annotatedProgram(level: number = 0): string {
    return `${Statement.tab(level)}${this.pre}\n${Statement.tab(level)}for(${this.initialStatement.annotatedProgram(0)};${this.guard.toString()};${this.incrementStatement.annotatedProgram(0)}){\n${Statement.tab(level + 1)}${this.inv}\n${this.body.annotatedProgram(level + 1)}\n${Statement.tab(level)}}\n${Statement.tab(level)}${this.post}`;
  }

  iter(fn: (node: Statement | ArithmeticExpression | BooleanExpression) => void): void {
    fn(this);
    this.initialStatement.iter(fn);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
    this.incrementStatement.iter(fn);
  }

  map(fn: (node: AST) => AST): AST {
    return fn(new ForLoop(
      this.body.map(fn) as Statement,
      this.guard.map(fn) as BooleanExpression,
      this.initialStatement.map(fn) as Statement,
      this.incrementStatement.map(fn) as Statement
    ));
  }
}
