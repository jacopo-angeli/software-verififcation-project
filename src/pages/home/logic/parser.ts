

import * as P from 'parsimmon';
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from '../model/while+/arithmetic_expression';
import { Token, TokenType } from '../model/token';
import { Boolean, BooleanBinaryOperator, BooleanExpression, BooleanUnaryOperator } from '../model/while+/boolean_expression';
import { Assignment, Concatenation, Declaration, ForLoop, IfThenElse, Initialization, RepeatUntilLoop, Skip, Statement, WhileLoop } from '../model/while+/statement';
import { IntervalFactory } from '../components/SecondAssignment/logic/examples/IntervalDomain/types/interval_factory';
import { AbstractProgramState } from '../components/SecondAssignment/model/types/abstract_state';
import { Interval } from '../components/SecondAssignment/logic/examples/IntervalDomain/types/interval';
import { InitialStateFormatError } from '../model/errors';
import { ProgramState } from '../components/FirstAssignment/model/program_state';

// --- Helper Parsers and Token Maker ---

const whitespace = P.regexp(/\s*/m).desc("whitespace");

const numberParser: P.Parser<ArithmeticExpression> = P.regexp(/[0-9]+/)
    .map((str) => new Numeral(parseInt(str, 10)))
    .skip(whitespace)
    .desc("number");

const variableParser: P.Parser<ArithmeticExpression> = P.regexp(/[a-zA-Z_][a-zA-Z0-9_]*/)
    .map((str) => new Variable(str))
    .skip(whitespace)
    .desc("variable");

const sym = (s: string) => P.string(s).skip(whitespace);

function makeToken(type: TokenType, value: string): Token {
    return new Token(type, value);
}

// --- Arithmetic Expression Parsers ---

const Factor: P.Parser<ArithmeticExpression> = P.lazy((): P.Parser<ArithmeticExpression> => {
    // Parser for post-increment / post-decrement: x++ or x--
    const postIncDec: P.Parser<ArithmeticExpression> = variableParser.chain((varNode) => {
        return P.alt(sym("++"), sym("--")).map((operator) => {
            if (operator === "++") {
                return new IncrementOperator(varNode as Variable);
            } else {
                return new DecrementOperator(varNode as Variable);
            }
        });
    });

    // Parser for unary minus: -A
    const unaryMinus: P.Parser<ArithmeticExpression> = sym("-")
        .then(Factor)
        .map((expr) => new ArithmeticUnaryOperator(expr, makeToken(TokenType.MINUS, "-")));

    // Parser for a parenthesized expression: ( Expression )
    const parens: P.Parser<ArithmeticExpression> = sym("(")
        .then(Expression) // Fixed: pass Expression directly
        .skip(sym(")"));

    return P.alt<ArithmeticExpression>(
        numberParser,
        postIncDec,
        unaryMinus,
        variableParser,
        parens
    ).skip(whitespace);
});

const Term: P.Parser<ArithmeticExpression> = P.lazy((): P.Parser<ArithmeticExpression> => {
    const operatorParser: P.Parser<Token> = P.alt(sym("+"), sym("-"), sym("*"), sym("/")).map((op) => {
        switch (op) {
            case "+":
                return makeToken(TokenType.PPLUS, "+");
            case "-":
                return makeToken(TokenType.MINUS, "-");
            case "*":
                return makeToken(TokenType.STAR, "*");
            case "/":
                return makeToken(TokenType.SLASH, "/");
            default:
                throw new Error(`Unknown operator: ${op}`);
        }
    });

    const tailParser: P.Parser<[Token, ArithmeticExpression]> = P.seq(operatorParser, Factor);

    return P.seqMap(
        Factor,
        tailParser.many(),
        (first: ArithmeticExpression, rest: Array<[Token, ArithmeticExpression]>): ArithmeticExpression => {
            return rest.reduce((acc, [opToken, nextExpr]) => {
                return new ArithmeticBinaryOperator(acc, nextExpr, opToken);
            }, first);
        }
    );
});

