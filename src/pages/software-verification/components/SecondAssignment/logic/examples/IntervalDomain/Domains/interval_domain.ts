import { NumericalAbstractDomainGC } from "../../../../model/domains/GC/numerical_abstract_domain_gc";
import { PowerSet_I } from "../../../../model/types/power_set";
import { IntervalFactory } from "../types/interval_factory";
import { Bottom, Interval } from "../types/interval";
import { EmptySet, Set } from "../types/set";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from "../../../../../../model/while+/arithmetic_expression";
import { BooleanExpression } from "../../../../../../model/while+/boolean_expression";
import { Statement } from "../../../../../../model/while+/statement";
import { AbstractProgramState } from "../../../../model/types/abstract_state";

class IntervalDomain extends NumericalAbstractDomainGC<Interval> {
    constructor(
        protected _IntervalFactory: IntervalFactory,
    ) { super(); }

    alpha = (x: Set): Interval => {
        if (x instanceof EmptySet) return this.Bottom;
        return this._IntervalFactory.fromSet(x);
    };
    leq = (x: Interval, y: Interval): boolean => {
        return x.lower >= y.lower && x.upper <= y.upper;
    };
    gamma = (x: Interval | Bottom): PowerSet_I => {
        if (x instanceof Bottom) return new EmptySet();
        return new Set(x.lower, x.upper);
    };
    Bottom: Interval = this._IntervalFactory.Bottom;
    Top: Interval = this._IntervalFactory.Top;

    UnaryOperators = {
        neg: (x: Interval): Interval => {
            if (x instanceof Bottom) return this._IntervalFactory.Bottom;
            return this._IntervalFactory.new(-x.upper, -x.lower);
        },
    };
    BinaryOperators = {
        add: (x: Interval, y: Interval): Interval => {
            if (x instanceof Bottom || y instanceof Bottom) return this._IntervalFactory.Bottom;
            return this._IntervalFactory.new(x.lower + y.lower, x.upper + y.upper)
        },
        subtract: (x: Interval, y: Interval): Interval => {
            if (x instanceof Bottom || y instanceof Bottom) return this._IntervalFactory.Bottom;
            return this._IntervalFactory.new(x.lower + y.upper, x.upper + y.lower)
        },
        multiply: (x: Interval, y: Interval): Interval => {
            if (x instanceof Bottom || y instanceof Bottom) return this._IntervalFactory.Bottom;
            let products: Array<number> = [
                x.lower * y.lower, x.lower * y.upper,
                x.upper * y.lower, x.upper * y.upper
            ];
            return this._IntervalFactory.new(Math.min(...products), Math.max(...products));
        },
        divide: (x: Interval, y: Interval): Interval => {
            if (1 <= y.lower)
                return this._IntervalFactory.new(
                    Math.min(x.lower / y.lower, x.lower / y.upper),
                    Math.max(x.upper / y.lower, x.upper / y.upper)
                );
            if (y.upper <= -1)
                return this._IntervalFactory.new(
                    Math.min(x.upper / y.lower, x.upper / y.upper),
                    Math.max(x.lower / y.lower, x.lower / y.upper)
                );
            return this._IntervalFactory.union(
                this.BinaryOperators.divide(x, this._IntervalFactory.intersect(y, this._IntervalFactory.getMoreThan(0))),
                this.BinaryOperators.divide(x, this._IntervalFactory.intersect(y, this._IntervalFactory.getLessThan(0)))
            )
        },
    };
    SetOperators = {
        union: (x: Interval, y: Interval): Interval => {
            return this._IntervalFactory.new(Math.min(x.lower, y.lower), Math.max(x.upper, y.upper))
        },
        intersection: (x: Interval, y: Interval): Interval => {
            return this._IntervalFactory.new(Math.max(x.lower, y.lower), Math.min(x.upper, y.upper))
        },
    };
    widening = (x: Interval, y: Interval, options?: { tresholds?: Array<number>; }): Interval => {
        return x
    };
    SharpFunctions = {
        E: (expr: ArithmeticExpression, aState: AbstractProgramState<Interval>): { state: AbstractProgramState<Interval>, value: Interval } => {
            if (expr instanceof Numeral) {
                return { state: aState, value: this.alpha(new Set(expr.value, expr.value)) };
            }
            if (expr instanceof Variable) {
                return { state: aState, value: aState.lookup(expr.name) };
            }
            if (expr instanceof ArithmeticUnaryOperator) {
                return {
                    state: this.SharpFunctions.E(expr, aState).state,
                    value: this._IntervalFactory.new(-1 * this.SharpFunctions.E(expr, aState).value.upper, -1 * this.SharpFunctions.E(expr, aState).value.lower)
                }
            };
            if (expr instanceof ArithmeticBinaryOperator) {
                return {
                    state: this.SharpFunctions.E(expr.rightOperand, this.SharpFunctions.E(expr.leftOperand, aState).state).state,
                    value: this.op(this.SharpFunctions.E(expr.leftOperand, aState).value, expr.operator.value, this.SharpFunctions.E(expr.rightOperand, this.SharpFunctions.E(expr.leftOperand, aState).state).value)
                }
            }
            if (expr instanceof IncrementOperator) {
                return {
                    state: aState.update(expr.variable.name, this.BinaryOperators.add(aState.lookup(expr.variable.name), this.alpha(new Set(1,1)))),
                    value: this.BinaryOperators.add(aState.lookup(expr.variable.name), this.alpha(new Set(1,1)))
                };
            }
            if (expr instanceof DecrementOperator) {
                return {
                    state: aState.update(expr.variable.name, this.op(aState.lookup(expr.variable.name), '-', this.alpha(1))),
                    value: this.op(aState.lookup(expr.variable.name), '-', this.alpha(1))
                };
            }
            throw Error(`ASharp : Not an expression (${expr.toString()}).`);
        },
        C: (expr: BooleanExpression, aState: AbstractProgramState<Interval>): any => {

        },
        S: (expr: Statement, aState: AbstractProgramState<Interval>): any => {

        },
    }
}