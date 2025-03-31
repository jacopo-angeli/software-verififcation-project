import { Boolean, BooleanBinaryOperator, BooleanExpression, BooleanUnaryOperator } from "../../../model/while+/boolean_expression";
import { ProgramState } from "../model/program_state";
import A from "./a";
class B {
    static eval(expr: BooleanExpression, state: ProgramState): { state: ProgramState, value: boolean } {
        if (expr instanceof BooleanBinaryOperator) {
            if (expr.concatenation()) {
                let returnState: ProgramState = B.eval(expr.rightOperand as BooleanExpression, B.eval(expr.leftOperand as BooleanExpression, state).state).state;
                switch (expr.operator.value) {
                    case "&&":
                        return {
                            state: returnState,
                            value: B.eval(expr.leftOperand as BooleanExpression, state).value && B.eval(expr.rightOperand as BooleanExpression, B.eval(expr.leftOperand as BooleanExpression, state).state).value
                        }
                    case "||":
                        return {
                            state: returnState,
                            value: B.eval(expr.leftOperand as BooleanExpression, state).value || B.eval(expr.rightOperand as BooleanExpression, B.eval(expr.leftOperand as BooleanExpression, state).state).value
                        }
                    default:
                        throw Error(`Unknown boolean concatenation : ${expr.operator.value}.`);
                }
            }
            else {

                let returnState: ProgramState = A.eval(expr.rightOperand, A.eval(expr.leftOperand, state.copy()).state).state;
                switch (expr.operator.value) {
                    case "==":
                        return {
                            state: returnState,
                            value: A.eval(expr.leftOperand, state).value === A.eval(expr.rightOperand, A.eval(expr.leftOperand, state.copy()).state).value
                        }
                    case "!=":
                        return {
                            state: returnState,
                            value: A.eval(expr.leftOperand, state).value !== A.eval(expr.rightOperand, A.eval(expr.leftOperand, state.copy()).state).value
                        }
                    case "<":
                        return {
                            state: returnState,
                            value: A.eval(expr.leftOperand, state).value < A.eval(expr.rightOperand, A.eval(expr.leftOperand, state.copy()).state).value
                        }
                    case "<=":
                        return {
                            state: returnState,
                            value: A.eval(expr.leftOperand, state).value <= A.eval(expr.rightOperand, A.eval(expr.leftOperand, state.copy()).state).value
                        }
                    case ">":
                        return {
                            state: returnState,
                            value: A.eval(expr.leftOperand, state).value > A.eval(expr.rightOperand, A.eval(expr.leftOperand, state.copy()).state).value
                        }
                    case ">=":
                        return {
                            state: returnState,
                            value: A.eval(expr.leftOperand, state).value >= A.eval(expr.rightOperand, A.eval(expr.leftOperand, state.copy()).state).value
                        }
                    default:
                        throw Error(`Illegal boolean binary operator : ${expr.operator.value}.`);
                }
            }
        }

        if (expr instanceof BooleanUnaryOperator) {
            return {
                state: B.eval(expr.booleanExpression, state.copy()).state,
                value: !(B.eval(expr.booleanExpression, state.copy()).value)
            };
        }

        if (expr instanceof Boolean) {
            return {
                state: state.copy(),
                value: expr.value
            };
        }
        throw Error(`B: Unknown Boolean Expression.`);
    };
};
export default B;