

import * as P from 'parsimmon';
import { ArithmeticBinaryOperator, ArithmeticExpression, ArithmeticUnaryOperator, DecrementOperator, IncrementOperator, Numeral, Variable } from '../model/while+/arithmetic_expression';
import { Token, TokenType } from '../model/token';
import { Boolean, BooleanBinaryOperator, BooleanExpression, BooleanUnaryOperator } from '../model/while+/boolean_expression';
import { Assignment, Concatenation, Declaration, ForLoop, IfThenElse, Initialization, RepeatUntilLoop, Skip, Statement, WhileLoop } from '../model/while+/statement';

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