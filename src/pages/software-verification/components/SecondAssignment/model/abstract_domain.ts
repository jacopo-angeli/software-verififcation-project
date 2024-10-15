import { ArithmeticExpression } from "../../../model/while+/arithmetic_expression";
import { BooleanExpression } from "../../../model/while+/boolean_expression";
import { Statement } from "../../../model/while+/statement";
import { AbstractProgramState } from "./abstract_program_state";

export abstract class AbstractDomain<AbsValue> {
    protected abstract equals(a: AbsValue, b: AbsValue): boolean;
    protected abstract notEquals(a: AbsValue, b: AbsValue): boolean;
    protected abstract lessThan(a: AbsValue, b: AbsValue): boolean;
    protected abstract lessThanOrEqual(a: AbsValue, b: AbsValue): boolean;
    protected abstract greaterThan(a: AbsValue, b: AbsValue): boolean;
    protected abstract greaterThanOrEqual(a: AbsValue, b: AbsValue): boolean;
    protected abstract lub(states: Array<AbstractProgramState>): AbstractProgramState;
    protected abstract glb(states: Array<AbstractProgramState>): AbstractProgramState;
    protected abstract widening(i1: AbsValue, i2: AbsValue): AbsValue;
    protected abstract narrowing(a1: AbsValue, a2: AbsValue): AbsValue;
    protected abstract alpha(c: number): AbsValue;
    protected abstract op(i1: AbsValue, op: string, i2: AbsValue): AbsValue;
    protected abstract aSharp(expr: ArithmeticExpression, aState: AbstractProgramState): AbsValue;
    protected abstract bSharp(expr: BooleanExpression, aState: AbstractProgramState): AbstractProgramState;
    public abstract dSharp(stmt: Statement, aState: AbstractProgramState): AbstractProgramState;
}