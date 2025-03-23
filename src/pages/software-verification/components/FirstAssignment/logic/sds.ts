
import { Assignment, Concatenation, ForLoop, IfThenElse, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../../../model/while+/statement";
import { AbstractValue } from "../../SecondAssignment/model/types/abstract_value";
import { ProgramState } from "../model/program_state";
import A from "./a";
import B from "./b";
class Sds {
    static eval<T extends AbstractValue>(stmt: Statement<T>, state: ProgramState, iterationLimit: number): ProgramState {

        if (stmt instanceof Assignment) {
            return (A.eval(stmt.value, state).state).copyWith(stmt.variable.name, A.eval(stmt.value, state).value);
        }

        if (stmt instanceof Skip) {
            return state.copy();
        }

        if (stmt instanceof Concatenation) {
            return Sds.eval(stmt.secondStatement, Sds.eval(stmt.firstStatement, state, iterationLimit), iterationLimit);
        }

        if (stmt instanceof IfThenElse) {
            if (B.eval(stmt.guard, state).value)
                return Sds.eval(stmt.thenBranch, state.copy(), iterationLimit);
            else
                return Sds.eval(stmt.elseBranch, state.copy(), iterationLimit);
        }

        if (stmt instanceof WhileLoop) {
            // FIX F where F g = cond(Bds[guard], g o Sds[body], id) 
            //                                            ^
            // Non eseguo uno while intero altrimenti starei comunque utilizzando la ricorsione
            // Ogni interazione eseguo Sds su un condizionale che esegue il corpo del ciclo nel
            // nel caso di guardia a true. Eseguendo lo stesso comportamento della regola orig-
            // inale
            let current = state.copy();
            let prev: ProgramState;
            do {
                console.log(`while: ${current.toString()}`);
                prev = current.copy();
                current = Sds.eval(new IfThenElse(stmt.guard, stmt.body, new Skip()), prev.copy(), iterationLimit - 1);
                iterationLimit--;
            } while (!prev.equalsTo(current) && iterationLimit > 0)
            return current;
        }

        if (stmt instanceof RepeatUntilLoop) {
            // FIX F o Sds[body]
            // where F g = cond(Bds[guard], id, g o Sds[body])
            let current = Sds.eval(stmt.body, state.copy(), iterationLimit);
            let prev: ProgramState;
            do {
                console.log(`repeat-until: ${current.toString()}`);
                prev = current.copy();
                current = Sds.eval(new IfThenElse(stmt.guard, new Skip(), stmt.body), prev.copy(), iterationLimit - 1);
                iterationLimit--;
            } while (!prev.equalsTo(current) && iterationLimit > 0)
            return current;
        }

        if (stmt instanceof ForLoop) {
            //  Sds[for(initial, guard, increment){ body }] = (FIX F) o Sds[increment]
            //  where F g = cond(Bds[guard], g o Sds[increment] o Sds[body], id)
            let current = Sds.eval(stmt.initialStatement, state.copy(), iterationLimit);
            let prev: ProgramState;
            do {
                console.log(`for-loop: ${current.toString()}`);
                prev = current.copy();
                current = Sds.eval(new IfThenElse(stmt.guard, new Concatenation(stmt.body, stmt.incrementStatement), new Skip()), prev.copy(), iterationLimit);
                iterationLimit--;
            } while (!prev.equalsTo(current) && iterationLimit > 0)
            return current;
        }

        throw Error(`Unknown statement type: ${stmt.toString()}`);

    };
}
export default Sds;