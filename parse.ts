import { LangMapInput, LangID, toLangID } from './lang.js'
import * as fs from 'fs'

interface ParseTokenEndOfFile  { kind: 'eof' }
interface ParseTokenParenClose { kind: ')' }
interface ParseTokenParenOpen  { kind: '(' }
interface ParseTokenString     { kind: 'string', value: string }
interface ParseTokenInteger    { kind: 'integer', value: number }
interface ParseTokenIdentifier { kind: 'identifier', identifier: string }
interface ParseTokenVariable   { kind: 'variable', identifier: string }

type ParseToken = ParseTokenEndOfFile
                | ParseTokenIdentifier
                | ParseTokenInteger
                | ParseTokenParenClose
                | ParseTokenParenOpen
                | ParseTokenString
                | ParseTokenVariable

// Expressions are built directly from individual tokens, except for the
// list expression, which is an array of expressions.
type Expression = ParseTokenIdentifier
                | ParseTokenString
                | ParseTokenInteger
                | ParseTokenVariable
                | Array<Expression> // The list expression.

type ParseResult<T> = [Parser, T]

class ParseError extends Error {
  p: Parser
  constructor(p: Parser, message: string) {
    super(message)
    this.p = p
  }
  print() {
    printMessageWithContext(this.p, this.message)
  }
}

interface Parser {
  filename: string
  source: string
  lineNo: number
  startOfCurrentLine: number
  cursor: number
  sawNewLine: boolean
}

function newParserFromFile(filename: string): Parser {
  const source = fs.readFileSync(filename).toString('utf-8')
  return {
    filename,
    source,
    lineNo: 1,
    startOfCurrentLine: 0,
    cursor: 0,
    sawNewLine: false,
  }
}

// Returns the line and the index in the line.
function getCurrentLine(p: Parser): [string, number] {
  const p2 = eatToEOL(p)
  const line = p.source.slice(p.startOfCurrentLine, p2.cursor)
  return [line, p.cursor - p.startOfCurrentLine]
}

function nextToken(p: Parser): ParseResult<ParseToken> {
  p = eatSpace(p)
  while (!isEOF(p) && p.source.charAt(p.cursor) == '#') {
    p = eatComment(p)
    p = eatSpace(p)
  }
  if (isEOF(p)) {
    return [p, { kind: 'eof' }]
  }
  const rest = p.source.slice(p.cursor)
  if (rest[0] == '(') {
    return [eatCount(p, 1), { kind: '(' }]
  } else if (rest[0] == ')') {
    return [eatCount(p, 1), { kind: ')' }]
  } else if (rest[0] == '`') {
    return parseString(p)
  } else if (/^-?\d/.test(rest)) {
    return parseABInteger(p)
  } else if (/^[@$%]/.test(rest)) {
    return parseVariable(p)
  } else {
    return parseIdentifier(p)
  }
}

function isEOF(p: Parser): boolean {
  return p.cursor >= p.source.length
}

function eatWhile(p: Parser, predicate: (c: string) => boolean): Parser {
  const next = { ...p }
  for ( ; !isEOF(next); ++next.cursor) {
    const c = next.source.charAt(next.cursor)
    if (p.sawNewLine) {
      ++next.lineNo
      next.startOfCurrentLine = next.cursor
      p.sawNewLine = false
    }
    if (c == '\n') {
      p.sawNewLine = true
    }
    if (!predicate(c)) {
      break
    }
  }
  return next
}

function eatSpace(p: Parser): Parser {
  // Spaces, tabes, newlines, etc.
  return eatWhile(p, (c) => /\s/.test(c))
}

function eatToEOL(p: Parser): Parser {
  // Handles \n and \r\n style newlines.
  return eatWhile(p, (c) => c != '\n')
}

function eatCount(p: Parser, count: number): Parser {
  return eatWhile(p, () => --count >= 0)
}

function eatComment(p: Parser): Parser {
  const next = { ...p }
  if (isEOF(p)) {
    throw new ParseError(p, 'Unexpected end of input.')
  } else if (p.source.charAt(p.cursor) != '#') {
    throw new ParseError(p, 'Comment start character expected.')
  }
  return eatToEOL(p)
}

function eatWord(p: Parser): Parser {
  // Eat while not white space and not a parenthesis.
  return eatWhile(p, (c) => !/(\s|[()])/.test(c))
}

function parseString(p: Parser): ParseResult<ParseTokenString> {
  if (isEOF(p) || p.source.charAt(p.cursor) != '`') {
    throw new ParseError(p, 'Expected string start.')
  }
  const stringStart = eatCount(p, 1)
  const finalQuote = eatWhile(stringStart, (c) => c != '`')
  if (isEOF(finalQuote)) {
    throw new ParseError(p, 'Unterminated string.')
  }
  const next = eatCount(finalQuote, 1)
  return [next, { kind: 'string', value: p.source.slice(stringStart.cursor, finalQuote.cursor) }]
}

function parseABInteger(p: Parser): ParseResult<ParseTokenInteger> {
  const next = eatWord(p)
  const word = p.source.slice(p.cursor, next.cursor)
  if (!/^-?\d{1,10}$/.test(word)) {
    // TODO: Could probably use some more parsing error cases to describe the error to the programmer.
    throw new ParseError(p, 'Invalid integer.')
  }
  return [next, { kind: 'integer', value: parseInt(word) }]
}

function parseIdentifier(p: Parser): ParseResult<ParseTokenIdentifier> {
  const next = eatWord(p)
  const word = p.source.slice(p.cursor, next.cursor)
  return [next, { kind: 'identifier', identifier: word }]
}

function parseVariable(p: Parser): ParseResult<ParseTokenVariable> {
  const [next, token] = parseIdentifier(p)
  if (!/^[$%@]?[a-zA-Z_][a-zA-Z0-9_-]{0,15}$/.test(token.identifier)) {
    // TODO: Could probably use some more parsing error cases to describe the error to the programmer.
    throw new ParseError(p, 'Invalid variable name.')
  }
  return [next, { kind: 'variable', identifier: token.identifier }]
}

function parseListInterior(p: Parser, root: boolean): ParseResult<Array<Expression>> {
  const pStart = p
  const result: Array<Expression> = []
  while (true) {
    const [rest, token] = nextToken(p)
    p = rest
    if (token.kind == 'eof') {
      if (root) {
        break
      } else {
        throw new ParseError(pStart, 'Unterminated expression.')
      }
    } else if (token.kind == ')') {
      if (root) {
        throw new ParseError(p, 'Unexpected close paren.')
      } else {
        break
      }
    } else if (token.kind == '(') {
      const [rest2, exprs] = parseListInterior(p, false)
      p = rest2
      result.push(exprs)
    } else {
      result.push(token)
    }
  }
  return [p, result]
}

function printMessageWithContext(p: Parser, message: string) {
  console.log(p.filename + ':' + p.lineNo + ': ' + message)
  const [line, lineIndex] = getCurrentLine(p)
  console.log(line)
  console.log(line.slice(0, lineIndex).replace(/./g, ' ') + '^')
}

try {
  const parser = newParserFromFile('./sample.ast')
  const result = parseListInterior(parser, true)
  console.log(JSON.stringify(result[1],null,'  '))
} catch (err) {
  if (err instanceof ParseError) {
    err.print()
  } else {
    throw err
  }
}
