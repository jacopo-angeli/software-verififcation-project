import { NumericalAbstractDomainGC } from "../../../../model/domains/GC/numerical_abstract_domain_gc";
import { PowerSet_I } from "../../../../model/types/power_set";
import { IntervalFactory } from "../types/interval_factory";
import { Bottom, Interval } from "../types/interval";
import { EmptySet, Set } from "../types/set";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from "../../../../../../model/while+/arithmetic_expression";
import { BooleanBinaryOperator, BooleanConcatenation, BooleanExpression, BooleanUnaryOperator } from "../../../../../../model/while+/boolean_expression";
import { Statement } from "../../../../../../model/while+/statement";
import { AbstractProgramState } from "../../../../model/types/abstract_state";
import { TokenType } from "../../../../../../model/token";

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
                const p = new Map<string, (x: Interval, y: Interval) => Interval>([
                    ["+", (x, y) => this.BinaryOperators.add(x, y)],
                    ["-", (x, y) => this.BinaryOperators.subtract(x, y)],
                    ["*", (x, y) => this.BinaryOperators.multiply(x, y)],
                    ["/", (x, y) => this.BinaryOperators.divide(x, y)]
                ]);
                return {
                    state: this.SharpFunctions.E(expr.rightOperand, this.SharpFunctions.E(expr.leftOperand, aState).state).state,
                    value: p.get(expr.operator.value)!(this.SharpFunctions.E(expr.leftOperand, aState).value, this.SharpFunctions.E(expr.rightOperand, this.SharpFunctions.E(expr.leftOperand, aState).state).value)
                }
            }
            if (expr instanceof IncrementOperator) {
                return {
                    state: aState.update(expr.variable.name, this.BinaryOperators.add(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))),
                    value: this.BinaryOperators.add(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))
                };
            }
            if (expr instanceof DecrementOperator) {
                return {
                    state: aState.update(expr.variable.name, this.BinaryOperators.subtract(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))),
                    value: this.BinaryOperators.subtract(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))
                };
            }


            // TODO: Define an independent fall back definition overridable. 
            return {
                state: aState,
                value: this.Top,
            }
        },
        C: (expr: BooleanExpression, aState: AbstractProgramState<Interval>): AbstractProgramState<Interval> => {
            aState = aState.clone();
            if ((expr instanceof BooleanBinaryOperator) && (expr.leftOperand instanceof Variable && expr.rightOperand instanceof Numeral)) {
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
                    case "<":
                        // x < n : x <= n-1
                        if (negation)
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, expr.rightOperand, new Token(TokenType.MOREEQ, ">=")), aState, !negation);
                        if (aState.lookup(expr.leftOperand.name).lower < expr.rightOperand.value) {
                            return this.bSharp(new BooleanBinaryOperator(expr.leftOperand, new Numeral(expr.rightOperand.value - 1), new Token(TokenType.LESSEQ, "<=")), aState);
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
                                new Numeral(expr.rightOperand.value + 1),
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
            }
            if ((expr instanceof BooleanBinaryOperator) && (expr.leftOperand instanceof Variable && expr.rightOperand instanceof Variable)) {
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

            }
            if (expr instanceof BooleanBinaryOperator)
                return this.SharpFunctions.E(expr.rightOperand, this.SharpFunctions.E(expr.leftOperand, aState).state).state;

            if (expr instanceof BooleanUnaryOperator) {
                if (expr.operator.type === TokenType.NOT)
                    return this.SharpFunctions.C(expr.booleanExpression, aState, !negation);
                throw Error(`bSharp: Unkwnown boolean unary operator: ${expr.operator.value}.`);
            }
            if (expr instanceof BooleanConcatenation) {
                switch (expr.operator.value) {
                    case '&&':
                    case '||':
                        return this.bSharp(expr.rightOperand, this.bSharp(expr.leftOperand, aState.copy()))
                    default:
                        throw Error(`bSharp: Unkwnown boolean concatenation value : ${expr.operator.value}.`)
                }
            }

            throw Error("Unknown expression type.");
        },
        S: (expr: Statement, aState: AbstractProgramState<Interval>): any => {

        },
    }




}