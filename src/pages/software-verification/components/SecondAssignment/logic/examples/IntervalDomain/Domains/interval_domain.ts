import { NumericalAbstractDomainGC } from "../../../../model/domains/GC/numerical_abstract_domain_gc";
import { IntervalFactory } from "../types/interval_factory";
import { Bottom, Interval } from "../types/interval";
import { EmptySet, Set } from "../types/set";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from "../../../../../../model/while+/arithmetic_expression";
import { BooleanBinaryOperator, BooleanConcatenation, BooleanExpression, BooleanUnaryOperator } from "../../../../../../model/while+/boolean_expression";
import { Statement } from "../../../../../../model/while+/statement";
import { AbstractProgramState } from "../../../../model/types/abstract_state";
import { ConcreteValue } from "../../../../model/types/concrete_value";

export class IntervalDomain extends NumericalAbstractDomainGC<Interval> {
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
    gamma = (x: Interval | Bottom): ConcreteValue => {
        if (x instanceof Bottom) return new EmptySet();
        return new Set(x.lower, x.upper);
    };
    Bottom: Interval = this._IntervalFactory.Bottom;
    Top: Interval = this._IntervalFactory.Top;

    Operators = {
        minus: (x: Interval): Interval => {
            return this._IntervalFactory.new(-x.upper, -x.lower)
        },
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
            if (x instanceof Bottom || y instanceof Bottom) return this._IntervalFactory.Bottom;
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
                this.Operators.divide(x, this._IntervalFactory.intersect(y, this._IntervalFactory.getMoreThan(0))),
                this.Operators.divide(x, this._IntervalFactory.intersect(y, this._IntervalFactory.getLessThan(0)))
            )
        },
    };

    BackwardOperators = {
        leqZero: (x: Interval): Interval => {
            return this.SetOperators.intersection(x, this._IntervalFactory.getLessThanOrEqual(0));
        },
        minus: (x: Interval, y: Interval): Interval => {
            return this.SetOperators.intersection(x, this.Operators.minus(y));
        },
        add: (x: Interval, y: Interval, r: Interval): { x: Interval; y: Interval; } => {
            return {
                x: this.SetOperators.intersection(x, this.Operators.subtract(r, y)),
                y: this.SetOperators.intersection(x, this.Operators.subtract(r, x)),
            }
        },
        subtract: (x: Interval, y: Interval, r: Interval): { x: Interval; y: Interval; } => {
            return {
                x: this.SetOperators.intersection(x, this.Operators.add(r, y)),
                y: this.SetOperators.intersection(x, this.Operators.subtract(x, r)),
            }
        },
        multiply: (x: Interval, y: Interval, r: Interval): { x: Interval; y: Interval; } => {
            return {
                x: this.SetOperators.intersection(x, this.Operators.divide(r, y)),
                y: this.SetOperators.intersection(x, this.Operators.divide(r, x)),
            }
        },
        divide: (x: Interval, y: Interval, r: Interval): { x: Interval; y: Interval; } => {
            return {
                x: this.SetOperators.intersection(x, this.Operators.divide(r, y)),
                y: this.SetOperators.intersection(x, this.Operators.divide(r, x)),
            }
        }
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
    narrowing = (x: Interval, y: Interval, options?: { tresholds?: Array<number>; }): Interval => {
        return x
    };
    E = (expr: ArithmeticExpression, aState: AbstractProgramState<Interval>): { state: AbstractProgramState<Interval>, value: Interval } => {
        if (expr instanceof Numeral) {
            return { state: aState.clone(), value: this.alpha(new Set(expr.value, expr.value)) };
        }
        if (expr instanceof Variable) {
            return { state: aState.clone(), value: aState.lookup(expr.name) };
        }
        if (expr instanceof ArithmeticUnaryOperator) {
            return {
                state: this.E(expr, aState).state,
                value: this._IntervalFactory.new(-1 * this.E(expr, aState).value.upper, -1 * this.E(expr, aState).value.lower)
            }
        };
        if (expr instanceof ArithmeticBinaryOperator) {
            const p = new Map<string, (x: Interval, y: Interval) => Interval>([
                ["+", (x, y) => this.Operators.add(x, y)],
                ["-", (x, y) => this.Operators.subtract(x, y)],
                ["*", (x, y) => this.Operators.multiply(x, y)],
                ["/", (x, y) => this.Operators.divide(x, y)]
            ]);
            return {
                state: this.E(expr.rightOperand, this.E(expr.leftOperand, aState).state).state,
                value: p.get(expr.operator.value)!(this.E(expr.leftOperand, aState).value, this.E(expr.rightOperand, this.E(expr.leftOperand, aState).state).value)
            }
        }
        if (expr instanceof IncrementOperator) {
            return {
                state: aState.clone().update(expr.variable.name, this.Operators.add(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))),
                value: this.Operators.add(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))
            };
        }
        if (expr instanceof DecrementOperator) {
            return {
                state: aState.clone().update(expr.variable.name, this.Operators.subtract(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))),
                value: this.Operators.subtract(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))
            };
        }


        // TODO: Define an independent fall back definition overridable. 
        return {
            state: aState,
            value: super.E(expr, aState)
        }
    }
    S = (expr: Statement, aState: AbstractProgramState<Interval>): any => {
        //     private thresholdsHunt(current: any): Array<number> {
//         let thresholds: Array<number> = [];
//         if (current instanceof ArithmeticExpression) {
//             if (current instanceof Numeral) {
//                 thresholds.push(current.value);
//                 return thresholds;
//             }
//             if (current instanceof ArithmeticBinaryOperator) {
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.leftOperand));
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.rightOperand));
//             }
//             if (current instanceof ArithmeticUnaryOperator)
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.operand));
//         } else if (current instanceof BooleanExpression) {
//             if (current instanceof BooleanBinaryOperator || current instanceof BooleanConcatenation) {
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.leftOperand));
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.rightOperand));
//             }
//             if (current instanceof BooleanUnaryOperator)
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.booleanExpression));
//         }
//         else {
//             //Arithmetic Expressions
//             //Statements
//             if (current instanceof Assignment) thresholds = this.thresholdsHunt(current.value);

