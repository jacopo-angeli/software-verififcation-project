import { Lexer } from "../../../logic/lexer";
import { Parser } from "../../../logic/parser";
import { Token } from "../../../model/token";
import { Skip, } from "../../../model/while+/statement";
import { AbstractProgramState } from "../model/types/abstract_state";
import { IntervalDomain } from "./examples/IntervalDomain/Domains/interval_domain";
import { Interval } from "./examples/IntervalDomain/types/interval";
import { IntervalFactory } from "./examples/IntervalDomain/types/interval_factory";

export class AI_INT {

    public static api = {
        WebApp: (program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean): {
            tokenList: Token[];
            ast: Skip;
            initialState: AbstractProgramState<Interval>;
            annotatedProgram: string;
            dSharpResult: AbstractProgramState<Interval>;
        } => {
            let _IntervalFactory = new IntervalFactory({ m: min, n: max });
            let _IntervalDomain = new IntervalDomain(_IntervalFactory);
            let results = {
                tokenList: new Array<Token>(),
                ast: new Skip(),
                initialState: new AbstractProgramState<Interval>(),
                annotatedProgram: "",
                dSharpResult: new AbstractProgramState<Interval>(),
            };

            results.tokenList = Lexer.tokenize(program);
            results.ast = Parser.parse(results.tokenList);
            results.initialState = Parser.parseAbstractState(Lexer.tokenize(initialState), _IntervalFactory);
            results.dSharpResult = _IntervalDomain.S(
                results.ast,
                results.initialState,
                { widening: widening, narrowing: narrowing }
            );
            results.annotatedProgram = results.ast.annotatedProgram();
            console.log(results)
            return results;
        },
        Pdf: (program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean) => {

        }
    };

}
