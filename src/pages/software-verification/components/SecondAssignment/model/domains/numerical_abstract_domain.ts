import { TokenType } from "../../../../model/token";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Variable } from "../../../../model/while+/arithmetic_expression";
import { BooleanBinaryOperator, BooleanConcatenation, BooleanExpression } from "../../../../model/while+/boolean_expression";
import { Statement } from "../../../../model/while+/statement";
import { BinaryNode, BinaryTree, LeafNode, UnaryNode, VariableNode } from "../../logic/examples/IntervalDomain/types/b-tree";
import { AbstractProgramState } from "../types/abstract_state";
import { AbstractValue } from "../types/abstract_value";
import { ConcreteValue } from "../types/concrete_value";
import { StateAbstractDomain } from "./state_abstract_domain";

export abstract class NumericalAbstractDomain<T extends AbstractValue> {
    protected _StateAbstractDomain = new StateAbstractDomain<T>(this);

    abstract leq: (X: T, Y: T) => boolean;
    abstract gamma: (X: T) => ConcreteValue;
    abstract Bottom: T;
    abstract Top: T;

    abstract Operators: {
        minus: (X: T) => T;
        add: (X: T, Y: T) => T,
        subtract: (X: T, Y: T) => T,
        multiply: (X: T, Y: T) => T,
        divide: (X: T, Y: T) => T,
    };

    abstract SetOperators: {
        union: (X: T, Y: T) => T;
        intersection: (X: T, Y: T) => T;
    };

    abstract BackwardOperators: {
        leqZero: (x: T) => T;
        minus: (x: T, y: T) => T;
        add: (x: T, y: T, r: T) => { x: T, y: T, };
        subtract: (x: T, y: T, r: T) => { x: T, y: T, };
        multiply: (x: T, y: T, r: T) => { x: T, y: T, };
        divide: (x: T, y: T, r: T) => { x: T, y: T, };
    }


    abstract widening: (x: T, y: T, options?: { tresholds?: Array<number>, },) => T


    // Sharp functions
    public E(expr: ArithmeticExpression, aState: AbstractProgramState<T>): any {
        return this.Top;
    };
    public C(bExpr: BooleanExpression, aState: AbstractProgramState<T>): AbstractProgramState<T> {
        let canonical = bExpr.canonicalForm() as BooleanBinaryOperator | BooleanConcatenation;

        const evaluate = (aExpr: ArithmeticExpression, aState: AbstractProgramState<T>): BinaryTree<T> => {

            if (aExpr instanceof ArithmeticBinaryOperator) {
                return new BinaryNode(
                    this.E(aExpr, aState).value,
                    evaluate(aExpr.leftOperand, this.E(aExpr, aState).state),
                    evaluate(aExpr.rightOperand, this.E(aExpr, aState).state),
                    aExpr.operator.value
                )
            }
            if (aExpr instanceof ArithmeticUnaryOperator) {
                return new UnaryNode(
                    this.E(aExpr, aState).value,
                    evaluate(aExpr.operand, this.E(aExpr, aState).state),
                )
            }
            if (aExpr instanceof IncrementOperator || aExpr instanceof DecrementOperator) {
                return new LeafNode(
                    this.E(aExpr, aState).value,
                )
            }
            return new VariableNode(this.E(aExpr, aState).value, aExpr instanceof Variable ? aExpr.name : "");
        }

        const intersect = (node: BinaryTree<T>): void => {
            node.data = this.BackwardOperators.leqZero(node.data);
        }

        const propagate = (node: BinaryTree<T>): void => {
            if (node instanceof UnaryNode) {
                node.child.data = this.BackwardOperators.minus(node.data, node.child.data)
                propagate(node.child);
            }
            if (node instanceof BinaryNode) {
                let aux;
                switch (node.operator) {
                    case "+":
                        aux = this.BackwardOperators.add(node.left.data, node.right.data, node.data);
                        node.left.data = aux.x;
                        node.left.data = aux.y;
                        break;
                    case "-":
                        aux = this.BackwardOperators.subtract(node.left.data, node.right.data, node.data);
                        node.left.data = aux.x;
                        node.left.data = aux.y;
                        break;
                    case "*":
                        aux = this.BackwardOperators.multiply(node.left.data, node.right.data, node.data);
                        node.left.data = aux.x;
                        node.left.data = aux.y;
                        break;
                    case "/":
                        aux = this.BackwardOperators.divide(node.left.data, node.right.data, node.data);
                        node.left.data = aux.x;
                        node.left.data = aux.y;
                        break;
                }
                propagate(node.left);
                propagate(node.right);
            }
        }

        const update = (aState: AbstractProgramState<T>, AVT: BinaryTree<T>): void => {
            if (AVT instanceof BinaryNode) {
                update(aState, AVT.left);
                update(aState, AVT.right);
            }
            if (AVT instanceof UnaryNode) update(aState, AVT.child);
            if (AVT instanceof VariableNode) aState.update(AVT.label, AVT.data)
        }

        if (canonical instanceof BooleanBinaryOperator) {
            let AVT = evaluate(canonical.leftOperand, aState);
            intersect(AVT);
            propagate(AVT);
            let ret = aState.clone();
            update(ret, AVT);
            return ret;
        }

        if (canonical instanceof BooleanConcatenation) {
            if (canonical.operator.type === TokenType.AND)
                return this._StateAbstractDomain.SetOperators.union(
                    this.C(canonical.leftOperand, aState),
                    this.C(canonical.leftOperand, aState)
                )
            if (canonical.operator.type === TokenType.OR)
                return this._StateAbstractDomain.SetOperators.intersection(
                    this.C(canonical.leftOperand, aState),
                    this.C(canonical.leftOperand, aState)
                )
        }

        throw Error();
    };
    public S(expr: Statement<T>, aState: AbstractProgramState<T>, flags: { widening: boolean, narrowing: boolean }): AbstractProgramState<T> {
        let ret = aState.clone();
        ret.variables().forEach((v, i) => { ret.update(v, this.Top) });
        return ret;
    };

}