const Expression: P.Parser<ArithmeticExpression> = P.lazy((): P.Parser<ArithmeticExpression> => {
    return P.seqMap(
        Term,
        P.seq(
            P.alt(sym("+"), sym("-"), sym("*"), sym("/")).map((op) => {
                switch (op) {
                    case "+":
                        return makeToken(TokenType.PLUS, "+");
                    case "-":
                        return makeToken(TokenType.MINUS, "-");
                    case "*":
                        return makeToken(TokenType.STAR, "*");
                    case "/":
                        return makeToken(TokenType.SLASH, "/");
                    default:
                        throw new Error(`Unexpected operator: ${op}`);
                }
            }),
            Term
        ).many(),
        (first: ArithmeticExpression, rest: Array<[Token, ArithmeticExpression]>): ArithmeticExpression => {
            return rest.reduce((acc, [opToken, nextExpr]) => {
                return new ArithmeticBinaryOperator(acc, nextExpr, opToken);
            }, first);
        }
    );
});

// --- Boolean Expression Parsers ---

const BoolAtom: P.Parser<BooleanExpression> = P.lazy((): P.Parser<BooleanExpression> => {
    const trueParser = sym("true").result(new Boolean(true));
    const falseParser = sym("false").result(new Boolean(false));

    const notParser = sym("!").then(BoolAtom).map((expr) => {
        return new BooleanUnaryOperator(expr, makeToken(TokenType.NOT, "!"));
    });

    // Parenthesized boolean expression: ( BoolExpression )
    const parensB: P.Parser<BooleanExpression> = sym("(")
        .then(BoolExpressionParser) // Fixed: pass parser directly
        .skip(sym(")"));

    // Parser for relational comparisons: Expression < Expression, etc.
    const relational: P.Parser<BooleanExpression> = P.seq(
        Expression,
        P.alt(
            sym("<=").map(() => makeToken(TokenType.LESSEQ, "<=")),
            sym(">=").map(() => makeToken(TokenType.MOREEQ, ">=")),
            sym("<").map(() => makeToken(TokenType.LESS, "<")),
            sym(">").map(() => makeToken(TokenType.MORE, ">")),
            sym("==").map(() => makeToken(TokenType.EQ, "==")),
            sym("!=").map(() => makeToken(TokenType.INEQ, "!="))
        ),
        Expression
    ).map(([leftExpr, op, rightExpr]) => {
        return new BooleanBinaryOperator(leftExpr, rightExpr, op);
    });

    return P.alt(
        trueParser,
        falseParser,
        notParser,
        relational,
        parensB
    ).skip(whitespace);
});

const AndExpr: P.Parser<BooleanExpression> = P.lazy((): P.Parser<BooleanExpression> => {
    return P.seqMap(
        BoolAtom,
        P.seq(sym("&&").result(makeToken(TokenType.AND, "&&")), BoolAtom).many(),
        (first: BooleanExpression, rest: Array<[Token, BooleanExpression]>): BooleanExpression => {
            return rest.reduce((acc, [opToken, nextExpr]) => {
                return new BooleanBinaryOperator(acc, nextExpr, opToken);
            }, first);
        }
    );
});

const OrExpr: P.Parser<BooleanExpression> = P.lazy((): P.Parser<BooleanExpression> => {
    return P.seqMap(
        AndExpr,
        P.seq(sym("||").result(makeToken(TokenType.OR, "||")), AndExpr).many(),
        (first: BooleanExpression, rest: Array<[Token, BooleanExpression]>): BooleanExpression => {
            return rest.reduce((acc, [opToken, nextExpr]) => {
                return new BooleanBinaryOperator(acc, nextExpr, opToken);
            }, first);
        }
    );
});

const BoolExpressionParser: P.Parser<BooleanExpression> = OrExpr;

// --- Statement Parsers ---

const skipParser: P.Parser<Statement> = sym("skip").map(() => new Skip());

const assignmentParser: P.Parser<Statement> = P.seqMap(
    variableParser.skip(sym("=")),
    Expression,
    (v, expr) => new Assignment(v as Variable, expr)
);

