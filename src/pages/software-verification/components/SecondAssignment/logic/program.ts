import { Lexer } from "../../../logic/lexer";
import { Parser } from "../../../logic/parser";
import { Token } from "../../../model/token";
import { Skip, Statement } from "../../../model/while+/statement";
import { IntervalDomain } from "./IntervalDomain/domains/interval_domain";
import { IntervalFactory } from "./IntervalDomain/factories/interval_factory";
import { IntervalAbstractProgramState } from "./IntervalDomain/types/state";

export class AI_INT {

    public static api = {
        WebApp: (program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean) => {
            let _IntervalFactory = new IntervalFactory(min, max);
            let _IntervalDomain = new IntervalDomain(_IntervalFactory);
            console.log(Parser.parseAbstractState(Lexer.tokenize(initialState), _IntervalFactory));
            let results = {
                tokenList: new Array<Token>(),
                ast: new Skip(),
                initialState: new IntervalAbstractProgramState(),
                annotatedProgram: "",
                dSharpResult: new IntervalAbstractProgramState(),
            };

            results.tokenList = Lexer.tokenize(program);
            results.ast = Parser.parse(results.tokenList);
            results.initialState = Parser.parseAbstractState(Lexer.tokenize(initialState), _IntervalFactory);
            results.dSharpResult = _IntervalDomain.dSharp(
                results.ast,
                results.initialState,
                { widening: widening, narrowing: narrowing }
            );
            results.annotatedProgram = results.ast.toAnnotatedProgram();

            return Object.values(results).map(v => {
                return v.toString();
            });
        },
        Pdf:(program: string, initialState: string, min: number, max: number, widening: boolean, narrowing: boolean)=>{

        }
    };

}
