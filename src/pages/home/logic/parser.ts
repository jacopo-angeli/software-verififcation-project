import { Token, TokenType } from "../model/token";
import { Assignment, Concatenation, ForLoop, IfThenElse, RepeatUntilLoop, Skip, Statement, WhileLoop } from "../model/while+/statement";
import { Boolean, BooleanBinaryOperator, BooleanConcatenation, BooleanExpression, BooleanUnaryOperator } from "../model/while+/boolean_expression";
import { Variable, ArithmeticBinaryOperator, ArithmeticUnaryOperator, ArithmeticExpression, Numeral, IncrementOperator, DecrementOperator} from "../model/while+/arithmetic_expression";
import { ProgramState } from "../components/FirstAssignment/model/program_state";
import { InitialStateFormatError, ProgramFormatError } from "../model/errors";
import { IntervalFactory } from "../components/SecondAssignment/logic/examples/IntervalDomain/types/interval_factory";
import { Interval } from "../components/SecondAssignment/logic/examples/IntervalDomain/types/interval";
import { AbstractProgramState } from "../components/SecondAssignment/model/types/abstract_state";
export class Parser {

    private static parseBool(i: string): boolean {
        if ([true, 'true', 'True', 'TRUE', '1', 1].includes(i)) return true;
        if ([false, 'false', 'False', 'FALSE', '0', 0].includes(i)) return false;
        throw Error(`"${i}" can't be parsed as boolean.`);
    }

    private static parseAtomic(input: Array<Token>): Array<any> {
        var res: Array<any> = [];
        input.forEach((element) => {
            if (element.type === TokenType.VAR) {
                res.push(new Variable(element.value));
            } else if (element.type === TokenType.NUM) {
                res.push(new Numeral(parseInt(element.value)));
            } else if (element.type === TokenType.TRUE || element.type === TokenType.FALSE) {
                res.push(new Boolean(this.parseBool(element.value)));
            } else if (element.type === TokenType.SKIP) {
                res.push(new Skip());
            } else {
                res.push(element);
            }
        });
        return res;
    }

