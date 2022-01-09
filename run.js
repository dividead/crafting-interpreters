const { readFileSync } = require('fs')
const { resolve } = require('path')
const readline = require('readline')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const T = {
    // Single-character t.
    LEFT_PAREN: 'LEFT_PAREN',
    RIGHT_PAREN: 'RIGHT_PAREN',
    LEFT_BRACE: 'LEFT_BRACE',
    RIGHT_BRACE: 'RIGHT_BRACE',
    COMMA: 'COMMA',
    DOT: 'DOT',
    MINUS: 'MINUS',
    PLUS: 'PLUS',
    SEMICOLON: 'SEMICOLON',
    SLASH: 'SLASH',
    STAR: 'STAR',

    // One or two character t.
    BANG: 'BANG',
    BANG_EQUAL: 'BANG_EQUAL',
    EQUAL: 'EQUAL',
    EQUAL_EQUAL: 'EQUAL_EQUAL',
    GREATER: 'GREATER',
    GREATER_EQUAL: 'GREATER_EQUAL',
    LESS: 'LESS',
    LESS_EQUAL: 'LESS_EQUAL',

    // Literals.
    IDENTIFIER: 'IDENTIFIER',
    STRING: 'STRING',
    NUMBER: 'NUMBER',

    // Keywords.
    AND: 'AND',
    CLASS: 'CLASS',
    ELSE: 'ELSE',
    FALSE: 'FALSE',
    FUN: 'FUN',
    FOR: 'FOR',
    IF: 'IF',
    NIL: 'NIL',
    OR: 'OR',
    PRINT: 'PRINT',
    RETURN: 'RETURN',
    SUPER: 'SUPER',
    THIS: 'THIS',
    TRUE: 'TRUE',
    VAR: 'VAR',
    WHILE: 'WHILE',

    EOF: 'EOF'
}

const exp = /[a-zA-Z_][a-zA-Z_0-9]*/

const keywords = new Map();
keywords.set("and", T.AND);
keywords.set("class", T.CLASS);
keywords.set("else", T.ELSE);
keywords.set("false", T.FALSE);
keywords.set("for", T.FOR);
keywords.set("fun", T.FUN);
keywords.set("if", T.IF);
keywords.set("nil", T.NIL);
keywords.set("or", T.OR);
keywords.set("print", T.PRINT);
keywords.set("return", T.RETURN);
keywords.set("super", T.SUPER);
keywords.set("this", T.THIS);
keywords.set("true", T.TRUE);
keywords.set("var", T.VAR);
keywords.set("while", T.WHILE);

const main = () => {
    const token = (type, lexeme, literal, line) => {
        return {
            type,
            lexeme,
            literal,
            line,
            toString: () => type + " " + lexeme + " " + literal,
        }
    }

    const run = (source) => {
        let hasError = false
        const report = (line, where, message) => {
            console.log("[line " + line + "] Error" + where + ": " + message)
            hasError = true
        }
        const error = (line, message) => report(line, '', message)

        const scanTokens = () => {
            let start = 0
            let current = 0
            let line = 1
            const tokens = []

            const isAtEnd = () => current >= source.length
            const advance = () => source[current++]
            const addTokenWithLiteral = (type, literal) => {
                let text = source.substring(start, current)
                tokens.push(token(type, text, literal, line))
            }
            const addToken = (type) => addTokenWithLiteral(type, null)

            const match = (expected) => {
                if (isAtEnd()) return false
                if (source[current] != expected) return false

                current++
                return true
            }

            const peek = () => {
                if (isAtEnd()) return '\0';
                return source[current];
            }

            const _string = () => {
                while (peek() != '"' && !isAtEnd()) {
                    if (peek() == '\n') line++
                    advance();
                }

                if (isAtEnd()) {
                    error(line, "Unterminated string.")
                    return
                }

                // The closing ".
                advance()

                // Trim the surrounding quotes.
                let value = source.substring(start + 1, current - 1);
                addTokenWithLiteral(T.STRING, value);
            }

            const isDigit = (c) => c >= '0' && c <= '9'
            const isAlpha = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'
            const isAlphaNumeric = (c) => isAlpha(c) || isDigit(c)

            const peekNext = () => {
                if (current + 1 >= source.length) return '\0'
                return source[current + 1]
            }

            const _number = () => {
                while (isDigit(peek())) advance()

                // Look for a fractional part.
                if (peek() == '.' && isDigit(peekNext())) {
                    // Consume the "."
                    advance()

                    while (isDigit(peek())) advance()
                }

                addToken(T.NUMBER, Number.parseFloat(source.substring(start, current)))
            }

            const _identifier = () => {
                while (isAlphaNumeric(peek())) advance()

                let text = source.substring(start, current)
                let type = keywords.get(text) ?? T.IDENTIFIER
                // if (type == null) type = T.IDENTIFIER

                addToken(type)
            }

            const scanToken = () => {
                let c = advance();
                switch (c) {
                    case '(': addToken(T.LEFT_PAREN); break
                    case ')': addToken(T.RIGHT_PAREN); break
                    case '{': addToken(T.LEFT_BRACE); break
                    case '}': addToken(T.RIGHT_BRACE); break
                    case ',': addToken(T.COMMA); break
                    case '.': addToken(T.DOT); break
                    case '-': addToken(T.MINUS); break
                    case '+': addToken(T.PLUS); break
                    case ';': addToken(T.SEMICOLON); break
                    case '*': addToken(T.STAR); break

                    case '!':
                        addToken(match('=') ? T.BANG_EQUAL : T.BANG)
                        break;
                    case '=':
                        addToken(match('=') ? T.EQUAL_EQUAL : T.EQUAL)
                        break;
                    case '<':
                        addToken(match('=') ? T.LESS_EQUAL : T.LESS)
                        break;
                    case '>':
                        addToken(match('=') ? T.GREATER_EQUAL : T.GREATER)
                        break;

                    case '/':
                        if (match('/')) {
                            // A comment goes until the end of the line.
                            while (peek() != '\n' && !isAtEnd()) advance()
                        } else {
                            addToken(T.SLASH)
                        }
                        break;

                    case ' ':
                    case '\r':
                    case '\t':
                        // Ignore whitespace.
                        break

                    case '\n':
                        line++
                        break

                    case '"': _string(); break

                    default:
                        if (isDigit(c)) {
                            _number()
                        } else if (isAlpha(c)) {
                            _identifier()
                        } else {
                            error(line, 'Unexpected character.')
                        }
                        break
                }
            }

            while (!isAtEnd()) {
                start = current
                scanToken()
            }

            tokens.push(token(T.EOF, '', null, line))
            return tokens
        }

        const tokens = scanTokens()

        for (let token of tokens) {
            console.log(token)
        }

        return hasError
    }

    const runFile = (file) => {
        const data = readFileSync(resolve(file))
        const ok = run(data.toString())
        if (!ok) {
            process.exit(65)
        }
    }

    const runPromt = () => {
        const loop = () => rl.question('> ', line => {
            run(line)
            loop()
        })

        loop()
        rl.on('close', () => process.exit(0))
    }

    const [file] = process.argv.slice(2)

    file ? runFile(file) : runPromt()
}

main()