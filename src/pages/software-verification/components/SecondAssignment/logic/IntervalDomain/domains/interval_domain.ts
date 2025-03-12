import { ArithmeticBinaryOperator, ArithmeticUnaryOperator, ArithmeticExpression, Numeral, Variable, IncrementOperator, DecrementOperator } from "../../../../../model/while+/arithmetic_expression";
import { BooleanExpression, Boolean, BooleanBinaryOperator, BooleanUnaryOperator, BooleanConcatenation } from "../../../../../model/while+/boolean_expression";
import { Assignment, Concatenation, ForLoop, IfThenElse, Loop, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../../../../../model/while+/statement";
import { Token, TokenType } from "../../../../../model/token";
import { Interval } from "../types/interval";
import { IntervalAbstractStateDomain } from "./abstract_state_domain";
import { IntervalFactory } from "../factories/interval_factory";
import { IntervalAbstractProgramState } from "../types/state";
import { NumericalAbstractDomain } from "../../../model/domains/numerical_abstract_domain";

export class IntervalDomain extends NumericalAbstractDomain<Interval> {

    constructor(
        protected _IntervalFactory: IntervalFactory,
    ) { super(); }

    protected _AbstracStateDomain: IntervalAbstractStateDomain = new IntervalAbstractStateDomain(this);

    // ORDERING ---------------------------------------------------------------------------------------------
    protected equals(a: Interval, b: Interval): boolean {
        if (this._IntervalFactory.isBottom(a) && this._IntervalFactory.isBottom(b)) return true;
        if (this._IntervalFactory.isTop(a) && this._IntervalFactory.isTop(b)) return true;
        return a.lower === b.lower && a.upper === b.upper;
    }

    protected notEquals(a: Interval, b: Interval): boolean {
        return !this.equals(a, b);
    }

    protected lessThan(a: Interval, b: Interval): boolean {
        if (this._IntervalFactory.isBottom(a)) return !(this._IntervalFactory.isBottom(b));
        if (this._IntervalFactory.isBottom(b)) return false;

        // top < v
        // v.isBottom()    => false
        // v.isTop()       => false
        // v anything else => false
        if (this._IntervalFactory.isTop(a)) return false;

        // v < top
        // v.isBottom()    => true
        // v.isTop()       => false
        // v anything else => true
        if (this._IntervalFactory.isTop(b)) {
            if (this._IntervalFactory.isTop(a)) return false;
            return true;
        }

        return a.upper < b.lower;
    }

    protected lessThanOrEqual(a: Interval, b: Interval): boolean {
        if (this._IntervalFactory.isBottom(a)) return true;
        if (this._IntervalFactory.isTop(a)) return this._IntervalFactory.isTop(b);
        if (this._IntervalFactory.isTop(b)) return true;
        if (this._IntervalFactory.isBottom(b)) return false;
        return a.upper <= b.lower;
    }

    protected greaterThan(a: Interval, b: Interval): boolean {
        if (this._IntervalFactory.isBottom(a)) return false;
        if (this._IntervalFactory.isTop(a)) return !(this._IntervalFactory.isTop(b));
        if (this._IntervalFactory.isTop(b)) return false;
        if (this._IntervalFactory.isBottom(b)) return true;

        return a.lower > b.upper;

    }

    protected greaterThanOrEqual(a: Interval, b: Interval): boolean {
        if (this._IntervalFactory.isBottom(a)) {
            return this._IntervalFactory.isBottom(b);
        }
        if (this._IntervalFactory.isTop(a)) {
            return true;
        }
        if (this._IntervalFactory.isTop(b)) {
            return false;
        }
        if (this._IntervalFactory.isBottom(b)) {
            return true;
        }
        if (a instanceof Interval && b instanceof Interval) {
            return a.lower >= b.upper;
        }
        return false;
    }
    // ------------------------------------------------------------------------------------------------------


    // GLB-LUB ----------------------------------------------------------------------------------------------
    public lub(a: Interval, b: Interval): Interval {
        if (this._IntervalFactory.isBottom(a)) return b;
        if (this._IntervalFactory.isBottom(b)) return a;
        if (this._IntervalFactory.isTop(a) || this._IntervalFactory.isTop(b)) return this._IntervalFactory.Top;
        const lower = Math.min(a.lower, b.lower);
        const upper = Math.max(a.upper, b.upper);
        return this._IntervalFactory.getInterval(lower, upper);
    }

    public glb(a: Interval, b: Interval): Interval {
        if (this._IntervalFactory.isTop(a)) return b;
        if (this._IntervalFactory.isTop(b)) return a;
        if (this._IntervalFactory.isBottom(a) || this._IntervalFactory.isBottom(b)) return this._IntervalFactory.Bottom;
        const lower = Math.max(a.lower, b.lower);
        const upper = Math.min(a.upper, b.upper);
        if (lower <= upper) {
            return this._IntervalFactory.getInterval(lower, upper);
        } else {
            return this._IntervalFactory.Bottom;
        }
    }

    // ------------------------------------------------------------------------------------------------------

    // WIDENING-NARROWING -----------------------------------------------------------------------------------
    public widening(x: Interval, y: Interval): Interval {
        if (this._IntervalFactory.isBottom(x)) return y;
        if (this._IntervalFactory.isBottom(y)) return x;
        if (this._IntervalFactory.isTop(x) || this._IntervalFactory.isTop(y)) return this._IntervalFactory.Top;
        const newLower = (x.lower <= y.lower) ? x.lower : Math.max(...(this.thresholds!.filter(x => x <= y.lower)), this._IntervalFactory.getMin);
        const newUpper = (x.upper >= y.upper) ? x.upper : Math.min(...(this.thresholds!.filter(x => x >= y.upper)), this._IntervalFactory.getMax);
        let ret = this._IntervalFactory.getInterval(newLower, newUpper);
        return ret;
    }

    public narrowing(x: Interval, y: Interval): Interval {
        if (this._IntervalFactory.isBottom(x)) return y;
        if (this._IntervalFactory.isBottom(y)) return x;
        const newLower = this._IntervalFactory.getMin >= x.lower ? y.lower : x.lower;
        const newUpper = this._IntervalFactory.getMax <= x.upper ? y.upper : x.upper;
        return this._IntervalFactory.getInterval(newLower, newUpper);
    }

    // ------------------------------------------------------------------------------------------------------

    // ALPHA-GAMMA ------------------------------------------------------------------------------------------
    public alpha(c: number): Interval {
        return this._IntervalFactory.getInterval(c, c);
    };
    // ------------------------------------------------------------------------------------------------------

    // ArithmeticOp -----------------------------------------------------------------------------------------
    protected op(x: Interval, op: string, y: Interval): Interval {
        if (this._IntervalFactory.isBottom(x) || this._IntervalFactory.isBottom(y))
            return this._IntervalFactory.Bottom;
        switch (op) {
            case "+":
                return this._IntervalFactory.getInterval(
                    x.lower + y.lower,
                    x.upper + y.upper
                );


            case "-":
                return this._IntervalFactory.getInterval(
                    x.lower - y.upper,
                    x.upper - y.lower
                );


            case "*":
                let products: Array<number> = [
                    x.lower * y.lower, x.lower * y.upper,
                    x.upper * y.lower, x.upper * y.upper
                ];
                return this._IntervalFactory.getInterval(Math.min(...products), Math.max(...products));


            case "/":
                if (1 <= y.lower)
                    return this._IntervalFactory.getInterval(
                        Math.min(x.lower / y.lower, x.lower / y.upper),
                        Math.max(x.upper / y.lower, x.upper / y.upper)
                    );
                if (y.upper <= -1)
                    return this._IntervalFactory.getInterval(
                        Math.min(x.upper / y.lower, x.upper / y.upper),
                        Math.max(x.lower / y.lower, x.lower / y.upper)
                    );
                return this._IntervalFactory.union(
                    this.op(x, "/", this._IntervalFactory.intersect(y, this._IntervalFactory.getMoreThan(0))),
                    this.op(x, "/", this._IntervalFactory.intersect(y, this._IntervalFactory.getLessThan(0)))
                )

            default:
                throw Error("Op: undefined operator: " + op);
        }
    };
    // ------------------------------------------------------------------------------------------------------

    // A#-B#-D# ---------------------------------------------------------------------------------------------
    protected aSharp(expr: ArithmeticExpression, aState: IntervalAbstractProgramState): { state: IntervalAbstractProgramState, value: Interval } {
        if (expr instanceof Numeral) {
            return { state: aState.copy(), value: this.alpha(expr.value) };
        }
        if (expr instanceof Variable) {
            return { state: aState.copy(), value: aState.lookup(expr.name) };
        }
        if (expr instanceof ArithmeticUnaryOperator) {
            return {
                state: this.aSharp(expr, aState).state.copy(),
                value: this._IntervalFactory.getInterval(-1 * this.aSharp(expr, aState).value.upper, -1 * this.aSharp(expr, aState).value.lower)
            }
        };
        if (expr instanceof ArithmeticBinaryOperator) {
            return {
                state: this.aSharp(expr.rightOperand, this.aSharp(expr.leftOperand, aState).state).state.copy(),
                value: this.op(this.aSharp(expr.leftOperand, aState).value, expr.operator.value, this.aSharp(expr.rightOperand, this.aSharp(expr.leftOperand, aState).state).value)
            }
        }
        if (expr instanceof IncrementOperator) {
            return {
                state: aState.update(expr.variable.name, this.op(aState.lookup(expr.variable.name), '+', this.alpha(1))),
                value: this.op(aState.lookup(expr.variable.name), '+', this.alpha(1))
            };
        }
        if (expr instanceof DecrementOperator) {
            return {
                state: aState.update(expr.variable.name, this.op(aState.lookup(expr.variable.name), '-', this.alpha(1))),
                value: this.op(aState.lookup(expr.variable.name), '-', this.alpha(1))
            };
        }
        throw Error(`ASharp : Not an expression (${expr.toString()}).`);
    }

    protected bSharp(expr: BooleanExpression, aState: IntervalAbstractProgramState, negation: boolean = false): IntervalAbstractProgramState {
        if (expr instanceof Boolean) {
            return aState.copy();
        } else if (expr instanceof BooleanBinaryOperator) {
            if (expr.leftOperand instanceof Variable && expr.rightOperand instanceof Numeral) {
                switch (expr.operator.value) {
                    case "<=":
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MORE, ">")), aState, !negation);
                        if (aState.lookup(expr.leftOperand.name).lower <= expr.rightOperand.value) {
                            return aState.update(
                                expr.leftOperand.name,
                                this._IntervalFactory.getInterval(
                                    aState.lookup(expr.leftOperand.name).lower,
                                    Math.min(aState.lookup(expr.leftOperand.name).upper, expr.rightOperand.value)
                                )
                            );
                        } else {
                            return aState.update(expr.leftOperand.name, this._IntervalFactory.Bottom);
                        }
                    case "<":
                        // x < n : x <= n-1
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MOREEQ, ">=")), aState, !negation);
                        if (aState.lookup(expr.leftOperand.name).lower < expr.rightOperand.value) {
                            return aState.update(
                                expr.leftOperand.name,
                                this._IntervalFactory.getInterval(
                                    aState.lookup(expr.leftOperand.name).lower,
                                    Math.max(aState.lookup(expr.leftOperand.name).upper, expr.rightOperand.value - 1)
                                )
                            );
                        } else {
                            return aState.update(expr.leftOperand.name, this._IntervalFactory.Bottom);
                        }
                    case ">=":
                        //  x >= n : n <= x 
                        // if x.b >= n [max(x.a, n)]
                        // else bottom
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.LESS, "<")), aState, !negation);
                        if (aState.lookup(expr.leftOperand.name).upper >= expr.rightOperand.value) {
                            return aState.update(
                                expr.leftOperand.name,
                                this._IntervalFactory.getInterval(
                                    Math.max(aState.lookup(expr.leftOperand.name).lower, expr.rightOperand.value),
                                    aState.lookup(expr.leftOperand.name).upper,
                                )
                            );
                        } else {
                            return aState.update(expr.leftOperand.name, this._IntervalFactory.Bottom);
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
                        if (aState.lookup(expr.leftOperand.name).lower <= expr.rightOperand.value && expr.rightOperand.value <= aState.lookup(expr.leftOperand.name).upper) {
                            return aState.update(expr.leftOperand.name, this.alpha(expr.rightOperand.value));
                        } else return aState.update(expr.leftOperand.name, this._IntervalFactory.Bottom);
                    case "!=":
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.EQ, "==")), aState, !negation);
                        // x != n : (x < n) lub (x > n)
                        return this._AbstracStateDomain.lub(
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
                        );
                    default:
                        throw Error(`bSharp: Unkwnown boolean binary operator: ${expr.operator.value}.`);
                }
            } else if (expr.leftOperand instanceof Variable && expr.rightOperand instanceof Variable) {
                switch (expr.operator.value) {
                    case "<=":
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MORE, ">")), aState, !negation);
                        if (aState.lookup(expr.leftOperand.name).lower <= aState.lookup(expr.rightOperand.name).upper) {
                            return aState.update(
                                expr.leftOperand.name,
                                this._IntervalFactory.getInterval(
                                    aState.lookup(expr.leftOperand.name).lower,
                                    Math.min(aState.lookup(expr.leftOperand.name).upper, aState.lookup(expr.rightOperand.name).upper)
                                )
                            ).update(
                                expr.rightOperand.name,
                                this._IntervalFactory.getInterval(
                                    Math.max(aState.lookup(expr.leftOperand.name).lower, aState.lookup(expr.rightOperand.name).lower),
                                    aState.lookup(expr.leftOperand.name).upper,
                                )
                            );
                        } else {
                            return aState.update(expr.leftOperand.name, this._IntervalFactory.Bottom).update(expr.rightOperand.name, this._IntervalFactory.Bottom);
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
                        return this._AbstracStateDomain.glb(
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
                        )
                    case "!=":
                        // x != y : x < y lub y < x
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.EQ, "==")), aState, !negation);
                        return this._AbstracStateDomain.lub(
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
                        )
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

    public dSharp(stmt: Statement, aState: IntervalAbstractProgramState, flags: { widening: boolean, narrowing: boolean } = { widening: false, narrowing: false }): IntervalAbstractProgramState {
        if (this.thresholds === undefined)
            this.thresholds = ([this._IntervalFactory.getMin, this._IntervalFactory.getMax].concat(this.thresholdsHunt(stmt))).sort();

        if (stmt instanceof Assignment) {
            stmt.setPreCondition(aState.copy());
            let ret = (this.aSharp(stmt.variable, aState.copy()).state.update(stmt.variable.name, this.aSharp(stmt.value, aState).value));
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
            let ret = this._AbstracStateDomain.lub(
                this.bSharp(stmt.guard, this.dSharp(stmt.thenBranch, aState.copy())),
                this.bSharp(stmt.guard, this.dSharp(stmt.elseBranch, aState.copy()), true),
            )
            stmt.setPostCondition(ret.copy());
            return ret;
        }

        if (stmt instanceof WhileLoop) {
            let currentState: IntervalAbstractProgramState = aState.copy();
            let prevState: IntervalAbstractProgramState;
            stmt.setPreCondition(currentState.copy());
            do {
                prevState = currentState.copy();

                //currentState = prevState LUB D#[body](B#[guard])
                currentState = this._AbstracStateDomain.lub(
                    prevState,
                    this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState), flags)
                );

                if (flags.widening) currentState = this._AbstracStateDomain.widening(prevState, currentState);

            } while (!this._AbstracStateDomain.equal(prevState, currentState));
            stmt.setInvariant(currentState);

            if (flags.narrowing) {
                prevState = aState.copy();
                do {
                    currentState = this._AbstracStateDomain.narrowing(
                        currentState,
                        this._AbstracStateDomain.lub(
                            prevState,
                            this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState))
                        )
                    );
                    prevState = currentState.copy();
                } while (!this._AbstracStateDomain.equal(prevState, currentState));
            }
            let ret = this.bSharp(stmt.guard, currentState, true);
            stmt.setPostCondition(ret);
            return ret;
        }

        if (stmt instanceof RepeatUntilLoop) {
            // B#[b](lfp(λx.s# ∨ S​(D#[S]∘B#[not b])x)) ∘ D#[S]s
            let currentState: IntervalAbstractProgramState = this.dSharp(stmt.body, aState.copy());
            let prevState: IntervalAbstractProgramState;
            stmt.setPreCondition(aState.copy())
            do {
                prevState = currentState.copy();
                currentState = this._AbstracStateDomain.lub(
                    prevState,
                    this.dSharp(stmt.body, this.bSharp(stmt.guard, prevState, true))
                );
                if (flags.widening) currentState = this._AbstracStateDomain.widening(prevState, currentState);
            } while (!this._AbstracStateDomain.equal(prevState, currentState));
            stmt.setInvariant(currentState.copy());

            if (flags.narrowing) {
                prevState = aState.copy();
                do {
                    currentState = this._AbstracStateDomain.narrowing(
                        currentState,
                        this._AbstracStateDomain.lub(
                            prevState,
                            this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState, true))
                        )
                    );
                    prevState = currentState.copy();
                } while (!this._AbstracStateDomain.equal(prevState, currentState));
            }
            let ret = this.bSharp(stmt.guard, currentState);
            stmt.setPostCondition(ret.copy());
            return ret;
        }

        if (stmt instanceof ForLoop) {
            // Initialization: Execute S
            let currentState: IntervalAbstractProgramState = this.dSharp(stmt.initialStatement, aState);
            let prevState: IntervalAbstractProgramState;
            stmt.setPreCondition(aState.copy());
            do {
                prevState = currentState;
                currentState = this._AbstracStateDomain.lub(
                    prevState,
                    this.dSharp(stmt.incrementStatement, this.dSharp(stmt.body, this.bSharp(stmt.guard, prevState)))
                );
                if (flags.narrowing) currentState = this._AbstracStateDomain.widening(prevState, currentState);
            } while (!this._AbstracStateDomain.equal(prevState, currentState));
            stmt.setInvariant(currentState.copy());
            if (flags.narrowing) {
                prevState = aState.copy();
                do {
                    currentState = this._AbstracStateDomain.narrowing(
                        currentState,
                        this._AbstracStateDomain.lub(
                            prevState,
                            this.dSharp(stmt.incrementStatement, this.dSharp(stmt.body, this.bSharp(stmt.guard, currentState)))
                        )
                    );
                    prevState = currentState.copy();
                } while (!this._AbstracStateDomain.equal(prevState, currentState));
            }
            let ret = this.bSharp(stmt.guard, currentState, true);
            stmt.setPostCondition(ret.copy());
            return ret;
        }

        throw Error("Dshapr : Unknown Statement.");
    }
    // ------------------------------------------------------------------------------------------------------

}