    private static parseExpression(tokens: Array<any>): void {
        let ArithmeticUnaryOperators: Array<TokenType> = [
            TokenType.MINUS,
            TokenType.PPLUS,
            TokenType.MMINUS
        ];
        let ArithmeticBinaryOperators: Array<TokenType> = [
            TokenType.PLUS,
            TokenType.MINUS,
            TokenType.STAR,
            TokenType.MODULE,
            TokenType.SLASH
        ];
        let BooleanBinaryOperators: Array<TokenType> = [
            TokenType.EQ,
            TokenType.INEQ,
            TokenType.LESS,
            TokenType.LESSEQ,
            TokenType.MORE,
            TokenType.MOREEQ,
        ];
        let BooleanUnaryOperators: Array<TokenType> = [
            TokenType.NOT
        ];

        let wholeOperatorsSet: Array<TokenType> = ArithmeticUnaryOperators.concat(ArithmeticBinaryOperators, BooleanBinaryOperators, BooleanUnaryOperators);

        let parseArithmeticExpression = (input: Array<Token>) => {
            let recParse = (tokens: Array<any>, index: number) => {
                // Pre, left side of tokens is already been parsed
                // Should always start with an open parenthesis
                let startingPar: boolean = false;
                if (tokens[index] instanceof Token && tokens[index].type === TokenType.bra) {
                    tokens.splice(index, 1);
                    startingPar = true;
                }
                for (let i = index; i < tokens.length; i++) {
                    if (tokens[i] instanceof Token) {
                        // Check for unary operator
                        if (ArithmeticUnaryOperators.includes(tokens[i].type)) {
                            if (i === index || [TokenType.bra, TokenType.CONC, TokenType.ASS].concat(wholeOperatorsSet).includes(tokens[i - 1].type)) {
                                // Found a Unary operator
                                if (tokens[i + 1] instanceof Token && tokens[i + 1].type === TokenType.bra) recParse(tokens, i + 1);
                                else throw Error('Expected an open parenthesis on position.');
                                // .... - Token<unaryOP> - Bexp - ....
                                let operand = tokens[i + 1];
                                tokens[i] = new ArithmeticUnaryOperator(operand, tokens[i]);
                                // .... - ArithmeticUnaryOperator(op, Bexp) - Bexp - ....
                                tokens.splice(i + 1, 1);
                                // .... - ArithmeticUnaryOperator(op, Bexp) - ....
                            }
                        }
                        // Regardless if i found an Unary operator i keep checking since if i found one of the latter
                        // the token will be canceled
                        if (ArithmeticBinaryOperators.includes(tokens[i].type)) {
                            // Found an operator
                            if (tokens[i + 1] instanceof Token && [TokenType.bra].concat(wholeOperatorsSet).includes(tokens[i + 1].type)) recParse(tokens, i + 1);
                            let leftSide = tokens[i - 1];
                            let rightSide = tokens[i + 1];
                            // We should be good now
                            tokens[i] = new ArithmeticBinaryOperator(leftSide, rightSide, tokens[i]);
                            // Current situation: bra - Expr - ket
                            tokens.splice(i - 1, 1);
                            i--;
                        } else if (tokens[i].type === TokenType.ket) {
                            // Need to delete this and the first open parenthesis backword
                            if (startingPar) tokens.splice(i, 1);
                            return;
                        }
                    }
                }
            }

            // Arithmetic operators
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i] instanceof Token) {

                    // Arithmetic Unary operators
                    if (ArithmeticUnaryOperators.includes(tokens[i].type)) {
                        if (tokens[i].type === TokenType.MINUS) {
                            if ([TokenType.bra, TokenType.CONC, TokenType.ASS].concat(wholeOperatorsSet).includes(tokens[i - 1].type)) {
                                if (tokens[i + 1].type === TokenType.bra) recParse(tokens, i + 1);
                                // Now we are good
                                let operand = tokens[i + 1];
                                tokens[i] = new ArithmeticUnaryOperator(operand, tokens[i]);
                                tokens.splice(i + 1, 1);
                            }
                        } else if (tokens[i].type === TokenType.MMINUS) {
                            if (!(tokens[i - 1] instanceof Variable)) throw Error("");
                            let variable = tokens[i - 1];
                            tokens[i] = new DecrementOperator(variable);
                            tokens.splice(i - 1, 1);
                            i--;
                        } else if (tokens[i].type === TokenType.PPLUS) {
                            if (!(tokens[i - 1] instanceof Variable)) throw Error("");
                            let variable = tokens[i - 1];
                            tokens[i] = new IncrementOperator(variable);
                            tokens.splice(i - 1, 1);
                            i--;
                        }
                    }
                    // Arithmetic Binary operators
                    if (ArithmeticBinaryOperators.includes(tokens[i].type)) {
                        // Found an operator
                        if (tokens[i + 1] instanceof Token && [TokenType.bra].concat(wholeOperatorsSet).includes(tokens[i + 1].type)) recParse(tokens, i + 1);
                        let leftSide = tokens[i - 1];
                        let rightSide = tokens[i + 1];
                        // We should be good now
                        tokens[i] = new ArithmeticBinaryOperator(leftSide, rightSide, tokens[i]);
                        // Current situation: bra - Expr - trash - ket
                        tokens.splice(i + 1, 1);
                        tokens.splice(i - 1, 1);
                        i--;
                    }
                }
            }
        }
        let parseBooleanExpression = (input: Array<Token>) => {
            let recParse = (tokens: Array<any>, index: number) => {
                // Shoudl always start with a parenthesis
                let startingPar: boolean = false;
                if (tokens[index] instanceof Token && tokens[index].type === TokenType.bra) {
                    startingPar = true;
                    tokens.splice(index, 1);
                }
                for (let i = index; i < tokens.length; i++) {
                    if (tokens[i] instanceof Token) {
                        // Check for unary operator
                        if (BooleanUnaryOperators.includes(tokens[i].type)) {
                            if (tokens[i + 1] instanceof Token) {
                                if (tokens[i + 1].type === TokenType.bra) recParse(tokens, i + 1);
                                else throw Error("Expected an '(' after...");
                                // Now we are good
                                let operand = tokens[i + 1];
                                tokens[i] = new BooleanUnaryOperator(operand, tokens[i]);
                                tokens.splice(i + 1, 1);
                                i--;
                            }
                        }
                        // Regardless if i found an Unary operator i keep checking since if i found one of the latter
                        // the token will be canceled
                        if (BooleanBinaryOperators.includes(tokens[i].type)) {
                            // Found an operator
                            if (tokens[i + 1] instanceof Token && [TokenType.bra].concat(BooleanUnaryOperators).includes(tokens[i + 1].type)) recParse(tokens, i + 1);
                            let leftSide = tokens[i - 1];
                            let rightSide = tokens[i + 1];
                            // We should be good now
                            tokens[i] = new BooleanBinaryOperator(leftSide, rightSide, tokens[i]);
                            // Current situation: bra - Expr - trash - ket
                            tokens.splice(i + 1, 1);
                            tokens.splice(i - 1, 1);
                            i--;
                        } else if (tokens[i].type === TokenType.ket) {
                            // Need to delete this and the first open parenthesis backword
                            if (startingPar) tokens.splice(i, 1);
                            return;
                        }
                    }
                }
            }
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i] instanceof Token) {
                    // Boolean Unary operators
                    if (BooleanUnaryOperators.includes(tokens[i].type)) {
                        if (tokens[i + 1] instanceof Token) {
                            if (tokens[i + 1].type === TokenType.bra) recParse(tokens, i + 1);
                            else throw Error("Expected an '(' after...");
                            // Now we are good
                            let operand = tokens[i + 1];
                            tokens[i] = new BooleanUnaryOperator(operand, tokens[i]);
                            tokens.splice(i + 1, 1);
                        }
                    }
                    if (BooleanBinaryOperators.includes(tokens[i].type)) {
                        // Found an operator
                        if (!(tokens[i + 1] instanceof Boolean || tokens[i + 1] instanceof BooleanExpression)) recParse(tokens, i + 1);
                        let leftSide = tokens[i - 1];
                        let rightSide = tokens[i + 1];
                        // We should be good now
                        tokens[i] = new BooleanBinaryOperator(leftSide, rightSide, tokens[i]);
                        // Current situation: bra - Expr - trash - ket
                        tokens.splice(i + 1, 1);
                        tokens.splice(i - 1, 1);
                        i--;
                    }
                }
            }
        }
        let parseBooleanConcatenation = (input: Array<Token>) => {
            let recParse = (tokens: Array<any>, index: number) => {
                // Shoudl always start with a parenthesis
                let startingPar: boolean = false;
                if (tokens[index] instanceof Token && tokens[index].type === TokenType.bra) {
                    startingPar = true;
                    tokens.splice(index, 1);
                }
                for (let i = index; i < tokens.length; i++) {
                    if (tokens[i] instanceof Token) {
                        // Check for unary operator
                        if (BooleanUnaryOperators.includes(tokens[i].type)) {
                            if (tokens[i + 1] instanceof Token) {
                                if (tokens[i + 1].type === TokenType.bra) recParse(tokens, i + 1);
                                else throw Error("Expected an '(' after...");
                                // Now we are good
                                let operand = tokens[i + 1];
                                tokens[i] = new BooleanUnaryOperator(operand, tokens[i]);
                                tokens.splice(i + 1, 1);
                                i--;
                            }
                        }
                        // Regardless if i found an Unary operator i keep checking since if i found one of the latter
                        // the token will be canceled
                        if (BooleanBinaryOperators.includes(tokens[i].type)) {
                            // Found an operator
                            if (tokens[i + 1] instanceof Token && [TokenType.bra].concat(BooleanUnaryOperators).includes(tokens[i + 1].type)) recParse(tokens, i + 1);
                            let leftSide = tokens[i - 1];
                            let rightSide = tokens[i + 1];
                            // We should be good now
                            tokens[i] = new BooleanBinaryOperator(leftSide, rightSide, tokens[i]);
                            // Current situation: bra - Expr - trash - ket
                            tokens.splice(i + 1, 1);
                            tokens.splice(i - 1, 1);
                            i--;
                        } else if (tokens[i].type === TokenType.ket) {
                            // Need to delete this and the first open parenthesis backword
                            if (startingPar) tokens.splice(i, 1);
                            return;
                        }
                    }
                }
            }
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i] instanceof Token) {
                    if ([TokenType.AND, TokenType.OR].includes(tokens[i].type)) {
                        // Found an operator
                        if (!(tokens[i + 1] instanceof Boolean || tokens[i + 1] instanceof BooleanExpression)) recParse(tokens, i + 1);
                        let leftSide = tokens[i - 1];
                        let rightSide = tokens[i + 1];
                        // We should be good now
                        tokens[i] = new BooleanConcatenation(leftSide, rightSide, tokens[i]);
                        // Current situation: bra - Expr - trash - ket
                        tokens.splice(i + 1, 1);
                        tokens.splice(i - 1, 1);
                        i--;
                    }
                }
            }
        }

        parseArithmeticExpression(tokens);
        parseBooleanExpression(tokens);
        parseBooleanConcatenation(tokens);
    }

    private static parseAssignment(tokens: Array<any>) {
        for (let i: number = 0; i < tokens.length; i++) {
            try {
                let t = tokens[i] as Token;
                if (t.type === TokenType.ASS) {
                    let v = tokens[i - 1] as Variable;
                    let aExp = tokens[i + 1] as ArithmeticExpression;
                    tokens[i] = new Assignment(
                        v,
                        aExp,
                    );
                    tokens.splice(i + 1, 1);
                    tokens.splice(i - 1, 1);
                    i--;
                }
            } catch (e) {

            }
        }
    }

    private static parseStatement(tokens: Array<any>, offset: number = 0) {
        let pc: number = 0;
        for (let i: number = offset; i < tokens.length && pc >= 0; i++) {
            if (tokens[i] instanceof Token) {
                let t = tokens[i] as Token;
                if (t.type === TokenType.BRA || t.type === TokenType.bra) pc++;
                else if (t.type === TokenType.KET || t.type === TokenType.ket) pc--;
                else if (t.type === TokenType.IF) {
                    // IF - bra - Bexp - ket - THEN - BRA - Stmt - KET - ELSE - BRA - Stmt - KET
                    this.parseStatement(tokens, i + 6);
                    this.parseStatement(tokens, i + 10);
                    let guard: BooleanExpression = tokens[i + 2] as BooleanExpression;
                    let t = tokens[i + 6] as Statement;
                    let e = tokens[i + 10] as Statement;
                    tokens[i] = new IfThenElse(guard, t, e);
                    tokens.splice(i + 1, 12);
                }
                else if (t.type === TokenType.CONC) {
                    let first = tokens[i - 1] as Statement;
                    if (!(tokens[i + 1] instanceof Statement)) {
                        if (tokens[i + 1].type === TokenType.KET) {
                            throw new ProgramFormatError(`Error on token ${i} : ${tokens[i].value}`);
                        }
                        this.parseStatement(tokens, i + 1);
                    }
                    let second = tokens[i + 1] as Statement;
                    tokens[i] = new Concatenation(first, second);
                    tokens.splice(i + 1, 1);
                    tokens.splice(i - 1, 1);
                    i--;
                }
                else if (t.type === TokenType.WHILE) {
                    // WHILE - bra - BExp - ket - BRA - Stmt - KET
                    this.parseStatement(tokens, i + 5);
                    let guard: BooleanExpression = tokens[i + 2] as BooleanExpression;
                    let body = tokens[i + 5];
                    tokens[i] = new WhileLoop(body, guard);
                    tokens.splice(i + 1, 6);
                }
                else if (t.type === TokenType.REPEAT) {
                    // REPEAT - BRA - Stmt - KET - UNTIL - bra - Bexp - ket
                    this.parseStatement(tokens, i + 2);
                    let body = tokens[i + 2] as Statement;
                    let guard = tokens[i + 6] as BooleanExpression;
                    tokens[i] = new RepeatUntilLoop(body, guard);
                    tokens.splice(i + 1, 7);
                }
                else if (t.type === TokenType.FOR) {
                    // FOR - bra - SStmt - CONC - Bexp - CONC - SStmt - ket - BRA - Stmt - KET 
                    this.parseStatement(tokens, i + 9);
                    let body = tokens[i + 9] as Statement;
                    let guard = tokens[i + 4] as BooleanExpression;
                    let initialStatement = tokens[i + 2] as Statement;
                    let incrementStatement = tokens[i + 6] as Statement;
                    tokens[i] = new ForLoop(body, guard, initialStatement, incrementStatement);
                    tokens.splice(i + 1, 10);
                }
                else throw new ProgramFormatError(`Error on token ${i} : ${tokens[i].value}`);
            }
        }
    }

    static parse(input: Array<Token>): Statement{
        var tokens: Array<any> = Parser.parseAtomic(input);
        this.parseExpression(tokens);
        this.parseAssignment(tokens);
        this.parseStatement(tokens);
        if (tokens[0] instanceof Statement) return tokens[0];
        throw new ProgramFormatError("Parser: Not a statement.");
    }

    static parseInitialState(input: Array<Token>): ProgramState {
        // Declare
        let checkList: Array<Array<TokenType>> = [
            [TokenType.VAR],
            [TokenType.ASS],
            [TokenType.NUM, TokenType.FALSE, TokenType.TRUE],
            [TokenType.CONC]
        ];
        let res: ProgramState = new ProgramState();

        // Begin
        if (input.length % (checkList.length) !== 0) {
            throw new InitialStateFormatError("Missed some token, check the grammar above.");
        }
        for (let i: number = 0; i < input.length; i++) {
            if (!(checkList[i % checkList.length]).includes(input[i].type)) {
                throw new InitialStateFormatError(`Error on token ${i}: ${input[i].value}.`);
            } else if (i > 0 && i % (checkList.length) === 3) {
                if (res.contains(input[i - 3].value)) {
                    throw new InitialStateFormatError(`Multiple definition of the same variable: ${input[i - 3].value}.`);
                } else {
                    res.set(input[i - 3].value, parseInt(input[i - 1].value), true);
                }
            }
        }

        // End
        return res;
    }

    static parseAbstractState(input: Array<Token>, intervalFactory: IntervalFactory): AbstractProgramState<Interval>{

        class Node {
            constructor(
                private _value: TokenType,
                private _children: Array<Node> = [],
            ) { }
            public get value() { return this._value };
            public get children() { return this._children; }
            isLeaf(): boolean {
                return this._children.length === 0;
            }

        }

        function isValid(node: Node, tokens: Array<Token>, index: number = 0): boolean {
            if (index === tokens.length - 1) return node.isLeaf() && node.value === tokens[index].type;
            else if (index < tokens.length - 1) {
                if (node.value === tokens[index].type) {
                    let childrenResult: boolean = false;
                    node.children.forEach(e => {
                        childrenResult = childrenResult || isValid(e, tokens, index + 1);
                    })
                    return childrenResult;
                }
                return false;
            }
            return false;
        }

        // Validation tree creation
        //                 VAR
        //                  |
        //          ------COLON------
        //         /        |        \
        //        BBOX    BOTTOM     TOP
        //       /    \         
        //    ABOP -- NUM   
        //    /       /     
        //  INF      /      
        //     \    /       
        //     COMMA        
        //     /     \      
        //   ABOP --- NUM   
        //     \       |    
        //      INF    |    
        //        \    |    
        //          BOXB
        let BOXB = new Node(TokenType.BOXB)
        let secondNUM = new Node(TokenType.NUM, [BOXB]);
        let secondINF = new Node(TokenType.INF, [BOXB]);
        let secondABOP = new Node(TokenType.MINUS, [secondINF, secondNUM]);
        let COMMA = new Node(TokenType.COMMA, [secondABOP, secondNUM]);
        let firstNUM = new Node(TokenType.NUM, [COMMA]);
        let firstINF = new Node(TokenType.INF, [COMMA]);
        let firstABOP = new Node(TokenType.MINUS, [firstINF, firstNUM]);
        let BBOX = new Node(TokenType.BBOX, [firstABOP, firstNUM]);
        let BOTTOM = new Node(TokenType.BOTTOM);
        let TOP = new Node(TokenType.TOP);
        let COLON = new Node(TokenType.COLON, [BBOX, BOTTOM, TOP]);
        let validationTree = new Node(TokenType.VAR, [COLON]);

        let arraySplit: Array<Array<Token>> = [[]];

        // Splitting variables
        input.forEach(e => {
            if (e.type !== TokenType.CONC) {
                arraySplit[arraySplit.length - 1].push(e);
            } else {
                arraySplit.push([]);
            }
        })


        let ret = new Map<string, Interval>();
        arraySplit.forEach((e) => {
            if (isValid(validationTree, e)) { //Throw exception if not valid, to catch in the view

                let varName: string = e[0].value;

                let lower: number = intervalFactory.meta.m;
                let upper: number = intervalFactory.meta.n;
                if (e[2].type === TokenType.TOP) ret.set(varName, intervalFactory.Top);
                else if (e[2].type === TokenType.BOTTOM) ret.set(varName, intervalFactory.Bottom);
                else if (e[2].type === TokenType.BBOX) {
                    if (e[3].type === TokenType.NUM) {
                        lower = parseInt(e[3].value);
                        // e[4] must be a comma
                        if (e[5].type === TokenType.NUM) upper = parseInt(e[5].value);
                        else if (e[5].type === TokenType.MINUS) {
                            if (e[6].type === TokenType.INF) upper = e[5].value === "-" ? intervalFactory.meta.m : intervalFactory.meta.n;
                            if (e[6].type === TokenType.NUM) upper = parseInt(e[5].value + e[6].value);
                        }
                        else throw new InitialStateFormatError(`Format error on "${varName}" upper bound.`);
                    }
                    else if (e[3].type === TokenType.MINUS) {
                        if (e[4].type === TokenType.INF) lower = e[3].value === "-" ? intervalFactory.meta.m : intervalFactory.meta.n;
                        else if (e[4].type === TokenType.NUM) lower = parseInt(e[3].value + e[4].value);
                        else throw new InitialStateFormatError(`Format error on "${varName}" lower bound.`);

                        // e[5] must be a comma
                        if (e[6].type === TokenType.NUM) upper = parseInt(e[6].value);
                        else if (e[6].type === TokenType.MINUS) {
                            if (e[7].type === TokenType.INF) upper = e[6].value === "-" ? intervalFactory.meta.m : intervalFactory.meta.n;
                            if (e[7].type === TokenType.NUM) upper = parseInt(e[6].value + e[7].value);
                        }
                        else throw new InitialStateFormatError(`Format error on "${varName}" upper bound.`);
                    }
                    else throw new InitialStateFormatError(`Format error on "${varName}" lower bound.`);

                    ret.set(varName, intervalFactory.new(lower, upper));

                }
                else throw new InitialStateFormatError(`Format error on variable "${varName}" value.`);
            } else {
                throw new InitialStateFormatError(`Format error. Check the grammar above.`)
            }
        })
        return new AbstractProgramState<Interval>(ret);
    }

}
