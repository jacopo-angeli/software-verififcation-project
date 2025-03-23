import { NumericalAbstractDomainGC } from "../../../../model/domains/GC/numerical_abstract_domain_gc";
import { IntervalFactory } from "../types/interval_factory";
import { Bottom, Interval } from "../types/interval";
import { EmptySet, Set } from "../types/set";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from "../../../../../../model/while+/arithmetic_expression";
import { AbstractProgramState } from "../../../../model/types/abstract_state";
import { ConcreteValue } from "../../../../model/types/concrete_value";
import { Assignment, Concatenation, ForLoop, IfThenElse, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../../../../../../model/while+/statement";

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
        if (x instanceof Bottom) return y;
        if (y instanceof Bottom) return x;
        const newLower = (x.lower <= y.lower) ? x.lower : Math.max(...(this.thresholds!.filter(x => x <= y.lower)), this._IntervalFactory.meta.m);
        const newUpper = (x.upper >= y.upper) ? x.upper : Math.min(...(this.thresholds!.filter(x => x >= y.upper)), this._IntervalFactory.meta.n);
        let ret = this._IntervalFactory.new(newLower, newUpper);
        return ret;
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
    private thresholds: Array<number> | undefined = undefined;
    S = (stmt: Statement<Interval>, aState: AbstractProgramState<Interval>, flags: { widening: boolean, narrowing: boolean }): AbstractProgramState<Interval> => {
        let Body = (stmt: Statement<Interval>, aState: AbstractProgramState<Interval>, flags: { widening: boolean, narrowing: boolean }): AbstractProgramState<Interval> => {

            if (stmt instanceof Assignment) {
                stmt.setPreCondition(aState.clone());
                let ret = (this.E(stmt.variable, aState.clone()).state.update(stmt.variable.name, this.E(stmt.value, aState).value));
                stmt.setPostCondition(ret.clone());
                return ret;
            }

            if (stmt instanceof Skip) {
                stmt.setPreCondition(aState.clone());
                stmt.setPostCondition(aState.clone());
                return aState.clone();
            }

            if (stmt instanceof Concatenation) {
                stmt.setPreCondition(aState.clone());
                let ret = this.S(stmt.secondStatement, this.S(stmt.firstStatement, aState.clone(), flags).clone(), flags);
                stmt.setPostCondition(ret.clone());
                return ret;
            }

            if (stmt instanceof IfThenElse) {
                stmt.setPreCondition(aState.clone());
                let ret = this._StateAbstractDomain.SetOperators.union(
                    this.C(stmt.guard, this.S(stmt.thenBranch, aState.clone(), flags)),
                    this.C(stmt.guard.negate(), this.S(stmt.elseBranch, aState.clone(), flags)),
                )
                stmt.setPostCondition(ret.clone());
                return ret;
            }

            if (stmt instanceof WhileLoop) {
                let currentState: AbstractProgramState<Interval> = aState.clone();
                let prevState: AbstractProgramState<Interval>;
                stmt.setPreCondition(currentState.clone());
                do {
                    prevState = currentState.clone();

                    //currentState = prevState LUB D#[body](B#[guard])
                    currentState = this._StateAbstractDomain.SetOperators.union(
                        prevState,
                        this.S(stmt.body, this.C(stmt.guard, currentState), flags)
                    );

                    if (flags.widening) currentState = this._StateAbstractDomain.widening(prevState, currentState);

                } while (!this._StateAbstractDomain.eq(prevState, currentState));

                stmt.setInvariant(currentState);

                if (flags.narrowing) {
                    prevState = aState.clone();
                    do {
                        currentState = this._StateAbstractDomain.narrowing(
                            currentState,
                            this._StateAbstractDomain.SetOperators.union(
                                prevState,
                                this.S(stmt.body, this.C(stmt.guard, currentState), flags)
                            )
                        );
                        prevState = currentState.clone();
                    } while (!this._StateAbstractDomain.eq(prevState, currentState));
                }
                let ret = this.C(stmt.guard.negate(), currentState);
                stmt.setPostCondition(ret);
                return ret;
            }

            if (stmt instanceof RepeatUntilLoop) {
                // B#[b](lfp(λx.s# ∨ S​(D#[S]∘B#[not b])x)) ∘ D#[S]s
                let currentState: AbstractProgramState<Interval> = this.S(stmt.body, aState.clone(), flags);
                let prevState: AbstractProgramState<Interval>;
                stmt.setPreCondition(aState.clone())
                do {
                    prevState = currentState.clone();
                    currentState = this._StateAbstractDomain.SetOperators.union(
                        prevState,
                        this.S(stmt.body, this.C(stmt.guard.negate(), prevState), flags)
                    );
                    if (flags.widening) currentState = this._StateAbstractDomain.widening(prevState, currentState);
                } while (!this._StateAbstractDomain.eq(prevState, currentState));
                stmt.setInvariant(currentState.clone());

                if (flags.narrowing) {
                    prevState = aState.clone();
                    do {
                        currentState = this._StateAbstractDomain.narrowing(
                            currentState,
                            this._StateAbstractDomain.SetOperators.union(
                                prevState,
                                this.S(stmt.body, this.C(stmt.guard.negate(), currentState), flags)
                            )
                        );
                        prevState = currentState.clone();
                    } while (!this._StateAbstractDomain.eq(prevState, currentState));
                }
                let ret = this.C(stmt.guard, currentState);
                stmt.setPostCondition(ret.clone());
                return ret;
            }

            if (stmt instanceof ForLoop) {
                // Initialization: Execute S
                let currentState: AbstractProgramState<Interval> = this.S(stmt.initialStatement, aState, flags);
                let prevState: AbstractProgramState<Interval>;
                stmt.setPreCondition(aState.clone());
                do {
                    prevState = currentState;
                    currentState = this._StateAbstractDomain.SetOperators.union(
                        prevState,
                        this.S(stmt.incrementStatement, this.S(stmt.body, this.C(stmt.guard, prevState), flags), flags)
                    );
                    if (flags.narrowing) currentState = this._StateAbstractDomain.widening(prevState, currentState);
                } while (!this._StateAbstractDomain.eq(prevState, currentState));
                stmt.setInvariant(currentState.clone());
                if (flags.narrowing) {
                    prevState = aState.clone();
                    do {
                        currentState = this._StateAbstractDomain.narrowing(
                            currentState,
                            this._StateAbstractDomain.SetOperators.union(
                                prevState,
                                this.S(stmt.incrementStatement, this.S(stmt.body, this.C(stmt.guard, currentState), flags), flags)
                            )
                        );
                        prevState = currentState.clone();
                    } while (!this._StateAbstractDomain.eq(prevState, currentState));
                }
                let ret = this.C(stmt.guard.negate(), currentState);
                stmt.setPostCondition(ret.clone());
                return ret;
            }

            throw Error("Dshapr : Unknown Statement.");
        };


        // INIT
        if (this.thresholds === undefined) {
            this.thresholds = [this._IntervalFactory.meta.m, this._IntervalFactory.meta.n]
            stmt.iter((node)=>{if(node instanceof Numeral) this.thresholds?.push(node.value)})
        }
        return Body(stmt, aState, flags);
    }
};