import { Interval, IntervalFactory } from "./interval_factory";
import { ArithmeticBinaryOperator, ArithmeticUnaryOperator, ArithmeticExpression, Numeral, Variable, IncrementOperator, DecrementOperator } from "../../../../model/while+/arithmetic_expression";
import { BooleanExpression, Boolean, BooleanBinaryOperator, BooleanUnaryOperator, BooleanConcatenation } from "../../../../model/while+/boolean_expression";
import { AbstractProgramState } from "../../model/abstract_program_state";
import { Assignment, Concatenation, ForLoop, IfThenElse, Loop, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../../../../model/while+/statement";
import { Token, TokenType } from "../../../../model/token";
import { AbstractDomain } from "../../model/abstract_domain";

export class IntervalDomain extends AbstractDomain<Interval> {

    constructor(protected intervalFactory: IntervalFactory, protected _widening: boolean, protected _narrowing: boolean) { super() }

    // ORDERING ---------------------------------------------------------------------------------------------
    protected equals(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a) && this.intervalFactory.isBottom(b)) return true;
        if (this.intervalFactory.isTop(a) && this.intervalFactory.isTop(b)) return true;
        return a.lower === b.lower && a.upper === b.upper;
    }

    protected notEquals(a: Interval, b: Interval): boolean {
        return !this.equals(a, b);
    }

    protected lessThan(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a)) return !(this.intervalFactory.isBottom(b));
        if (this.intervalFactory.isBottom(b)) return false;

        // top < v
        // v.isBottom()    => false
        // v.isTop()       => false
        // v anything else => false
        if (this.intervalFactory.isTop(a)) return false;

        // v < top
        // v.isBottom()    => true
        // v.isTop()       => false
        // v anything else => true
        if (this.intervalFactory.isTop(b)) {
            if (this.intervalFactory.isTop(a)) return false;
            return true;
        }

        return a.upper < b.lower;
    }

    protected lessThanOrEqual(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a)) return true;
        if (this.intervalFactory.isTop(a)) return this.intervalFactory.isTop(b);
        if (this.intervalFactory.isTop(b)) return true;
        if (this.intervalFactory.isBottom(b)) return false;
        return a.upper <= b.lower;
    }

    protected greaterThan(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a)) return false;
        if (this.intervalFactory.isTop(a)) return !(this.intervalFactory.isTop(b));
        if (this.intervalFactory.isTop(b)) return false;
        if (this.intervalFactory.isBottom(b)) return true;

        return a.lower > b.upper;

    }

    protected greaterThanOrEqual(a: Interval, b: Interval): boolean {
        if (this.intervalFactory.isBottom(a)) {
            return this.intervalFactory.isBottom(b);
        }
        if (this.intervalFactory.isTop(a)) {
            return true;
        }
        if (this.intervalFactory.isTop(b)) {
            return false;
        }
        if (this.intervalFactory.isBottom(b)) {
            return true;
        }
        if (a instanceof Interval && b instanceof Interval) {
            return a.lower >= b.upper;
        }
        return false;
    }
    // ------------------------------------------------------------------------------------------------------


    // GLB-LUB ----------------------------------------------------------------------------------------------
    private lubOfIntervals(a: Interval, b: Interval): Interval {
        if (this.intervalFactory.isBottom(a)) return b;
        if (this.intervalFactory.isBottom(b)) return a;
        if (this.intervalFactory.isTop(a) || this.intervalFactory.isTop(b)) return this.intervalFactory.Top;
        const lower = Math.min(a.lower, b.lower);
        const upper = Math.max(a.upper, b.upper);
        return this.intervalFactory.getInterval(lower, upper);
    }
    protected lub(states: Array<AbstractProgramState>): AbstractProgramState {

        if (states.length === 0) return AbstractProgramState.empty();

        const lubState = new AbstractProgramState();
        const allKeys = new Set<string>();

        // Collect all keys
        states.forEach(state => {
            for (var v of state.variables()) {
                allKeys.add(v);
            }
        });

        // Compute the lub for each key
        allKeys.forEach(key => {
            let lub: Interval | null = null;
            states.forEach(state => {
                if (state.has(key)) {
                    const interval = state.get(key);
                    lub = lub === null ? interval : this.lubOfIntervals(lub, interval);
                }
            });
            if (lub !== null) {
                lubState.set(key, lub as Interval, true); // Assuming lub is always an Interval
            }
        });


        return lubState;
    }
    private glbOfIntervals = (a: Interval, b: Interval): Interval => {
        if (this.intervalFactory.isTop(a)) return b;
        if (this.intervalFactory.isTop(b)) return a;
        if (this.intervalFactory.isBottom(a) || this.intervalFactory.isBottom(b)) return this.intervalFactory.Bottom;
        const lower = Math.max(a.lower, b.lower);
        const upper = Math.min(a.upper, b.upper);
        if (lower <= upper) {
            return this.intervalFactory.getInterval(lower, upper);
        } else {
            return this.intervalFactory.Bottom;
        }
    }
    protected glb(states: Array<AbstractProgramState>): AbstractProgramState {


        if (states.length === 0) return AbstractProgramState.empty();

        const glbState = new AbstractProgramState();
        const allKeys = new Set<string>();

        // Collect all keys
        states.forEach(state => {
            for (var v of state.variables()) {
                allKeys.add(v);
            }
        });

        // Compute the glb for each key
        allKeys.forEach(key => {
            let glb: Interval | null = null;
            states.forEach(state => {
                if (state.has(key)) {
                    const interval = state.get(key) as Interval;
                    glb = glb === null ? interval : this.glbOfIntervals(glb, interval);
                }
            });
            if (glb !== null) {
                glbState.set(key, glb as Interval, true); // Assuming glb is always an Interval
            }
        });

        return glbState;
    }
    // ------------------------------------------------------------------------------------------------------

    // WIDENING-NARROWING -----------------------------------------------------------------------------------
    protected widening(i1: Interval, i2: Interval): Interval {
        if (this.intervalFactory.isBottom(i1)) return i2;
        if (this.intervalFactory.isBottom(i2)) return i1;
        if (this.intervalFactory.isTop(i1) || this.intervalFactory.isTop(i2)) return this.intervalFactory.Top;
        const newLower = (i1.lower <= i2.lower) ? i1.lower : Math.max(...(this.thresholds!.filter(x => x <= i2.lower)), this.intervalFactory.getMin);
        const newUpper = (i1.upper >= i2.upper) ? i1.upper : Math.min(...(this.thresholds!.filter(x => x >= i2.upper)), this.intervalFactory.getMax);
        let ret = this.intervalFactory.getInterval(newLower, newUpper);
        return ret;
    }
    protected abstract_state_widening(a1: AbstractProgramState, a2: AbstractProgramState): AbstractProgramState {
        let widenedState = new AbstractProgramState();

        // Process variables in the previous state (a1)
        a1.variables().forEach((variable) => {
            if (a2.has(variable)) {
                // Get the intervals for the common variable
                let prevInterval = a1.get(variable);
                let currentInterval = a2.get(variable);
                // Apply the widening operator
                let widenedInterval = this.widening(prevInterval, currentInterval);
                // Set the widened interval in the new state
                widenedState.set(variable, widenedInterval, true);
            } else {
                // Keep the variable from a1 if it's not in a2
                widenedState.set(variable, a1.get(variable), true);
            }
        });

        // Process variables in the current state (a2) that are not in a1
        a2.variables().forEach((variable) => {
            if (!a1.has(variable)) {
                // Keep the variable from a2 if it's not in a1
                widenedState.set(variable, a2.get(variable), true);
            }
        });

        // Return the new widened state
        return widenedState;
    }
    protected narrowing(i1: Interval, i2: Interval): Interval {
        if (this.intervalFactory.isBottom(i1)) return i2;
        if (this.intervalFactory.isBottom(i2)) return i1;
        const newLower = this.intervalFactory.getMin >= i1.lower ? i2.lower : i1.lower;
        const newUpper = this.intervalFactory.getMax <= i1.upper ? i2.upper : i1.upper;
        return this.intervalFactory.getInterval(newLower, newUpper);
    }
    protected abstract_state_narrowing(a1: AbstractProgramState, a2: AbstractProgramState): AbstractProgramState {
        let narrowedState = new AbstractProgramState();

        // Process variables in the previous state (a1)
        a1.variables().forEach((variable) => {
            if (a2.has(variable)) {
                // Get the intervals for the common variable
                let prevInterval = a1.get(variable);
                let currentInterval = a2.get(variable);
                // Apply the narrowing operator
                let narrowedInterval = this.narrowing(prevInterval, currentInterval);
                // Set the narrowed interval in the new state
                narrowedState.set(variable, narrowedInterval, true);
            } else {
                // Keep the variable from a1 if it's not in a2
                narrowedState.set(variable, a1.get(variable), true);
            }
        });

        // Process variables in the current state (a2) that are not in a1
        a2.variables().forEach((variable) => {
            if (!a1.has(variable)) {
                // Keep the variable from a2 if it's not in a1
                narrowedState.set(variable, a2.get(variable), true);
            }
        });

        // Return the new narrowed state
        return narrowedState;
    }
    // ------------------------------------------------------------------------------------------------------

    // ALPHA-GAMMA ------------------------------------------------------------------------------------------
    // 𝛼(X) is the least interval containing X
    public alpha(c: number): Interval {
        return this.intervalFactory.getInterval(c, c);
    };
    // ------------------------------------------------------------------------------------------------------

    // ArithmeticOp -----------------------------------------------------------------------------------------
    protected op(i1: Interval, op: string, i2: Interval): Interval {
        if (this.intervalFactory.isBottom(i1) || this.intervalFactory.isBottom(i2))
            return this.intervalFactory.Bottom;
        switch (op) {
            case "+":
                return this.intervalFactory.getInterval(
                    i1.lower + i2.lower,
                    i1.upper + i2.upper
                );


            case "-":
                return this.intervalFactory.getInterval(
                    i1.lower + i2.upper,
                    i1.upper + i2.lower
                );


            case "*":
                let products: Array<number> = [
                    i1.lower * i2.lower, i1.lower * i2.upper,
                    i1.upper * i2.lower, i1.upper * i2.upper
                ];
                return this.intervalFactory.getInterval(Math.min(...products), Math.max(...products));


            case "/":
                if (1 <= i2.lower)
                    return this.intervalFactory.getInterval(
                        Math.min(i1.lower / i2.lower, i1.lower / i2.upper),
                        Math.max(i1.upper / i2.lower, i1.upper % i2.upper)
                    );
                if (i2.upper <= -1)
                    return this.intervalFactory.getInterval(
                        Math.min(i1.upper / i2.lower, i1.upper / i2.upper),
                        Math.max(i1.lower / i2.lower, i1.lower % i2.upper)
                    );
                return this.intervalFactory.union(
                    this.op(i1, "/", this.intervalFactory.intersect(i2, this.intervalFactory.getMoreThan(0))),
                    this.op(i1, "/", this.intervalFactory.intersect(i2, this.intervalFactory.getLessThan(0)))
                )
                
            default:
                throw Error("Op: undefined operator: " + op);
        }
    };
    // ------------------------------------------------------------------------------------------------------

    // A#-B#-D# ---------------------------------------------------------------------------------------------
    protected aSharp(expr: ArithmeticExpression, aState: AbstractProgramState): { state: AbstractProgramState, value: Interval } {
        if (expr instanceof ArithmeticBinaryOperator) {
            return {
                state: this.aSharp(expr.rightOperand, this.aSharp(expr.leftOperand, aState).state).state.copy(),
                value: this.op(this.aSharp(expr.leftOperand, aState).value, expr.operator.value, this.aSharp(expr.rightOperand, this.aSharp(expr.leftOperand, aState).state).value)
            }
        }
        if (expr instanceof ArithmeticUnaryOperator) {
            return {
                state: this.aSharp(expr, aState).state.copy(),
                value: this.intervalFactory.getInterval(-1 * this.aSharp(expr, aState).value.upper, -1 * this.aSharp(expr, aState).value.lower)
            }
        };
        if (expr instanceof Variable) {
            return { state: aState.copy(), value: aState.get(expr.name) };
        }
        if (expr instanceof Numeral) {
            return { state: aState.copy(), value: this.alpha(expr.value) };
        }
        if (expr instanceof IncrementOperator) {
            return {
                state: aState.copyWith(expr.variable.name, this.op(aState.get(expr.variable.name), '+', this.alpha(1))),
                value: this.op(aState.get(expr.variable.name), '+', this.alpha(1))
            };
        }
        if (expr instanceof DecrementOperator) {
            return {
                state: aState.copyWith(expr.variable.name, this.op(aState.get(expr.variable.name), '-', this.alpha(1))),
                value: this.op(aState.get(expr.variable.name), '-', this.alpha(1))
            };
        }
        throw Error("ASharp : Not an expression.");
    }
    protected bSharp(expr: BooleanExpression, aState: AbstractProgramState, negation: boolean = false): AbstractProgramState {
        if (expr instanceof Boolean) {
            return aState.copy();
        } else if (expr instanceof BooleanBinaryOperator) {
            if (expr.leftOperand instanceof Variable && expr.rightOperand instanceof Numeral) {
                switch (expr.operator.value) {
                    case "<=":
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MORE, ">")), aState, !negation);
                        if (aState.get(expr.leftOperand.name).lower <= expr.rightOperand.value) {
                            return aState.copyWith(
                                expr.leftOperand.name,
                                this.intervalFactory.getInterval(
                                    aState.get(expr.leftOperand.name).lower,
                                    Math.min(aState.get(expr.leftOperand.name).upper, expr.rightOperand.value)
                                )
                            );
                        } else {
                            return aState.copyWith(expr.leftOperand.name, this.intervalFactory.Bottom);
                        }
                    case "<":
                        // x < n : x <= n-1
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MOREEQ, ">=")), aState, !negation);
                        console.log(aState.get(expr.leftOperand.name).upper.toString(), expr.rightOperand.value);
                        if (aState.get(expr.leftOperand.name).lower < expr.rightOperand.value) {
                            return aState.copyWith(
                                expr.leftOperand.name,
                                this.intervalFactory.getInterval(
                                    aState.get(expr.leftOperand.name).lower,
                                    Math.max(aState.get(expr.leftOperand.name).upper, expr.rightOperand.value - 1)
                                )
                            );
                        } else {
                            return aState.copyWith(expr.leftOperand.name, this.intervalFactory.Bottom);
                        }
                    case ">=":
                        //  x >= n : n <= x 
                        // if x.b >= n [max(x.a, n)]
                        // else bottom
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.LESS, "<")), aState, !negation);
                        if (aState.get(expr.leftOperand.name).upper >= expr.rightOperand.value) {
                            return aState.copyWith(
                                expr.leftOperand.name,
                                this.intervalFactory.getInterval(
                                    Math.max(aState.get(expr.leftOperand.name).lower, expr.rightOperand.value),
                                    aState.get(expr.leftOperand.name).upper,
                                )
                            );
                        } else {
                            return aState.copyWith(expr.leftOperand.name, this.intervalFactory.Bottom);
                        }
                    case ">":
                        // x > n : x >= n + 1
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.LESSEQ, "<=")), aState, !negation);
                        return this.bSharp(
                            new BooleanBinaryOperator(
                                expr.leftOperand,
                                new ArithmeticBinaryOperator(
                                    expr.rightOperand,
                                    new Numeral(1),
                                    new Token(TokenType.MINUS, "+")
                                ),
                                new Token(TokenType.LESSEQ, ">=")
                            ),
                            aState.copy()
                        )
                    case "==":
                        // x = n : s[x->n] if a<=n<=b, bot otherwise
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.INEQ, "!=")), aState, !negation);
                        if (aState.get(expr.leftOperand.name).lower <= expr.rightOperand.value && expr.rightOperand.value <= aState.get(expr.leftOperand.name).upper) {
                            return aState.copyWith(expr.leftOperand.name, this.alpha(expr.rightOperand.value));
                        } else return AbstractProgramState.empty();
                    case "!=":
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.EQ, "==")), aState, !negation);
                        // x != n : (x < n) lub (x > n)
                        return this.lub([
                            this.bSharp(
                                new BooleanBinaryOperator(
                                    expr.leftOperand,
                                    expr.rightOperand,
                                    new Token(TokenType.LESS, "<")
                                ),
                                aState
                            ),
                            this.bSharp(
                                new BooleanBinaryOperator(
                                    expr.leftOperand,
                                    expr.rightOperand,
                                    new Token(TokenType.LESS, ">")
                                ),
                                aState
                            )
                        ]);
                    default:
                        throw Error(`bSharp: Unkwnown boolean binary operator: ${expr.operator.value}.`);
                }
            } else if (expr.leftOperand instanceof Variable && expr.rightOperand instanceof Variable) {
                switch (expr.operator.value) {
                    case "<=":
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MORE, ">")), aState, !negation);
                        if (aState.get(expr.leftOperand.name).lower <= aState.get(expr.rightOperand.name).upper) {
                            return aState.copyWith(
                                expr.leftOperand.name,
                                this.intervalFactory.getInterval(
                                    aState.get(expr.leftOperand.name).lower,
                                    Math.min(aState.get(expr.leftOperand.name).upper, aState.get(expr.rightOperand.name).upper)
                                )
                            ).copyWith(
                                expr.rightOperand.name,
                                this.intervalFactory.getInterval(
                                    Math.max(aState.get(expr.leftOperand.name).lower, aState.get(expr.rightOperand.name).lower),
                                    aState.get(expr.leftOperand.name).upper,
                                )
                            );
                        } else {
                            return AbstractProgramState.empty();
                        }
                    case ">":
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.LESSEQ, "<=")), aState, !negation);
                        // x > y : y + 1 <= x
                        return this.bSharp(
                            new BooleanBinaryOperator(
                                new ArithmeticBinaryOperator(
                                    expr.rightOperand,
                                    new Numeral(1),
                                    new Token(TokenType.PLUS, "+")
                                ),
                                expr.leftOperand,
                                new Token(TokenType.LESSEQ, "<=")
                            ),
                            aState.copy()
                        );
                    case ">=":
                        // x>= y : y<=x
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.LESS, "<")), aState, !negation);
                        return this.bSharp(
                            new BooleanBinaryOperator(
                                expr.rightOperand,
                                expr.leftOperand,
                                new Token(TokenType.LESSEQ, "<=")
                            ),
                            aState.copy()
                        );
                    case "<":
                        // x < y : x + 1 <=y
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MOREEQ, ">=")), aState, !negation);
                        return this.bSharp(
                            new BooleanBinaryOperator(
                                new ArithmeticBinaryOperator(
                                    expr.leftOperand,
                                    new Numeral(1),
                                    new Token(TokenType.PLUS, "+")
                                ),
                                expr.rightOperand,
                                new Token(TokenType.LESSEQ, "<=")
                            ),
                            aState.copy()
                        );
                    case "==":
                        // x = y : x <= y intersect y <= x
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.INEQ, "!=")), aState, !negation);
                        return this.glb([
                            this.bSharp(
                                new BooleanBinaryOperator(
                                    expr.leftOperand,
                                    expr.rightOperand,
                                    new Token(TokenType.LESSEQ, "<=")
                                ),
                                aState
                            ),
                            this.bSharp(
                                new BooleanBinaryOperator(
                                    expr.leftOperand,
                                    expr.rightOperand,
                                    new Token(TokenType.LESSEQ, "<=")
                                ),
                                aState
                            )
                        ])
                    case "!=":
                        // x != y : x < y lub y < x
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.EQ, "==")), aState, !negation);
                        return this.lub([
                            this.bSharp(
                                new BooleanBinaryOperator(
                                    expr.leftOperand,
                                    expr.rightOperand,
                                    new Token(TokenType.LESSEQ, "<=")
                                ),
                                aState
                            ),
                            this.bSharp(
                                new BooleanBinaryOperator(
                                    expr.leftOperand,
                                    expr.rightOperand,
                                    new Token(TokenType.LESSEQ, "<=")
                                ),
                                aState
                            )
                        ])
                    default:
                        throw Error(`bSharp: Unkwnown boolean binary operator: ${expr.operator.value}.`);
                }
            } else {
                return this.aSharp(expr.rightOperand, this.aSharp(expr.leftOperand, aState.copy()).state.copy()).state.copy();
            }
        } else if (expr instanceof BooleanUnaryOperator) {
            switch (expr.operator.value) {
                case "!":
                    return this.bSharp(expr.booleanExpression, aState.copy(), !negation);
                default:
                    throw Error(`bSharp: Unkwnown boolean unary operator: ${expr.operator.value}.`);
            }
        } else if (expr instanceof BooleanConcatenation) {
            switch (expr.operator.value) {
                case '&&':
                case '||':
                    return this.bSharp(expr.rightOperand, this.bSharp(expr.leftOperand, aState.copy()))
                default:
                    throw Error(`bSharp: Unkwnown boolean concatenation value : ${expr.operator.value}.`)
            }
        }
        throw Error("Unknown expression type.");
    }
    private thresholdsHunt(current: any): Array<number> {
        let thresholds: Array<number> = [];
        if (current instanceof ArithmeticExpression) {
            if (current instanceof Numeral) {
                thresholds.push(current.value);
                return thresholds;
            }
            if (current instanceof ArithmeticBinaryOperator) {
                thresholds = thresholds.concat(this.thresholdsHunt(current.leftOperand));
                thresholds = thresholds.concat(this.thresholdsHunt(current.rightOperand));
            }
            if (current instanceof ArithmeticUnaryOperator)
                thresholds = thresholds.concat(this.thresholdsHunt(current.operand));
        } else if (current instanceof BooleanExpression) {
            if (current instanceof BooleanBinaryOperator || current instanceof BooleanConcatenation) {
                thresholds = thresholds.concat(this.thresholdsHunt(current.leftOperand));
                thresholds = thresholds.concat(this.thresholdsHunt(current.rightOperand));
            }
            if (current instanceof BooleanUnaryOperator)
                thresholds = thresholds.concat(this.thresholdsHunt(current.booleanExpression));
        }
        else {
            //Arithmetic Expressions
            //Statements
            if (current instanceof Assignment) thresholds = this.thresholdsHunt(current.value);

            if (current instanceof Concatenation) {
                thresholds = thresholds.concat(this.thresholdsHunt(current.firstStatement));
                thresholds = thresholds.concat(this.thresholdsHunt(current.secondStatement));
            }
            if (current instanceof IfThenElse) {
                thresholds = thresholds.concat(this.thresholdsHunt(current.guard));
                thresholds = thresholds.concat(this.thresholdsHunt(current.thenBranch));
                thresholds = thresholds.concat(this.thresholdsHunt(current.elseBranch));
            }
            if (current instanceof Loop) {
                thresholds = thresholds.concat(this.thresholdsHunt(current.guard));
                thresholds = thresholds.concat(this.thresholdsHunt(current.body));
            }
            if (current instanceof ForLoop) {
                thresholds = thresholds.concat(this.thresholdsHunt(current.initialStatement));
                thresholds = thresholds.concat(this.thresholdsHunt(current.incrementStatement));
            }
        }
        return thresholds;
    }
    private thresholds: Array<number> | undefined = undefined;
    public dSharp(stmt: Statement, aState: AbstractProgramState): AbstractProgramState {
        if (this.thresholds === undefined)
            this.thresholds = ([this.intervalFactory.getMin, this.intervalFactory.getMax].concat(this.thresholdsHunt(stmt))).sort();

        if (stmt instanceof Assignment) {
            stmt.setPreCondition(aState.copy());
            let ret = (this.aSharp(stmt.variable, aState.copy()).state.copyWith(stmt.variable.name, this.aSharp(stmt.value, aState).value));
            stmt.setPostCondition(ret.copy());
            return ret;
        }

        if (stmt instanceof Skip) {
            stmt.setPreCondition(aState.copy());
            stmt.setPostCondition(aState.copy());
            return aState.copy();
        }

        if (stmt instanceof Concatenation) {
            stmt.setPreCondition(aState.copy());
            let ret = this.dSharp(stmt.secondStatement, this.dSharp(stmt.firstStatement, aState.copy()).copy());
            stmt.setPostCondition(ret.copy());
            return ret;
        }

        if (stmt instanceof IfThenElse) {
            stmt.setPreCondition(aState.copy());
            let ret = this.lub([
                this.bSharp(stmt.guard, this.dSharp(stmt.thenBranch, aState.copy())),
                this.bSharp(stmt.guard, this.dSharp(stmt.elseBranch, aState.copy()), true),
            ])
            stmt.setPostCondition(ret.copy());
            return ret;
        }

        if (stmt instanceof WhileLoop) {
            let currentState: AbstractProgramState = aState.copy();
            let prevState: AbstractProgramState;
            stmt.setPreCondition(currentState.copy());
            do {
                prevState = currentState.copy();

                //currentState = prevState LUB D#[body](B#[guard])
                currentState = this.lub([
                    prevState,
                    this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState))
                ]);

                if (this._widening) currentState = this.abstract_state_widening(prevState, currentState);

            } while (!prevState.isEqualTo(currentState));
            stmt.setInvariant(currentState);

            if (this._narrowing) {
                prevState = aState.copy();
                do {
                    currentState = this.abstract_state_narrowing(
                        currentState,
                        this.lub([
                            prevState,
                            this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState))
                        ])
                    );
                    prevState = currentState.copy();
                } while (!prevState.isEqualTo(currentState));
            }
            let ret = this.bSharp(stmt.guard, currentState, true);
            stmt.setPostCondition(ret);
            return ret;
        }

        if (stmt instanceof RepeatUntilLoop) {
            // B#[b](lfp(λx.s# ∨ S​(D#[S]∘B#[not b])x)) ∘ D#[S]s
            let currentState: AbstractProgramState = this.dSharp(stmt.body, aState.copy());
            let prevState: AbstractProgramState;
            stmt.setPreCondition(aState.copy())
            do {
                prevState = currentState.copy();
                currentState = this.lub([
                    prevState,
                    this.dSharp(stmt.body, this.bSharp(stmt.guard, prevState, true))
                ]);
                if (this._widening) currentState = this.abstract_state_widening(prevState, currentState);
            } while (!prevState.isEqualTo(currentState));
            stmt.setInvariant(currentState.copy());

            if (this._narrowing) {
                prevState = aState.copy();
                do {
                    currentState = this.abstract_state_narrowing(
                        currentState,
                        this.lub([
                            prevState,
                            this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState, true))
                        ])
                    );
                    prevState = currentState.copy();
                } while (!prevState.isEqualTo(currentState));
            }
            let ret = this.bSharp(stmt.guard, currentState);
            stmt.setPostCondition(ret.copy());
            return ret;
        }

        if (stmt instanceof ForLoop) {
            // Initialization: Execute S
            let currentState: AbstractProgramState = this.dSharp(stmt.initialStatement, aState);
            let prevState: AbstractProgramState;
            stmt.setPreCondition(aState.copy());
            do {
                prevState = currentState;
                currentState = this.lub([
                    prevState,
                    this.dSharp(stmt.incrementStatement, this.dSharp(stmt.body, this.bSharp(stmt.guard, prevState)))]);
                if (this._widening) currentState = this.abstract_state_widening(prevState, currentState);
            } while (!prevState.isEqualTo(currentState));
            stmt.setInvariant(currentState.copy());
            if (this._narrowing) {
                prevState = aState.copy();
                do {
                    currentState = this.abstract_state_narrowing(
                        currentState,
                        this.lub([
                            prevState,
                            this.dSharp(stmt.incrementStatement, this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState)))
                        ]));
                    prevState = currentState.copy();
                } while (!prevState.isEqualTo(currentState));
            }
            let ret = this.bSharp(stmt.guard, currentState, true);
            stmt.setPostCondition(ret.copy());
            return ret;
        }

        throw Error("Dshapr : Unknown Statement.");
    }
    // ------------------------------------------------------------------------------------------------------

}