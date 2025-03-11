import { IntervalAbstractProgramState } from "../../components/SecondAssignment/logic/IntervalDomain/types/state";
import { ArithmeticExpression, Variable } from "./arithmetic_expression";
import { BooleanExpression } from "./boolean_expression";


export abstract class Statement {
  preCondition: IntervalAbstractProgramState | undefined;
  postCondition: IntervalAbstractProgramState | undefined;


  public setPreCondition(c: IntervalAbstractProgramState) { this.preCondition = c; }
  public setPostCondition(c: IntervalAbstractProgramState) { this.postCondition = c; }
  protected indent(level: number = 0): string {
    return ' '.repeat(level * 2);
  }
  toAnnotatedProgram(level: number = 0): string { throw Error('Abstract class object cannot exists.') };
}

export class Assignment extends Statement {
  variable: Variable;
  value: ArithmeticExpression;

  constructor(
    variable: Variable,
    value: ArithmeticExpression,
  ) {
    super();
    this.variable = variable;
    this.value = value;
  };

  toString(): string {
    return `s[${this.variable.toString()} -> A[${this.value.toString()}]s]`;
  }

  toAnnotatedProgram(level: number = 0): string {
    return `${this.indent(level)}${this.variable.name}=${this.value}`;
  }

}

export class Skip extends Statement {
  toString(): string {
    return "id";
  }
  toAnnotatedProgram(level: number = 0): string {
    return `${this.indent(level)}skip`;
  }
}

export class Concatenation extends Statement {
  firstStatement: Statement;
  secondStatement: Statement;

  constructor(firstStatement: Statement, secondStatement: Statement) {
    super();
    this.firstStatement = firstStatement;
    this.secondStatement = secondStatement;
  };

  toString(): string {
    return `${this.secondStatement.toString()} ∘ ${this.firstStatement.toString()}`;
  }

  toAnnotatedProgram(level: number = 0): string {
    return `${this.firstStatement.toAnnotatedProgram(level)};\n${this.secondStatement.toAnnotatedProgram(level)}`;
  }
}

export class IfThenElse extends Statement {
  guard: BooleanExpression;
  thenBranch: Statement;
  elseBranch: Statement;

  constructor(

    guard: BooleanExpression,
    thenBranch: Statement,
    elseBranch: Statement,
  ) {
    super();
    this.guard = guard;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  };

  toString(): string {
    return `cond( B[${this.guard.toString()}]s, Sds[${this.thenBranch.toString()}]s, Sds[${this.elseBranch.toString()}]s )`;
  }

  toAnnotatedProgram(level: number = 0): string {
    return `${this.indent(level)}if(${this.guard.toString()})then{\n${this.thenBranch.toAnnotatedProgram(level + 1)}\n${this.indent(level)}}else{\n${this.elseBranch.toAnnotatedProgram(level + 1)}\n${this.indent(level)}}`;
  }
}

export abstract class Loop extends Statement {
  body: Statement;
  guard: BooleanExpression;
  invariant: IntervalAbstractProgramState | undefined;

  constructor(body: Statement, guard: BooleanExpression) {
    super();
    this.body = body;
    this.guard = guard;
  };

  public setInvariant(c: IntervalAbstractProgramState) { this.invariant = c; }
}

export class WhileLoop extends Loop {

  toString(): string {
    return `{ FIX F | (F g) s = cond(B[ ${this.guard.toString()} ]s, g ∘ ${this.body.toString()}, id) }`;
  }

  toAnnotatedProgram(level: number = 0): string {
    return `${this.indent(level)}//pre:${this.preCondition}\n${this.indent(level)}while(${this.guard.toString()}){\n${this.indent(level + 1)}//inv:${this.invariant}\n${this.body.toAnnotatedProgram(level + 1)}\n${this.indent(level+1)}//post:${this.postCondition}\n${this.indent(level)}}`;
  }
}

export class RepeatUntilLoop extends Loop {

  toString(): string {
    return `{ FIX F | (F g) s = cond(B[ ${this.guard.toString()} ]s, g, id) ∘ Sds[[S]] }`;
  }

  toAnnotatedProgram(level: number = 0): string {
    return `${this.indent(level)}//pre:${this.preCondition}\n${this.indent(level)}repeat{\n${this.body.toAnnotatedProgram(level + 1)}\n${this.indent(level)}${this.indent(level + 1)}//inv:${this.invariant}\n}until(${this.guard.toString()})\n${this.indent(level)}//post:${this.postCondition}`;
  }
}

export class ForLoop extends Loop {
  initialStatement: Statement;
  incrementStatement: Statement;

  constructor(
    body: Statement,
    guard: BooleanExpression,
    initialStatement: Statement,
    incrementStatement: Statement,
  ) {
    super(body, guard);
    this.initialStatement = initialStatement;
    this.incrementStatement = incrementStatement;
  };

  toString(): string {
    return `{ (FIX F) ∘ ${this.initialStatement.toString()} | (F g) s = cond(B[ ${this.guard.toString()} ]s, g ∘ ${this.incrementStatement.toString()} ∘ ${this.body.toString()}, id) }`;
  }

  toAnnotatedProgram(level: number = 0): string {
    return `${this.indent(level)}//pre:${this.preCondition}\n${this.indent(level)}for(${this.initialStatement.toAnnotatedProgram()};${this.guard.toString()};${this.incrementStatement.toAnnotatedProgram()}){\n${this.indent(level + 1)}//inv:${this.invariant}\n${this.body.toAnnotatedProgram(level + 1)}\n${this.indent(level)}}\n${this.indent(level)}//post:${this.postCondition}`;
  }
}

