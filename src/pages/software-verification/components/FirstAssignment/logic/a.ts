import { ProgramState } from "../model/program_state";
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, Numeral, Variable } from "../../../model/while+/arithmetic_expression";
class A{
    static eval(expr: ArithmeticExpression, state: ProgramState): number {
        if (expr instanceof ArithmeticBinaryOperator) {
            switch (expr.operator.value) {
                case "+":
                    return A.eval(expr.leftOperand, state) + A.eval(expr.rightOperand, state);
                case "-":
                    return A.eval(expr.leftOperand, state) - A.eval(expr.rightOperand, state);
                case "*":
                    return A.eval(expr.leftOperand, state) * A.eval(expr.rightOperand, state);
                case "%":
                    return A.eval(expr.leftOperand, state) % A.eval(expr.rightOperand, state);
                default:
                    throw Error(`Illegal arithmetic binary operation : ${expr.operator.value}.`);
            }
        }

        if (expr instanceof ArithmeticUnaryOperator) {
            switch (expr.operator.value) {
                case "-":
                    return (-1) * A.eval(expr.operand, state);
                default:
                    throw Error(`Illegal arithmetic binary opertation : ${expr.operator.value}.`);
            }
        }
        
        if (expr instanceof Variable) {
            var res = state.get(expr.name);
            if (res) return res;
            else return 0;
        }
    
        if (expr instanceof Numeral) {
            return expr.value;
        }
        throw Error;
    }
}

export default A;