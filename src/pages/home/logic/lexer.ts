import { Token, TokenType } from "../model/token";

export class Lexer {
    private static dictionary: Map<string, TokenType> = new Map([
        ["+", TokenType.PLUS],
        ["-", TokenType.MINUS],
        ["*", TokenType.STAR],
        ["%", TokenType.MODULE],
        ["/", TokenType.SLASH],
        ["++", TokenType.PPLUS],
        ["--", TokenType.MMINUS],
        //
        ["true", TokenType.TRUE],
        ["false", TokenType.FALSE],
        ["==", TokenType.EQ],
        ["!=", TokenType.INEQ],
        ["<", TokenType.LESS],
        ["<=", TokenType.LESSEQ],
        [">", TokenType.MORE],
        [">=", TokenType.MOREEQ],
        ["!", TokenType.NOT],
        ["&&", TokenType.AND],
        ["||", TokenType.OR],
        //
        ["=", TokenType.ASS],
        [";", TokenType.CONC],
        ["{", TokenType.BRA],
        ["(", TokenType.bra],
        ["}", TokenType.KET],
        [")", TokenType.ket],
        ["if", TokenType.IF],
        ["then", TokenType.THEN],
        ["else", TokenType.ELSE],
        ["while", TokenType.WHILE],
        ["repeat", TokenType.REPEAT],
        ["until", TokenType.UNTIL],
        ["for", TokenType.FOR],
        //
        ["skip", TokenType.SKIP],
        // 
        ["[", TokenType.BBOX],
        ["]", TokenType.BOXB],
        ["top", TokenType.TOP],
        ["bottom", TokenType.BOTTOM],
        [":", TokenType.COLON],
        [",", TokenType.COMMA],
        ["inf", TokenType.INF],
    ]);

    private static isNum(s: string): boolean {
        return RegExp(/^[0-9]+$/).test(s);
    }

    private static isAlpha(s: string): boolean {
        // Admit only lower or upper alphabetic characters
        return RegExp(/^[a-zA-Z]+$/).test(s);
    }

    static tokenize(input: string): Array<Token> {
        // Input sanification
        var sanitizedInput: string = input
            .split('\n')                        // Split the string by newline characters
            .filter(line => !/^\s*\/\//.test(line))  // Filter out lines starting with "//" optionally preceded by spaces
            .join('\n');

        sanitizedInput = sanitizedInput.replaceAll(
            " ",
            "",
        ).replaceAll(
            "\n",
            "",
        ).replaceAll(
            "\t",
            "",
        ).toLowerCase();

        // Tokenization of sanitized input
        return this.tokenizeRec(sanitizedInput);
    }

    private static tokenizeRec(
        input: string,
        partial: string = "",
        position: number = 0,
        result: Array<Token> | undefined = undefined,
    ): Array<Token> {
        // DICTIONARY CHECK --------------------------------------------------------
        // Some token share a partial prefix for example '<' and '<='.
        // If partial + input[position] is not in dictionary and position is less
        // than input.length then add Token with spacial case for empty list and
        // recursive call on input[position] (next character).
        //
        // Else if position is less than input.length then recursive call on
        // partial + input[position].
        //
        // Return of the current result otherwise.
        // -----------------------------------------------------------------------
        if (this.dictionary.has(partial)) {
            if (position < input.length && !this.dictionary.has(partial + input[position])) {
                if (result == null) {
                    result = [new Token(this.dictionary.get(partial) as TokenType, partial)];
                } else {
                    result.push(new Token(this.dictionary.get(partial) as TokenType, partial));
                }
                return this.tokenizeRec(
                    input,
                    input[position],
                    position + 1,
                    result,
                );
            } else if (position < input.length) {
                // dictionary.containsKey(partial + input[position])
                return this.tokenizeRec(
                    input,
                    partial + input[position],
                    position + 1,
                    result,
                );
            } else {
                if (result == null) {
                    result = [new Token(this.dictionary.get(partial) as TokenType, partial)];
                } else {
                    result.push(new Token(this.dictionary.get(partial) as TokenType, partial));
                }
                return result;
            }
        }

        // NUMERALS ----------------------------------------------------------------
        // Numerals can be made of several cyphers.
        //
        // If partial + input[position] is not a number and position is less than
        // input.length then add the Token.NUMERAL to the result (special case for
        // null safety).
        //
        // Else if position < input.length recursive call on
        // partial + input[position].
        //
        // Return current result otherwise.
        // -------------------------------------------------------------------------
        if (this.isNum(partial)) {
            if (position < input.length && !this.isNum(input[position])) {
                if (result == null) {
                    result = [new Token(TokenType.NUM, partial)];
                } else {
                    result.push(new Token(TokenType.NUM, partial));
                }
                return this.tokenizeRec(
                    input,
                    input[position],
                    position + 1,
                    result,
                );
            } else if (position < input.length) {
                return this.tokenizeRec(
                    input,
                    partial + input[position],
                    position + 1,
                    result,
                );
            } else {
                if (result === undefined) {
                    result = [new Token(TokenType.NUM, partial)];
                } else {
                    result.push(new Token(TokenType.NUM, partial));
                }
                return result;
            }
        }

        // VARIABLES ---------------------------------------------------------------
        // Variables can be made of several characters, of course for example
        // 'whil' trigger the following If but, on next iteration with 'while'
        // function will insert Token.WHILE into result.
        //
        // If the  partial + input[position] is not alphabetical and
        // position < input.length then add the Token.VARIABLE to the result
        // (special case for null safety).
        //
        // Else recursive call with partial + input[position] if
        // position < input.length.
        //
        // Return current result otherwise.
        // -------------------------------------------------------------------------
        if (this.isAlpha(partial)) {
            if (position < input.length && !this.isAlpha(input[position])) {
                if (result == null) {
                    result = [new Token(TokenType.VAR, partial)];
                } else {
                    result.push(new Token(TokenType.VAR, partial));
                }
                return this.tokenizeRec(
                    input,
                    input[position],
                    position + 1,
                    result,
                );
            } else if (position < input.length) {
                return this.tokenizeRec(
                    input,
                    partial + input[position],
                    position + 1,
                    result,
                );
            } else {
                if (result === undefined) {
                    result = [new Token(TokenType.VAR, partial)];
                } else {
                    result.push(new Token(TokenType.VAR, partial));
                }
                return result;
            }
        }

        return this.tokenizeRec(
            input,
            partial + input[position],
            position + 1,
            result,
        );
    }
}
