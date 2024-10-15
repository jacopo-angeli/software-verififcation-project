
import { Assignment, Concatenation, DecrementOperator, ForLoop, IfThenElse, IncrementOperator, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../../../model/while+/statement";
import { ProgramState } from "../model/program_state";
import A from "./a";
import B from "./b";
class Sds {
    static eval(stmt: Statement, state: ProgramState, iterationLimit: number): ProgramState {

        if (stmt instanceof Assignment) {
            let aux: ProgramState = state.copy();
            aux.set(stmt.variable.name, A.eval(stmt.value, state));
            return aux;
        }

        if (stmt instanceof Skip) {
            return state.copy();
        }

        if (stmt instanceof Concatenation) {
            return Sds.eval(stmt.secondStatement, Sds.eval(stmt.firstStatement, state, iterationLimit), iterationLimit);
        }

        if (stmt instanceof IfThenElse) {
            if (B.eval(stmt.guard, state))
                return Sds.eval(stmt.thenBranch, state.copy(), iterationLimit);
            else
                return Sds.eval(stmt.elseBranch, state.copy(), iterationLimit);
        }

        if (stmt instanceof WhileLoop) {
            // <while (guard) {body}, state>
            //      < if guard then (body; while (guard) {body}) else skip, s> 
            console.log(`while: ${state.toString()}`);
            if (B.eval(stmt.guard, state) && iterationLimit > 0) {
                let result: ProgramState = Sds.eval(stmt.body, state.copy(), iterationLimit);
                return Sds.eval(stmt, result, iterationLimit - 1);
            }
            else return state.copy();
        }

        if (stmt instanceof RepeatUntilLoop) {
            // < repeat {body} until (guard), state > =>
            //      <body; if b then skip else (repeat {body} until (guard)), state>
            console.log(`repeat-until: ${state.toString()}`);
            let result: ProgramState = Sds.eval(stmt.body, state.copy(), iterationLimit);
            if (B.eval(stmt.guard, result) && iterationLimit > 0) return result;
            else return Sds.eval(stmt, result, iterationLimit - 1);
        }

        if (stmt instanceof ForLoop) {
            //  < for (initialStatement, guard, incrementStatement) { body }, state> =>
            //      <initialStatement; if b then (body; incrementStatement; for (skip, body, incrementStatement)) else skip, state> 
            console.log(`For-Loop: ${state.toString()}`);
            let result: ProgramState = Sds.eval(stmt.initialStatement, state.copy(), iterationLimit);
            if (B.eval(stmt.guard, result) && iterationLimit > 0) {
                result = Sds.eval(
                    new Concatenation(
                        new Concatenation(
                            stmt.body,
                            stmt.incrementStatement
                        ),
                        new ForLoop(
                            stmt.body,
                            stmt.guard,
                            new Skip(),
                            stmt.incrementStatement
                        ),
                    ),
                    result.copy(),
                    iterationLimit - 1,
                );
            }
            return result;
        }

        if (stmt instanceof IncrementOperator) {
            let aux: ProgramState = state.copy();
            aux.set(stmt.variable.name, state.get(stmt.variable.name) + 1);
            return aux;
        }
        if (stmt instanceof DecrementOperator) {
            let aux: ProgramState = state.copy();
            aux.set(stmt.variable.name, state.get(stmt.variable.name) - 1);
            return aux;
        }

        throw Error;

    };
}
export default Sds;