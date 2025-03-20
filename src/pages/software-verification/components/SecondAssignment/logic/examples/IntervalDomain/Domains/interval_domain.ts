import { NumericalAbstractDomainGC } from "../../../../model/domains/GC/numerical_abstract_domain_gc";
import { PowerSet_I } from "../../../../model/types/power_set";
import { IntervalFactory } from "../types/interval_factory";
import { Bottom, Interval } from "../types/interval";
import { EmptySet, Set } from "../types/set";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from "../../../../../../model/while+/arithmetic_expression";
import { BooleanBinaryOperator, BooleanConcatenation, BooleanExpression, BooleanUnaryOperator } from "../../../../../../model/while+/boolean_expression";
import { Statement } from "../../../../../../model/while+/statement";
import { AbstractProgramState } from "../../../../model/types/abstract_state";
import { BNode, BTree, LNode, UNode } from "../types/b-tree";

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
    narrowing = (x: Interval, y: Interval, options?: { tresholds?: Array<number>; }): Interval => {
        return x
    };
    SharpFunctions = {
        E: (expr: ArithmeticExpression, aState: AbstractProgramState<Interval>): { state: AbstractProgramState<Interval>, value: Interval } => {
            if (expr instanceof Numeral) {
                return { state: aState.clone(), value: this.alpha(new Set(expr.value, expr.value)) };
            }
            if (expr instanceof Variable) {
                return { state: aState.clone(), value: aState.lookup(expr.name) };
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
                    state: aState.clone().update(expr.variable.name, this.BinaryOperators.add(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))),
                    value: this.BinaryOperators.add(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))
                };
            }
            if (expr instanceof DecrementOperator) {
                return {
                    state: aState.clone().update(expr.variable.name, this.BinaryOperators.subtract(aState.lookup(expr.variable.name), this.alpha(new Set(1, 1)))),
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

            const hc4Revise = (expression: ArithmeticExpression, constraint: Interval): Interval => {
                const computedIntervals = new Map<ArithmeticExpression, Interval>();

                // Step 1: Bottom-up evaluation
                const evaluate = (node: ArithmeticExpression, aState: AbstractProgramState<Interval>): Interval => {
                    if (node instanceof Numeral) {
                        return this._IntervalFactory.new(node.value, node.value);
                    }
                    if (node instanceof Variable) {
                        return aState.lookup(node.name);
                    }
                    const p = new Map<string, (x: Interval, y: Interval) => Interval>([
                        ["+", (x, y) => this.BinaryOperators.add(x, y)],
                        ["-", (x, y) => this.BinaryOperators.subtract(x, y)],
                        ["*", (x, y) => this.BinaryOperators.multiply(x, y)],
                        ["/", (x, y) => this.BinaryOperators.divide(x, y)]
                    ]);
                    if (node instanceof ArithmeticBinaryOperator) {
                        const left = this.SharpFunctions.E(node.leftOperand, aState);
                        const right = this.SharpFunctions.E(node.rightOperand, aState);
                        // return (left, right, node.operator.value);
                    }
                    if (node instanceof ArithmeticUnaryOperator) {
                        // const operand = evaluate(node.operand);
                        // return applyUnaryOperator(operand, node.operator.value);
                    }
                    throw new Error("Unsupported expression node");
                }

                // const rootInterval = evaluate(expression);
                // computedIntervals.set(expression, rootInterval.intersect(constraint));

                // Step 3: Top-down propagation
                function refine(node: ArithmeticExpression, refinedInterval: Interval) {
                    computedIntervals.set(node, refinedInterval);

                    if (node instanceof ArithmeticBinaryOperator) {
                        const left = computedIntervals.get(node.leftOperand)!;
                        const right = computedIntervals.get(node.rightOperand)!;
                        // const [newLeft, newRight] = backwardRefine(left, right, refinedInterval, node.operator.value);
                        // refine(node.leftOperand, newLeft);
                        // refine(node.rightOperand, newRight);
                    }
                    if (node instanceof ArithmeticUnaryOperator) {
                        const operand = computedIntervals.get(node.operand)!;
                        // refine(node.operand, backwardRefineUnary(operand, refinedInterval, node.operator.value));
                    }
                }

                // refine(expression, computedIntervals.get(expression)!);
                return computedIntervals.get(expression)!;
            }


            if (expr instanceof BooleanBinaryOperator) {
            }
        },
        S: (expr: Statement, aState: AbstractProgramState<Interval>): any => {

        },
    }



    private propagationAlgorithm(expr: BooleanBinaryOperator, aState: AbstractProgramState<Interval>): AbstractProgramState<Interval> {
        // PRE: expr is in canonical form

        // Firstly, the expressions are evaluated by induction on the syntax tree, bottom-up,
        // from leaves (variables and constants) to the expression root, similarly to SharpFunctions.E in Fig. 4.1;
        // however, we remember the abstract value at each syntax tree node


        // let R = evaluate(expr, aState);
        // this.SetOperators.intersection(R, this._IntervalFactory.getLessThanOrEqual(0));
        // return propagate(R, aState); 

        const evaluate = (expr: ArithmeticExpression, aState: AbstractProgramState<Interval>): BTree<Interval> => {
            if (expr instanceof Variable) {
                return new LNode(this.SharpFunctions.E(expr, aState).value, "Var");
            }
            if (expr instanceof Numeral) {
                return new LNode(this.SharpFunctions.E(expr, aState).value, "Num");
            }
            if (expr instanceof ArithmeticBinaryOperator) {
                return new BNode(
                    this.SharpFunctions.E(expr, aState).value,
                    evaluate(expr.leftOperand, aState),
                    evaluate(expr.rightOperand, aState),
                    expr.operator.value
                )
            }
            if (expr instanceof ArithmeticUnaryOperator) {
                return new UNode(
                    this.SharpFunctions.E(expr, aState).value,
                    evaluate(expr.operand, aState),
                )
            }
            if (expr instanceof IncrementOperator) {
                return new LNode(
                    this.SharpFunctions.E(expr, aState).value,
                    "Inc"
                )
            }
            if (expr instanceof DecrementOperator) {
                return new LNode(
                    this.SharpFunctions.E(expr, aState).value,
                    "Dec"
                )
            }
            throw Error(`Propagation algorithm: unkwnown arithmetic expression(${expr.toString()}).`)
        }

        let AVT = evaluate(expr, aState);

        // Secondly, the interval at the root is intersected with the condition for the test to be true, 
        // in this case [−∞, 0], as the result of the expression should be negative.
        AVT.data = this.SetOperators.intersection(AVT.data, this._IntervalFactory.getLessThanOrEqual(0));

        // Thirdly, this information is propagated backwards, top-down towards the leaves,
        const propagate = (node: BTree<Interval>): void => {
            const BackwardOperators = {
                leqZero: (x: Interval): Interval => {
                    return this._IntervalFactory.intersect(x, this._IntervalFactory.getLessThanOrEqual(0));
                },
                minus: (x: Interval, y: Interval): Interval => {
                    return this._IntervalFactory.intersect(x, this.BinaryOperators.minus(y));
                },
                add: (x: Interval, y: Interval, r: Interval) => {
                    return {
                        x: this._IntervalFactory.intersect(x, (this.BinaryOperators.subtract(r, y))),
                        y: this._IntervalFactory.intersect(y, (this.BinaryOperators.subtract(r, x))),
                    };
                },
                subtract: (x: Interval, y: Interval, r: Interval) => {
                    return {
                        x: this._IntervalFactory.intersect(x, (this.BinaryOperators.add(r, y))),
                        y: this._IntervalFactory.intersect(y, (this.BinaryOperators.subtract(x, r))),
                    };
                },
                multiply: (x: Interval, y: Interval, r: Interval) => {
                    return {
                        x: this._IntervalFactory.intersect(x, (this.BinaryOperators.divide(r, y))),
                        y: this._IntervalFactory.intersect(y, (this.BinaryOperators.divide(r, x))),
                    };
                },
                divide: (x: Interval, y: Interval, r: Interval) => {
                    return {
                        x: this._IntervalFactory.intersect(x, (this.BinaryOperators.multiply(r, y))),
                        y: this._IntervalFactory.intersect(
                            y,
                            this._IntervalFactory.union(
                                this.BinaryOperators.divide(r, this.BinaryOperators.add(r, this._IntervalFactory.new(-1, 1))),
                                this._IntervalFactory.new(0, 0)
                            )
                        )
                    };
                }
            };
            if (node instanceof UNode)
                node.child.data = BackwardOperators.minus(node.data, node.child.data)
            if (node instanceof BNode) {

                let aux;
                switch (node.label) {
                    case "+":
                        aux = BackwardOperators.add(node.left.data, node.right.data, node.data);
                        node.left.data = aux.x;
                        node.left.data = aux.y;
                        break;
                    case "-":
                        aux = BackwardOperators.subtract(node.left.data, node.right.data, node.data);
                        node.left.data = aux.x;
                        node.left.data = aux.y;
                        break;
                    case "*":
                        aux = BackwardOperators.multiply(node.left.data, node.right.data, node.data);
                        node.left.data = aux.x;
                        node.left.data = aux.y;
                        break;
                    case "/":
                        aux = BackwardOperators.divide(node.left.data, node.right.data, node.data);
                        node.left.data = aux.x;
                        node.left.data = aux.y;
                        break;
                }
            }
        }

    }
}