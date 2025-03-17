import { ArithmeticExpression } from "../../../../model/while+/arithmetic_expression";
import { BooleanExpression } from "../../../../model/while+/boolean_expression";
import { Statement } from "../../../../model/while+/statement";
import { AbstractProgramState } from "../types/abstract_state";
import { AbstractValue } from "../types/abstract_value";
import { PowerSet_I } from "../types/power_set";

export abstract class NumericalAbstractDomain<T extends AbstractValue> {
    abstract leq: (X: T, Y: T) => boolean;
    abstract gamma: (X: T) => PowerSet_I;
    abstract Bottom: T;
    abstract Top: T;
    abstract UnaryOperators: {
        neg: (X: T) => T;
    };
    abstract BinaryOperators: {
        add: (X: T, Y: T) => T,
        subtract: (X: T, Y: T) => T,
        multiply: (X: T, Y: T) => T,
        divide: (X: T, Y: T) => T,
    };
    abstract SetOperators: {
        union: (X: T, Y: T) => T;
        intersection: (X: T, Y: T) => T;
    };
    abstract widening: (x: T, y: T, options? : {tresholds?: Array<number>,},) => T
    abstract SharpFunctions: {
        E: (expr: ArithmeticExpression, aState: AbstractProgramState<T>) => any;
        C: (expr: BooleanExpression, aState: AbstractProgramState<T>) => AbstractProgramState<T>;
        S: (expr: Statement, aState: AbstractProgramState<T>) => AbstractProgramState<T>;
    }
}
