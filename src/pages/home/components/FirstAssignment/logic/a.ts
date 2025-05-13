import { ProgramState } from "../model/program_state";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from "../../../model/while+/arithmetic_expression";
class A {
    static eval(expr: ArithmeticExpression, state: ProgramState): { state: ProgramState, value: number } {
        if (expr instanceof ArithmeticBinaryOperator) {
            let returnState: ProgramState = A.eval(expr.rightOperand, A.eval(expr.leftOperand, state.copy()).state).state;
            switch (expr.operator.value) {
                case "+":
                    return {
                        state: returnState,
                        value: A.eval(expr.leftOperand, state).value + A.eval(expr.rightOperand, state).value
                    }
                case "-":
                    return {
                        state: returnState,
                        value: A.eval(expr.leftOperand, state).value - A.eval(expr.rightOperand, state).value
                    }
                case "*":
                    return {
                        state: returnState,
                        value: A.eval(expr.leftOperand, state).value * A.eval(expr.rightOperand, state).value
                    }
                case "/":
                    if (A.eval(expr.rightOperand, state).value === 0) throw Error(`Runtime Error : Division by 0 (${expr.toString()}).`)
                    return {
                        state: returnState,
                        value: Math.floor(A.eval(expr.leftOperand, state).value / A.eval(expr.rightOperand, state).value)
                    }
                default:
                    throw Error(`Runtime Error: Illegal arithmetic binary operation (${expr.operator.value})`);
            }
        }

        if (expr instanceof ArithmeticUnaryOperator) {
            switch (expr.operator.value) {
                case "-":
                    return {
                        state: A.eval(expr.operand, state).state,
                        value: (-1) * A.eval(expr.operand, state).value
                    };
                default:
                    throw Error(`Runtime Error :Illegal arithmetic unary operation (${expr.operator.value}).`);
            }
        }

        if (expr instanceof Variable) {
            return {
                state: state.copy(),
                value: state.get(expr.name)
            }
        }

        if (expr instanceof Numeral) {
            return {
                state: state.copy(),
                value: expr.value
            }
        }

        if (expr instanceof IncrementOperator) {
            return {
                state: state.copyWith(expr.variable.name, state.get(expr.variable.name) + 1),
                value: state.get(expr.variable.name) + 1
            }
        }

        if (expr instanceof DecrementOperator) {
            return {
                state: state.copyWith(expr.variable.name, state.get(expr.variable.name) - 1),
                value: state.get(expr.variable.name) - 1
            }
        }

        throw Error(`Runtime Error: arithmetic expression evaluation failed (${expr.toString()}).`);
    }
}

export default A;