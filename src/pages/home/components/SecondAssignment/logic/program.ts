import { Lexer } from "../../../logic/lexer";
import { Parser } from "../../../logic/parser";
import { Token } from "../../../model/token";
import { BooleanBinaryOperator } from "../../../model/while+/boolean_expression";
import { Statement, } from "../../../model/while+/statement";
import { AbstractProgramState } from "../model/types/abstract_state";
import { IntervalDomain } from "./examples/IntervalDomain/Domains/interval_domain";
import { Interval } from "./examples/IntervalDomain/types/interval";
import { IntervalFactory } from "./examples/IntervalDomain/types/interval_factory";

export class AI_INT {

    public static api = {
        WebApp: (program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean): {
            tokenList: Token[];
            ast: Statement;
            initialState: AbstractProgramState<Interval>;
            annotatedProgram: string;
            dSharpResult: AbstractProgramState<Interval>;
        } => {
            let _IntervalFactory = new IntervalFactory({ m: min, n: max });
            let _IntervalDomain = new IntervalDomain(new IntervalFactory({ m: min, n: max }));
            let tokenList = Lexer.tokenize(program);
            let ast = Parser.parse(tokenList);
            ast.iter(node =>{
                if(node instanceof BooleanBinaryOperator) node.eleq0();
            })
            let initState = Parser.parseAbstractState(Lexer.tokenize(initialState), _IntervalFactory);
            let dSharpResult = _IntervalDomain.S(
                ast,
                initState,
                { widening: widening, narrowing: narrowing }
            );
            return {
                tokenList: tokenList,
                ast: ast,
                initialState: Parser.parseAbstractState(Lexer.tokenize(initialState), _IntervalFactory),
                dSharpResult: dSharpResult,
                annotatedProgram: ast.annotatedProgram(0),
            }
        },
        Pdf: (program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean) => {

        }
    };

}