//             if (current instanceof Concatenation) {
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.firstStatement));
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.secondStatement));
//             }
//             if (current instanceof IfThenElse) {
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.guard));
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.thenBranch));
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.elseBranch));
//             }
//             if (current instanceof Loop) {
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.guard));
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.body));
//             }
//             if (current instanceof ForLoop) {
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.initialStatement));
//                 thresholds = thresholds.concat(this.thresholdsHunt(current.incrementStatement));
//             }
//         }
//         return thresholds;
//     }
//     private thresholds: Array<number> | undefined = undefined;

//     public dSharp(stmt: Statement, aState: IntervalAbstractProgramState, flags: { widening: boolean, narrowing: boolean } = { widening: false, narrowing: false }): IntervalAbstractProgramState {
//         if (this.thresholds === undefined)
//             this.thresholds = ([this._IntervalFactory.getMin, this._IntervalFactory.getMax].concat(this.thresholdsHunt(stmt))).sort();

//         if (stmt instanceof Assignment) {
//             stmt.setPreCondition(aState.copy());
//             let ret = (this.aSharp(stmt.variable, aState.copy()).state.update(stmt.variable.name, this.aSharp(stmt.value, aState).value));
//             stmt.setPostCondition(ret.copy());
//             return ret;
//         }

//         if (stmt instanceof Skip) {
//             stmt.setPreCondition(aState.copy());
//             stmt.setPostCondition(aState.copy());
//             return aState.copy();
//         }

//         if (stmt instanceof Concatenation) {
//             stmt.setPreCondition(aState.copy());
//             let ret = this.dSharp(stmt.secondStatement, this.dSharp(stmt.firstStatement, aState.copy()).copy());
//             stmt.setPostCondition(ret.copy());
//             return ret;
//         }

//         if (stmt instanceof IfThenElse) {
//             stmt.setPreCondition(aState.copy());
//             let ret = this._AbstracStateDomain.lub(
//                 this.bSharp(stmt.guard, this.dSharp(stmt.thenBranch, aState.copy())),
//                 this.bSharp(stmt.guard, this.dSharp(stmt.elseBranch, aState.copy()), true),
//             )
//             stmt.setPostCondition(ret.copy());
//             return ret;
//         }

