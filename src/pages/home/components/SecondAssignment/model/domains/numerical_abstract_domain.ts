import { TokenType } from "../../../../model/token";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Variable } from "../../../../model/while+/arithmetic_expression";
import { BooleanBinaryOperator, BooleanExpression } from "../../../../model/while+/boolean_expression";
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
    abstract narrowing: (x: T, y: T) => T


    // Sharp functions
    public E(expr: ArithmeticExpression, aState: AbstractProgramState<T>): any {
        return this.Top;
    };
    public C(bExpr: BooleanExpression, aState: AbstractProgramState<T>): AbstractProgramState<T> {
        console.log("C function -----------------------")

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
            if (aExpr instanceof Variable) {
                return new VariableNode(this.E(aExpr, aState).value, aExpr.name);
            } else {
                return new LeafNode(this.E(aExpr, aState).value)
            }
        }

        const intersect = (node: BinaryTree<T>): BinaryTree<T> => {
            return node.clone(this.BackwardOperators.leqZero(node.data));
        }

        const propagate = (node: BinaryTree<T>): BinaryTree<T> => {
            if (node instanceof VariableNode) {
                return new VariableNode<T>(node.data, node.label);
            }
            if (node instanceof LeafNode) {
                return new LeafNode<T>(node.data);
            }
            if (node instanceof UnaryNode) {
                let ret = node.clone(node.data)
                ret.child = propagate(node.child.clone(this.BackwardOperators.minus(node.child.data, node.data)));
                return ret;
            }
            if (node instanceof BinaryNode) {
                let aux;
                switch (node.operator) {
                    case "+":
                        aux = this.BackwardOperators.add(node.left.data, node.right.data, node.data);
                        break;
                    case "-":
                        aux = this.BackwardOperators.subtract(node.left.data, node.right.data, node.data);
                        break;
                    case "*":
                        aux = this.BackwardOperators.multiply(node.left.data, node.right.data, node.data);
                        break;
                    case "/":
                        aux = this.BackwardOperators.divide(node.left.data, node.right.data, node.data);
                        break;
                };
                let ret = node.clone(node.data);
                ret.left = propagate(node.left.clone(aux?.x));
                ret.right = propagate(node.right.clone(aux?.y));
                return ret;
            }
            throw Error();
        }


        const Body = (bExpr: BooleanExpression, aState: AbstractProgramState<T>): AbstractProgramState<T> => {
            if (bExpr instanceof BooleanBinaryOperator) {
                if (bExpr.leftOperand instanceof ArithmeticExpression && bExpr.rightOperand instanceof ArithmeticExpression) {
                    let ret = aState.clone();
                    console.log("Evaluation");
                    console.log((evaluate(bExpr.leftOperand, ret)).toString());
                    console.log("Intersection")
                    console.log((intersect(evaluate(bExpr.leftOperand, ret))).toString());
                    console.log("Propagation")
                    console.log(propagate(intersect(evaluate(bExpr.leftOperand, ret))).toString());
                    (propagate(intersect(evaluate(bExpr.leftOperand, ret)))).iter((node) => {
                        if (node instanceof VariableNode && this.leq(node.data, ret.lookup(node.label))) {
                            ret = ret.update(node.label, node.data)
                        }
                    })
                    return ret;
                } else if (bExpr.leftOperand instanceof BooleanExpression && bExpr.rightOperand instanceof BooleanExpression) {
                    if (bExpr.operator.type === TokenType.AND)
                        return this._StateAbstractDomain.SetOperators.union(
                    this.C(bExpr.leftOperand, aState),
                    this.C(bExpr.leftOperand, aState)
                )
                if (bExpr.operator.type === TokenType.OR)
                        return this._StateAbstractDomain.SetOperators.intersection(
                            this.C(bExpr.leftOperand, aState),
                            this.C(bExpr.leftOperand, aState)
                        )
                }
                throw Error();
            }
            throw Error();
        }
        var prev = aState.clone(); 
        var current = aState.clone();
        do{
            prev = Body(bExpr, current.clone());
            current = Body(bExpr, prev.clone())
        }while(!this._StateAbstractDomain.eq(prev, current))

        console.log("Fixpoint found:", current.toString())
        console.log("C function --------------------end");
        console.log("\n");
        return current.clone();
    };
    public S(expr: Statement, aState: AbstractProgramState<T>, flags: { widening: boolean, narrowing: boolean }): AbstractProgramState<T> {
        let ret = aState.clone();
        ret.variables().forEach((v, i) => { ret.update(v, this.Top) });
        return ret;
    };

}

