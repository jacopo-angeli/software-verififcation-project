import { NumericalAbstractDomainGC } from "../../../../model/domains/GC/numerical_abstract_domain_gc";
import { IntervalFactory } from "../types/interval_factory";
import { Interval } from "../types/interval";
import { EmptySet, Set } from "../types/set";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from "../../../../../../model/while+/arithmetic_expression";
import { AbstractProgramState } from "../../../../model/types/abstract_state";
import { ConcreteValue } from "../../../../model/types/concrete_value";
import { Assignment, Concatenation, ForLoop, IfThenElse, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../../../../../../model/while+/statement";
import { BooleanExpression } from "../../../../../../model/while+/boolean_expression";

export class IntervalDomain extends NumericalAbstractDomainGC<Interval> {
    constructor(
        protected _IntervalFactory: IntervalFactory,
    ) { super(); }

    alpha = (x: ConcreteValue): Interval => {
        if (x instanceof EmptySet) return this.Bottom;
        return this._IntervalFactory.fromSet(x as Set);
    };

    leq = (x: Interval, y: Interval): boolean => {
        return x.lower >= y.lower && x.upper <= y.upper;
    };

    gamma = (x: Interval): ConcreteValue => {
        if (x.isBottom()) return new EmptySet();
        return new Set(x.lower, x.upper);
    };

    Bottom: Interval = this._IntervalFactory.Bottom;
    Top: Interval = this._IntervalFactory.Top;

    Operators = {
        negate: (x: Interval): Interval => {
            return this._IntervalFactory.new(-x.upper, -x.lower)
        },
        add: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this._IntervalFactory.Bottom;
            return this._IntervalFactory.new(x.lower === this._IntervalFactory.meta.m ? this._IntervalFactory.meta.m : x.lower + y.lower, x.upper === this._IntervalFactory.meta.n ? this._IntervalFactory.meta.n : x.upper + y.upper)
        },
        subtract: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this._IntervalFactory.Bottom;
            return this._IntervalFactory.new(x.lower === this._IntervalFactory.meta.m ? this._IntervalFactory.meta.m : x.lower - y.upper, x.upper === this._IntervalFactory.meta.n ? this._IntervalFactory.meta.n : x.upper - y.lower)
        },
        multiply: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this._IntervalFactory.Bottom;
            let products: Array<number> = [
                x.lower * y.lower, x.lower * y.upper,
                x.upper * y.lower, x.upper * y.upper
            ];
            return this._IntervalFactory.new(Math.min(...products), Math.max(...products));
        },
        divide: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this._IntervalFactory.Bottom;
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
        negate: (x: Interval, y: Interval): Interval => {
            return this.SetOperators.intersection(x, this.Operators.negate(y));
        },
        add: (x: Interval, y: Interval, r: Interval): { x: Interval; y: Interval; } => {
            return {
                x: this.SetOperators.intersection(x, this.Operators.subtract(r, y)),
                y: this.SetOperators.intersection(y, this.Operators.subtract(r, x)),
            }
        },
        subtract: (x: Interval, y: Interval, r: Interval): { x: Interval; y: Interval; } => {
            return {
                x: this.SetOperators.intersection(x, this.Operators.add(r, y)),
                y: this.SetOperators.intersection(y, this.Operators.subtract(x, r)),
            }
        },
        multiply: (x: Interval, y: Interval, r: Interval): { x: Interval; y: Interval; } => {
            return {
                x: this.SetOperators.intersection(x, this.Operators.divide(r, y)),
                y: this.SetOperators.intersection(y, this.Operators.divide(r, x)),
            }
        },
        divide: (x: Interval, y: Interval, r: Interval): { x: Interval; y: Interval; } => {
            let s = this.Operators.add(r, this._IntervalFactory.new(-1, 1));
            return {
                x: this.SetOperators.intersection(x, this.Operators.multiply(s, y)),
                y: this.SetOperators.intersection(y, this.SetOperators.union(this.Operators.divide(x, s), this._IntervalFactory.new(0, 0))),
            }
        }
    };

    SetOperators = {
        union: (x: Interval, y: Interval): Interval => {
            if (x.isBottom()) return y;
            if (y.isBottom()) return x;
            return this._IntervalFactory.new(Math.min(x.lower, y.lower), Math.max(x.upper, y.upper));
        },
        intersection: (x: Interval, y: Interval): Interval => {
            if (x.isBottom() || y.isBottom()) return this.Bottom;
            const lower = Math.max(x.lower, y.lower);
            const upper = Math.min(x.upper, y.upper);
            if (lower <= upper) return this._IntervalFactory.new(lower, upper);
            else return this.Bottom;
        },
    };

    widening = (x: Interval, y: Interval): Interval => {
        if (x.isBottom()) return y;
        const newLower = (x.lower <= y.lower) ? x.lower : Math.max(...(this.thresholds!.filter(x => x <= y.lower)), this._IntervalFactory.meta.m);
        const newUpper = (x.upper >= y.upper) ? x.upper : Math.min(...(this.thresholds!.filter(x => x >= y.upper)), this._IntervalFactory.meta.n);
        return this._IntervalFactory.new(newLower, newUpper);
    };

    narrowing = (x: Interval, y: Interval): Interval => {
        const newLower = (x.lower === this._IntervalFactory.meta.m ? y.lower : x.lower);
        const newUpper = (x.upper === this._IntervalFactory.meta.n ? y.upper : x.upper);
        return this._IntervalFactory.new(newLower, newUpper)
    };

    E(expr: ArithmeticExpression, aState: AbstractProgramState<Interval>): { state: AbstractProgramState<Interval>, value: Interval } {
        if (expr instanceof Numeral) {
            return { state: aState.clone(), value: this.alpha(new Set(expr.value, expr.value)) };
        }
        if (expr instanceof Variable) {
            return { state: aState.clone(), value: aState.lookup(expr.name) };
        }
        if (expr instanceof ArithmeticUnaryOperator) {
            return {
                state: this.E(expr.operand, aState).state,
                value: this._IntervalFactory.new(-1 * this.E(expr.operand, aState).value.upper, -1 * this.E(expr.operand, aState).value.lower)
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

        return {
            state: aState,
            value: super.E(expr, aState)
        }
    }

    private thresholds: Array<number> | undefined = undefined;
    S(stmt: Statement, aState: AbstractProgramState<Interval>, flags: { widening: boolean, narrowing: boolean }): AbstractProgramState<Interval> {
        let Body = (stmt: Statement, aState: AbstractProgramState<Interval>, flags: { widening: boolean, narrowing: boolean }): AbstractProgramState<Interval> => {

            if (stmt instanceof Assignment) {
                stmt.pre = (aState.toString());
                let ret = (this.E(stmt.variable, aState.clone()).state.update(stmt.variable.name, this.E(stmt.value, aState).value));
                stmt.post = (ret.toString());
                return ret;
            }

            if (stmt instanceof Skip) {
                stmt.pre = (aState.toString());
                stmt.post = (aState.toString());
                return aState.clone();
            }

            if (stmt instanceof Concatenation) {
                stmt.pre = (aState.toString());
                let ret = this.S(stmt.g, this.S(stmt.f, aState.clone(), flags).clone(), flags);
                stmt.post = (ret.toString());
                return ret;
            }

            if (stmt instanceof IfThenElse) {
                stmt.pre = (aState.toString());
                let ret = this._StateAbstractDomain.SetOperators.union(
                    this.C(stmt.guard, this.S(stmt.thenB, aState.clone(), flags)),
                    this.C(stmt.guard.negate(), this.S(stmt.elseB, aState.clone(), flags)),
                )
                stmt.post = (ret.toString());
                return ret;
            }

            if (stmt instanceof WhileLoop) {
                let currentState: AbstractProgramState<Interval> = aState.clone();
                let prevState: AbstractProgramState<Interval>;

                console.log("Fixpoint search --------------------------")
                stmt.pre = (currentState.toString());
                do {
                    prevState = currentState.clone();

                    //currentState = prevState LUB D#[body](B#[guard])
                    currentState = this._StateAbstractDomain.SetOperators.union(
                        prevState, 
                        this.S(stmt.body, this.C(stmt.guard, currentState), flags),
                    );

                    if (flags.widening) {
                        console.log("Widening(", prevState.toString(), ",", currentState.toString(), ") :", this._StateAbstractDomain.widening(prevState, currentState).toString())
                        console.log("\n")
                        currentState = this._StateAbstractDomain.widening(prevState, currentState);
                    }

                } while (!this._StateAbstractDomain.eq(prevState, currentState));

                stmt.inv = currentState.toString();
                console.log("Fixpoint found:", currentState.toString())
                console.log("\n")
                console.log("Fixpoint ------------------------------end")
                console.log("\n")
                console.log("Narrowing --------------------------------")
                console.log("\n")
                if (flags.narrowing) {
                    do {
                        prevState = currentState.clone();
                        currentState = this._StateAbstractDomain.narrowing(
                            prevState,
                            this._StateAbstractDomain.SetOperators.intersection(
                                prevState,
                                this.S(stmt.body, this.C(stmt.guard, currentState), flags),
                            )
                        )
                    } while (!this._StateAbstractDomain.eq(prevState, currentState));
                    stmt.inv = currentState.toString();
                }
                console.log("Result: ", currentState.toString());
                console.log("Narrowing -----------------------------end")
                console.log("\n")
                console.log("Filtering with guard negated -------------")
                console.log("Negated guard:", stmt.guard.negate().toString())
                let ret = this.C(stmt.guard.negate(), currentState);
                stmt.post = (ret.toString());
                console.log("Result:", ret.toString())
                console.log("Filtering with guard negated --------- end")
                return ret;
            }

            if (stmt instanceof RepeatUntilLoop) {
                // B#[b](lfp(λx.s# ∨ S​(D#[S]∘B#[not b])x)) ∘ D#[S]s
                let currentState: AbstractProgramState<Interval> = this.S(stmt.body, aState.clone(), flags);
                let prevState: AbstractProgramState<Interval>;

                console.log("Fixpoint search --------------------------")
                stmt.pre = (currentState.toString());
                do {
                    prevState = currentState.clone();

                    //currentState = prevState LUB D#[body](B#[guard])
                    currentState = this._StateAbstractDomain.SetOperators.union(
                        prevState, 
                        this.S(stmt.body, this.C(stmt.guard.negate(), currentState), flags)
                    );

                    if (flags.widening) {
                        console.log("Widening(", prevState.toString(), ",", currentState.toString(), ") :", this._StateAbstractDomain.widening(prevState, currentState).toString())
                        console.log("\n")
                        currentState = this._StateAbstractDomain.widening(prevState, currentState);
                    }

                } while (!this._StateAbstractDomain.eq(prevState, currentState));

                stmt.inv = currentState.toString();
                console.log("Fixpoint found:", currentState.toString())
                console.log("\n")
                console.log("Fixpoint ------------------------------end")
                console.log("\n")
                console.log("Narrowing --------------------------------")
                console.log("\n")
                if (flags.narrowing) {
                    do {
                        prevState = currentState.clone();
                        currentState = this._StateAbstractDomain.narrowing(
                            prevState,
                            this._StateAbstractDomain.SetOperators.intersection(
                                prevState,
                                this.S(stmt.body, this.C(stmt.guard.negate(), currentState), flags),
                            )
                        )
                    } while (!this._StateAbstractDomain.eq(prevState, currentState));
                    stmt.inv = currentState.toString();
                }
                console.log("Result: ", currentState.toString());
                console.log("Narrowing -----------------------------end")
                console.log("\n")
                console.log("Filtering with guard negated -------------")
                console.log("Negated guard:", stmt.guard.negate().toString())
                let ret = this.C(stmt.guard, currentState);
                stmt.post = (ret.toString());
                console.log("Result:", ret.toString())
                console.log("Filtering with guard negated --------- end")
                return ret;
            }

            if (stmt instanceof ForLoop) {
                // Initialization: Execute S
                let currentState: AbstractProgramState<Interval> = this.S(stmt.initialStatement, aState, flags);
                let prevState: AbstractProgramState<Interval>;

                console.log("Fixpoint search --------------------------")
                stmt.pre = (currentState.toString());
                do {
                    prevState = currentState.clone();
                    //currentState = prevState LUB D#[body](B#[guard])
                    currentState = this._StateAbstractDomain.SetOperators.union(
                        prevState,
                        this.S(stmt.incrementStatement, this.S(stmt.body, this.C(stmt.guard, prevState), flags), flags)
                    );

                    if (flags.widening) {
                        console.log("Widening(", prevState.toString(), ",", currentState.toString(), ") :", this._StateAbstractDomain.widening(prevState, currentState).toString())
                        console.log("\n")
                        currentState = this._StateAbstractDomain.widening(prevState, currentState);
                    }

                } while (!this._StateAbstractDomain.eq(prevState, currentState));

                stmt.inv = currentState.toString();
                console.log("Fixpoint found:", currentState.toString())
                console.log("\n")
                console.log("Fixpoint ------------------------------end")
                console.log("\n")
                console.log("Narrowing --------------------------------")
                console.log("\n")
                if (flags.narrowing) {
                    do {
                        prevState = currentState.clone();
                        currentState = this._StateAbstractDomain.narrowing(
                            prevState,
                            this._StateAbstractDomain.SetOperators.intersection(
                                prevState,
                                this.S(stmt.incrementStatement, this.S(stmt.body, this.C(stmt.guard, prevState), flags), flags)
                            )
                        )
                    } while (!this._StateAbstractDomain.eq(prevState, currentState));
                    stmt.inv = currentState.toString();
                }
                console.log("Result: ", currentState.toString());
                console.log("Narrowing -----------------------------end")
                console.log("\n")
                console.log("Filtering with guard negated -------------")
                console.log("Negated guard:", stmt.guard.negate().toString())
                let ret = this.C(stmt.guard, currentState);
                stmt.post = (ret.toString());
                console.log("Result:", ret.toString())
                console.log("Filtering with guard negated --------- end")
                return ret;
            }

            throw Error("Dshapr : Unknown Statement.");
        };


        // INIT
        if (this.thresholds === undefined) {
            this.thresholds = [this._IntervalFactory.meta.m, this._IntervalFactory.meta.n]
            stmt.iter((node) => {
                if (node instanceof BooleanExpression) node.eleq0();
                if (node instanceof Numeral && !(this.thresholds as Array<number>).includes(node.value)) (this.thresholds as Array<number>).push(node.value)
            })
            this.thresholds.sort();
        }
        console.log("S function -------------------------")
        console.log("Input:");
        console.log(stmt.annotatedProgram(0));
        console.log(aState.toString());
        console.log(`[${flags.widening ? "with widening" : "without widening"},${flags.narrowing ? "with narrowing" : "without narrowing"}]`);
        const ret = Body(stmt, aState, flags);
        console.log("Result:", ret.toString());
        console.log("S function ----------------------end")
        return ret;

    }

};