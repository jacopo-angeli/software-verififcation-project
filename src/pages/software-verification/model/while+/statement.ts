import { AbstractProgramState } from "../../components/SecondAssignment/model/types/abstract_state";
import { AbstractValue } from "../../components/SecondAssignment/model/types/abstract_value";
import { ArithmeticExpression, Variable } from "./arithmetic_expression";
import { BooleanExpression } from "./boolean_expression";

// Modify the Statement class to include the iter method that works for both expression types.
export abstract class Statement<T extends AbstractValue> {
  preCondition: AbstractProgramState<T> | undefined;
  postCondition: AbstractProgramState<T> | undefined;

  public setPreCondition(c: AbstractProgramState<T>) { this.preCondition = c; }
  public setPostCondition(c: AbstractProgramState<T>) { this.postCondition = c; }

  // Abstract iter method to be overridden in subclasses
  abstract iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void;
}

export class Assignment<T extends AbstractValue> extends Statement<T> {
  constructor(public variable: Variable, public value: ArithmeticExpression) {
    super();
  }

  // Apply the function to this statement and its components
  iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void {
    fn(this);
    this.variable.iter(fn);
    this.value.iter(fn);
  }
}

export class Skip<T extends AbstractValue> extends Statement<T> {
  iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void  {
    fn(this);
  }
}

export class Concatenation<T extends AbstractValue> extends Statement<T> {
  constructor(public firstStatement: Statement<T>, public secondStatement: Statement<T>) {
    super();
  }

  iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void  {
    fn(this);
    this.firstStatement.iter(fn);
    this.secondStatement.iter(fn);
  }
}

export class IfThenElse<T extends AbstractValue> extends Statement<T> {
  constructor(
    public guard: BooleanExpression,
    public thenBranch: Statement<T>,
    public elseBranch: Statement<T>
  ) {
    super();
  }

  iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void  {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.thenBranch.iter(fn);
    this.elseBranch.iter(fn);
  }
}

export abstract class Loop<T extends AbstractValue> extends Statement<T> {
  invariant: AbstractProgramState<T> | undefined;
  constructor(public body: Statement<T>, public guard: BooleanExpression) {
    super();
  }
  public setInvariant(c: AbstractProgramState<T>) { this.invariant = c; }

  // Body iter function
  iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void  {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }
}

export class WhileLoop<T extends AbstractValue> extends Loop<T> {
  iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void  {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }
}

export class RepeatUntilLoop<T extends AbstractValue> extends Loop<T> {
  iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void  {
    fn(this);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
  }
}

export class ForLoop<T extends AbstractValue> extends Loop<T> {
  constructor(
    body: Statement<T>,
    guard: BooleanExpression,
    public initialStatement: Statement<T>,
    public incrementStatement: Statement<T>
  ) {
    super(body, guard);
  }

  iter(fn: (node: Statement<T> | ArithmeticExpression | BooleanExpression) => void) : void {
    fn(this);
    this.initialStatement.iter(fn);
    this.guard.iter(fn); // Call iter on the guard (BooleanExpression)
    this.body.iter(fn);
    this.incrementStatement.iter(fn);
  }
}
