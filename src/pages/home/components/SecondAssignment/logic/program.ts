import { Lexer } from "../../../logic/lexer";
import { parseAbstractState, parseProgram} from "../../../logic/parser";
import { BooleanBinaryOperator } from "../../../model/while+/boolean_expression";
import { Concatenation, ForLoop, RepeatUntilLoop, Statement, WhileLoop, } from "../../../model/while+/statement";
import { AbstractProgramState } from "../model/types/abstract_state";
import { IntervalDomain } from "./examples/IntervalDomain/Domains/interval_domain";
import { Interval } from "./examples/IntervalDomain/types/interval";
import { IntervalFactory } from "./examples/IntervalDomain/types/interval_factory";

export class AI_INT {

    public static api = {
        WebApp: (program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean): {
            ast: Statement;
            initialState: AbstractProgramState<Interval>;
            annotatedProgram: string;
            dSharpResult: AbstractProgramState<Interval>;
        } => {
            let _IntervalFactory = new IntervalFactory({ m: min, n: max });
            let _IntervalDomain = new IntervalDomain(new IntervalFactory({ m: min, n: max }));
            let ast = parseProgram(program);
            console.log(ast.annotatedProgram(0));
            ast.iter(node => {
                if (node instanceof BooleanBinaryOperator) {  node.eleq0(); }
            })
            let initState = parseAbstractState(Lexer.tokenize(initialState), _IntervalFactory);
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
                initState,
                { widening: widening, narrowing: narrowing }
            );
            return {
                ast: ast,
                initialState: parseAbstractState(Lexer.tokenize(initialState), _IntervalFactory),
                dSharpResult: dSharpResult,
                annotatedProgram: asx.annotatedProgram(0),
            }
        },
        Pdf: (program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean) => {

        }
    };

}