//         if (stmt instanceof WhileLoop) {
//             let currentState: IntervalAbstractProgramState = aState.copy();
//             let prevState: IntervalAbstractProgramState;
//             stmt.setPreCondition(currentState.copy());
//             do {
//                 prevState = currentState.copy();

//                 //currentState = prevState LUB D#[body](B#[guard])
//                 currentState = this._AbstracStateDomain.lub(
//                     prevState,
//                     this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState), flags)
//                 );

//                 if (flags.widening) currentState = this._AbstracStateDomain.widening(prevState, currentState);

//             } while (!this._AbstracStateDomain.equal(prevState, currentState));
//             stmt.setInvariant(currentState);

//             if (flags.narrowing) {
//                 prevState = aState.copy();
//                 do {
//                     currentState = this._AbstracStateDomain.narrowing(
//                         currentState,
//                         this._AbstracStateDomain.lub(
//                             prevState,
//                             this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState))
//                         )
//                     );
//                     prevState = currentState.copy();
//                 } while (!this._AbstracStateDomain.equal(prevState, currentState));
//             }
//             let ret = this.bSharp(stmt.guard, currentState, true);
//             stmt.setPostCondition(ret);
//             return ret;
//         }

//         if (stmt instanceof RepeatUntilLoop) {
//             // B#[b](lfp(λx.s# ∨ S​(D#[S]∘B#[not b])x)) ∘ D#[S]s
//             let currentState: IntervalAbstractProgramState = this.dSharp(stmt.body, aState.copy());
//             let prevState: IntervalAbstractProgramState;
//             stmt.setPreCondition(aState.copy())
//             do {
//                 prevState = currentState.copy();
//                 currentState = this._AbstracStateDomain.lub(
//                     prevState,
//                     this.dSharp(stmt.body, this.bSharp(stmt.guard, prevState, true))
//                 );
//                 if (flags.widening) currentState = this._AbstracStateDomain.widening(prevState, currentState);
//             } while (!this._AbstracStateDomain.equal(prevState, currentState));
//             stmt.setInvariant(currentState.copy());

//             if (flags.narrowing) {
//                 prevState = aState.copy();
//                 do {
//                     currentState = this._AbstracStateDomain.narrowing(
//                         currentState,
//                         this._AbstracStateDomain.lub(
//                             prevState,
//                             this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState, true))
//                         )
//                     );
//                     prevState = currentState.copy();
//                 } while (!this._AbstracStateDomain.equal(prevState, currentState));
//             }
//             let ret = this.bSharp(stmt.guard, currentState);
//             stmt.setPostCondition(ret.copy());
//             return ret;
//         }

//         if (stmt instanceof ForLoop) {
//             // Initialization: Execute S
//             let currentState: IntervalAbstractProgramState = this.dSharp(stmt.initialStatement, aState);
//             let prevState: IntervalAbstractProgramState;
//             stmt.setPreCondition(aState.copy());
//             do {
//                 prevState = currentState;
//                 currentState = this._AbstracStateDomain.lub(
//                     prevState,
//                     this.dSharp(stmt.incrementStatement, this.dSharp(stmt.body, this.bSharp(stmt.guard, prevState)))
//                 );
//                 if (flags.narrowing) currentState = this._AbstracStateDomain.widening(prevState, currentState);
//             } while (!this._AbstracStateDomain.equal(prevState, currentState));
//             stmt.setInvariant(currentState.copy());
//             if (flags.narrowing) {
//                 prevState = aState.copy();
//                 do {
//                     currentState = this._AbstracStateDomain.narrowing(
//                         currentState,
//                         this._AbstracStateDomain.lub(
//                             prevState,
//                             this.dSharp(stmt.incrementStatement, this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState)))
//                         )
//                     );
//                     prevState = currentState.copy();
//                 } while (!this._AbstracStateDomain.equal(prevState, currentState));
//             }
//             let ret = this.bSharp(stmt.guard, currentState, true);
//             stmt.setPostCondition(ret.copy());
//             return ret;
//         }

//         throw Error("Dshapr : Unknown Statement.");
//     }
    };
}