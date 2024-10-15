import { Boolean, BooleanBinaryOperator, BooleanConcatenation, BooleanExpression, BooleanUnaryOperator } from "../../../model/while+/boolean_expression";
import { ProgramState } from "../model/program_state";
import A from "./a";
class B{
    static eval(expr: BooleanExpression, state: ProgramState): boolean {
        if (expr instanceof BooleanBinaryOperator) {
            switch (expr.operator.value) {
                case "==":
                    return A.eval(expr.leftOperand, state) === A.eval(expr.rightOperand, state);
                case "!=":
                    return A.eval(expr.leftOperand, state) !== A.eval(expr.rightOperand, state);
                case "<":
                    return A.eval(expr.leftOperand, state) < A.eval(expr.rightOperand, state);
                case "<=":
                    return A.eval(expr.leftOperand, state) <= A.eval(expr.rightOperand, state);
                case ">":
                    return A.eval(expr.leftOperand, state) > A.eval(expr.rightOperand, state);
                case ">=":
                    return A.eval(expr.leftOperand, state) >= A.eval(expr.rightOperand, state);
                default:
                    throw Error(`Illegal boolean binary operator : ${expr.operator.value}.`);
            }
        }
    
        if (expr instanceof BooleanConcatenation) {
            switch (expr.operator.value) {
                case "&&":
                    return B.eval(expr.leftOperand, state) && B.eval(expr.rightOperand, state);
                case "||":
                    return B.eval(expr.leftOperand, state) || B.eval(expr.rightOperand, state);
                default:
                    throw Error(`Unknown boolean concatenation : ${expr.operator.value}.`);
            }
        }
    
        if (expr instanceof BooleanUnaryOperator) {
            return !(B.eval(expr.booleanExpression, state));
        }
    
        if(expr instanceof Boolean){
            return expr.value;
        }
        throw Error(`B: Unknown Boolean Expression.`);
    };
};
export default B;