import { parseProgram} from "../../../logic/parser";
import { BooleanBinaryOperator } from "../../../model/while+/boolean_expression";
import { Concatenation, ForLoop, RepeatUntilLoop, Statement, WhileLoop, } from "../../../model/while+/statement";
import { AbstractProgramState } from "../model/types/abstract_state";
import { IntervalDomain } from "./examples/IntervalDomain/Domains/interval_domain";
import { Interval } from "./examples/IntervalDomain/types/interval";
import { IntervalFactory } from "./examples/IntervalDomain/types/interval_factory";

export class AI_INT {

    public static api = {
        WebApp: (program: string, min: number, max: number, widening: boolean, narrowing: boolean): {
            ast: Statement;
            annotatedProgram: string;
            dSharpResult: AbstractProgramState<Interval>;
        } => {
            let _IntervalDomain = new IntervalDomain(new IntervalFactory({ m: min, n: max }));
            let ast = parseProgram(program);
            console.log(ast.annotatedProgram(0));
            ast.iter(node => {
                if (node instanceof BooleanBinaryOperator) {  node.eleq0(); }
            })
            let asx: Statement = ast.map(node => {
                if (node instanceof ForLoop) {
                    return new Concatenation(
                        node.initialStatement.clone(),
                        new WhileLoop(
                            new Concatenation(
                                node.body.clone(),
                                node.incrementStatement.clone()
                            ),
                            node.guard.clone()
                        )
                    )
                } else if (node instanceof RepeatUntilLoop) {
                    return new Concatenation(
                        node.body.clone(),
                        new WhileLoop(
                            node.body.clone(),
                            node.guard.negate()
                        )
                    )
                }
                return node.clone()
            }) as Statement;
            let dSharpResult = _IntervalDomain.S(
                asx,
                new AbstractProgramState(),
                { widening: widening, narrowing: narrowing }
            );
            return {
                ast: ast,
                dSharpResult: dSharpResult,
                annotatedProgram: asx.annotatedProgram(0),
            }
        },
        Pdf: (program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean) => {

        }
    };

}