const statementParser: P.Parser<Statement> = P.lazy((): P.Parser<Statement> => {
    return P.sepBy1(simpleStmtParser, sym(";")).map((stmts) => {
        if (stmts.length === 1) {
            return stmts[0];
        } else {
            // Build concatenated statements (left-associative)
            return stmts.slice(1).reduce((acc, s) => new Concatenation(acc, s), stmts[0]);
        }
    });
});
const declarationParser: P.Parser<Declaration> = P.seqMap(
    sym('var'),
    variableParser,
    (_, variable) => new Declaration(variable as Variable)
);

const initializationParser: P.Parser<Initialization> = P.seqMap(
    sym('var'),
    variableParser,
    sym('('),
    P.regexp(/[+-]?[0-9]+/).map(Number),
    sym(','),
    P.regexp(/[+-]?[0-9]+/).map(Number),
    sym(')'),
    (_, variable, __, l, ___, u, ____) => new Initialization(variable as Variable, l, u)
);

const stmtAtom: P.Parser<Statement> = P.lazy((): P.Parser<Statement> => {
    const blockParens: P.Parser<Statement> = sym("(")
        .then(statementParser) // Fixed: pass statementParser directly
        .skip(sym(")"));

    return P.alt(
        skipParser,
        assignmentParser,
        initializationParser, // 💡 Add before declarationParser
        declarationParser,
        blockParens
    );
});

const ifParser: P.Parser<Statement> = P.seqMap(
    sym("if")
        .then(sym("("))
        .then(BoolExpressionParser)
        .skip(sym(")")),
    sym("then")
        .then(sym("{"))
        .then(statementParser) // Fixed: directly reference statementParser
        .skip(sym("}")),
    sym("else")
        .then(sym("{"))
        .then(statementParser)
        .skip(sym("}")),
    (guard, thenS, elseS) => new IfThenElse(guard, thenS, elseS)
);

const whileParser: P.Parser<Statement> = P.seqMap(
    sym("while")
        .then(sym("("))
        .then(BoolExpressionParser)
        .skip(sym(")")),
    sym("{")
        .then(statementParser)
        .skip(sym("}")),
    (guard, body) => new WhileLoop(body, guard)
);

const repeatParser: P.Parser<Statement> = P.seqMap(
    sym("repeat")
        .then(sym("{"))
        .then(statementParser)
        .skip(sym("}")),
    sym("until")
        .then(sym("("))
        .then(BoolExpressionParser)
        .skip(sym(")")),
    (body, guard) => new RepeatUntilLoop(body, guard)
);

const forParser: P.Parser<Statement> = P.seqMap(
    sym("for")
        .then(sym("("))
        .then(statementParser)
        .skip(sym(";"))
        .chain((initStmt): P.Parser<[Statement, BooleanExpression, Statement]> => {
            return BoolExpressionParser.chain((guard) =>
                sym(";")
                    .then(statementParser)
                    .map((incrementStmt) => [initStmt, guard, incrementStmt] as [Statement, BooleanExpression, Statement])
            );
        })
        .skip(sym(")")),
    sym("{")
        .then(statementParser)
        .skip(sym("}")),
    ([initStmt, guard, incrementStmt], body) => new ForLoop(body, guard, initStmt, incrementStmt)
);

const simpleStmtParser: P.Parser<Statement> = P.alt<Statement>(
    ifParser,
    whileParser,
    repeatParser,
    forParser,
    stmtAtom
).skip(whitespace);

// --- Final Program Parser ---

export function parseProgram(src: string): Statement {
    const result = statementParser.skip(P.eof).parse(src);
    if (result.status) {
        return result.value;
    } else {
        throw new Error(
            `Parse error at offset ${result.index?.offset}: \nExpected: ${result.expected}\nGot: ${src.substring(
                result.index?.offset,
                result.index?.offset + 10
            )}...`
        );
    }
}

export function parseAbstractState(input: Array<Token>, intervalFactory: IntervalFactory): AbstractProgramState<Interval> {

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

export function parseInitialState(input: Array<Token>): ProgramState {
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