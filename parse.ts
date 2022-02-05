import { LangMapInput, LangID, toLangID, LANGS } from './lang.js'
import * as fs from 'fs'

// TODO: Check my terminology. Part of this code might be a lexer and it's been a while since
// I took the class on them. The goal is to have the functional components named in a way that
// helps identify what exactly it is. Most things are just called "parser" here.

export interface Parser {
  filename: string
  source: string
  lineNo: number
  startOfCurrentLine: number
  cursor: number
  sawNewLine: boolean
}

// The parser field holds the position and other details from the source file for the token. The
// parser field points to the token in the source.
export interface TokenEOF        { parser: Parser, kind: 'eof' }
export interface TokenParenClose { parser: Parser, kind: ')' }
export interface TokenParenOpen  { parser: Parser, kind: '(' }
export interface TokenString     { parser: Parser, kind: 'string', value: string }
export interface TokenInteger    { parser: Parser, kind: 'integer', value: number }
export interface TokenIdentifier { parser: Parser, kind: 'identifier', identifier: string }
export interface TokenVariable   { parser: Parser, kind: 'variable', identifier: string }

export type Token = TokenEOF
                  | TokenIdentifier
                  | TokenInteger
                  | TokenParenClose
                  | TokenParenOpen
                  | TokenString
                  | TokenVariable

export interface ExpressionList { parser: Parser, kind: 'list', exprs: Array<Expression> }

// Expressions are built directly from individual tokens, except for the
// list expression, which has its own type.
export type Expression = TokenIdentifier
                       | TokenString
                       | TokenInteger
                       | TokenVariable
                       | ExpressionList

export type ParseResult<T> = [Parser, T]

export class ParseError extends Error {
  p: Parser
  constructor(p: Parser, message: string) {
    super(message)
    this.p = p
  }
  printParseError() {
    printMessageWithContext(this.p, this.message)
  }
}

function newParserFromFile(filename: string): Parser {
  return {
    filename,
    source: fs.readFileSync(filename).toString('utf-8'),
    lineNo: 1,
    startOfCurrentLine: 0,
    cursor: 0,
    sawNewLine: false,
  }
}

function printMessageWithContext(p: Parser, message: string) {
  console.log(p.filename + ':' + p.lineNo + ': ' + message)
  const [line, lineIndex] = getCurrentLine(p)
  console.log(line)
  console.log(line.slice(0, lineIndex).replace(/./g, ' ') + '^')
}

// Returns the line and the index in the line.
function getCurrentLine(p: Parser): [string, number] {
  const p2 = eatToEOL(p)
  const line = p.source.slice(p.startOfCurrentLine, p2.cursor)
  return [line, p.cursor - p.startOfCurrentLine]
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
  // Spaces, tabs, newlines, etc.
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

function nextToken(p: Parser): ParseResult<Token> {
  p = eatSpace(p)
  while (!isEOF(p) && p.source.charAt(p.cursor) == '#') {
    p = eatComment(p)
    p = eatSpace(p)
  }
  if (isEOF(p)) {
    return [p, { kind: 'eof', parser: p }]
  }
  const rest = p.source.slice(p.cursor)
  if (rest[0] == '(') {
    return [eatCount(p, 1), { kind: '(', parser: p }]
  } else if (rest[0] == ')') {
    return [eatCount(p, 1), { kind: ')', parser: p }]
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

function parseString(p: Parser): ParseResult<TokenString> {
  if (isEOF(p) || p.source.charAt(p.cursor) != '`') {
    throw new ParseError(p, 'Expected string start.')
  }
  const stringStart = eatCount(p, 1)
  const finalQuote = eatWhile(stringStart, (c) => c != '`')
  if (isEOF(finalQuote)) {
    throw new ParseError(p, 'Unterminated string.')
  }
  const next = eatCount(finalQuote, 1)
  return [next, { kind: 'string', value: p.source.slice(stringStart.cursor, finalQuote.cursor), parser: p }]
}

function parseABInteger(p: Parser): ParseResult<TokenInteger> {
  const next = eatWord(p)
  const word = p.source.slice(p.cursor, next.cursor)
  if (!/^-?\d{1,10}$/.test(word)) {
    // TODO: Could probably use some more parsing error cases to describe the error to the programmer.
    throw new ParseError(p, 'Invalid integer.')
  }
  return [next, { kind: 'integer', value: parseInt(word), parser: p }]
}

function parseIdentifier(p: Parser): ParseResult<TokenIdentifier> {
  const next = eatWord(p)
  const word = p.source.slice(p.cursor, next.cursor)
  return [next, { kind: 'identifier', identifier: word, parser: p }]
}

function parseVariable(p: Parser): ParseResult<TokenVariable> {
  const [next, token] = parseIdentifier(p)
  if (!/^[$%@]?[a-zA-Z_][a-zA-Z0-9_-]{0,15}$/.test(token.identifier)) {
    // TODO: Could probably use some more parsing error cases to describe the error to the programmer.
    throw new ParseError(p, 'Invalid variable name.')
  }
  return [next, { kind: 'variable', identifier: token.identifier, parser: p }]
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
      const startOfList = p
      const [rest2, exprs] = parseListInterior(p, false)
      p = rest2
      result.push({ parser: startOfList, kind: 'list', exprs: exprs })
    } else {
      result.push(token)
    }
  }
  return [p, result]
}

// TODO: I'd like the script parts to be separated from the parser/lexer

interface Conditional<T> {
  kind: 'cond',
  expr: Expression,
  trueBranch: T,
  falseBranch?: T,
}

interface ScriptStateSlot {
  name: string,
  value: number,
}

interface ScriptQuest {
  questNo: number,
  name: LangMapInput<string>,
  state: Array<ScriptStateSlot>,
  rooms: Array<Conditional<ScriptQuestRoom>>
}

interface ScriptQuestRoom {
  roomNo: number,
  things: Array<ScriptThing | Conditional<ScriptThing>>,
}

interface ScriptRoom {
  roomNo: number,
  name: LangMapInput<string>,
  description: LangMapInput<string> | Conditional<LangMapInput<string>>,
  things: Array<ScriptThing | Conditional<ScriptThing>>,
}

interface ScriptThing {
}

interface ScriptWorld {
  quests: Map<number, ScriptQuest>,
  rooms: Map<number, ScriptRoom>,
  zones: Map<number, ScriptZone>,
}

interface ScriptZone {
}

function newWorld(): ScriptWorld {
  return {
    quests: new Map(),
    rooms: new Map(),
    zones: new Map(),
  }
}

function extractCommand(expr: Expression): [TokenIdentifier, Expression[]] {
  if (expr.kind != 'list') {
    throw new ParseError(expr.parser, 'Expected a list expression.') // TODO: Maybe I should make some global error codes for consistency.
  }
  if (expr.exprs.length == 0) {
    throw new ParseError(expr.parser, 'Expected list command.')
  }
  const [command, ...rest] = expr.exprs
  if (command.kind != 'identifier') {
    throw new ParseError(command.parser, 'Expected identifier.')
  }
  return [command, rest]
}

// TODO: Needs a better name.
function worldParse(w: ScriptWorld, expr: Expression) {
  if (expr.kind != 'list') {
    throw new ParseError(expr.parser, 'Expected a list expression.')
  }    
  for (const e of expr.exprs) {
    const [command, args] = extractCommand(e)
    const parseFunctions: Record<string, (w: ScriptWorld, command: TokenIdentifier, args: Expression[]) => void> = {
      'room': worldParseRoom,
      'quest': worldParseQuest,
      'zone': worldParseZone,
    }
    if (!(command.identifier in parseFunctions)) {
      throw new ParseError(command.parser, `Unexpected command. Expected one of ${ Object.keys(parseFunctions).join(', ') }.`)
    }
    parseFunctions[command.identifier](w, command, args)
  }
}

// command is passed to give context for errors.
function worldParseRoom(w: ScriptWorld, command: TokenIdentifier, args: Expression[]) {
  throw new ParseError(command.parser, `worldParseRoom() is not implemented.`)
}

// command is passed to give context for errors.
function worldParseQuest(w: ScriptWorld, command: TokenIdentifier, args: Array<Expression>) {
  if (args.length < 1) {
    throw new ParseError(command.parser, 'Expected quest number after quest command.')
  } else if (args[0].kind != 'integer') {
    throw new ParseError(command.parser, 'Expected quest number after quest command.')
  }
  const questNo = args[0].value
  if (w.quests.has(questNo)) {
    throw new ParseError(args[0].parser, `Quest ${ questNo } is already defined.`)
  }
  const quest: ScriptQuest = {
    questNo,
    name: {},
    state: [],
    rooms: [],
  }
  for (const questExpression of args.slice(1)) {
    worldParseQuestExpression(w, command, quest, questExpression)
  }
  if (Object.keys(quest.name).length == 0) {
    throw new ParseError(command.parser, 'Quest has no name.')
  }
}

//  +-- command, passed to give context for errors.
//  V
// (quest 0000
//    ...
//    xxx    <-- questExpression
//    ...)

function worldParseQuestExpression(w: ScriptWorld, command: TokenIdentifier, quest: ScriptQuest, questExpression: Expression) {
  const [questCmd, args] = extractCommand(questExpression)
  // didn't need name, but will need it for the room
  /*
  if (questCmd.identifier == 'name') {
    // TODO: This isn't quite right
    parseLangMap(questCmd.identifier, quest.name, args)
  }
  */
  if (questCmd.identifier == 'state') {
    parseState(quest.state, questExpression, 'quest')
  } else if (questCmd.identifier == 'room') {
    throw new ParseError(questCmd.parser, `Unexpected quest expression ${ questCmd.identifier }.`)
  } else {
    throw new ParseError(questCmd.parser, `Unexpected quest expression ${ questCmd.identifier }.`)
  }
}

// +-- expr
// V
// (state @variable value)
function parseState(state: ScriptStateSlot[], expr: Expression, context: 'quest' | 'room' | 'zone') {
  if (expr.kind != 'list') {
    throw new ParseError(expr.parser, 'Expected a list expression.')
  } else if (expr.exprs.length != 3) {
    throw new ParseError(expr.parser, 'Expected (state variable number) style entry.')
  } else if (expr.exprs[0].kind != 'identifier') {
    throw new ParseError(expr.exprs[0].parser, 'Expected identifier.')
  } else if (expr.exprs[0].identifier != 'state') {
    throw new ParseError(expr.exprs[0].parser, `Expected identifier "state".`)
  } else if (expr.exprs[1].kind != 'variable') {
    throw new ParseError(expr.exprs[1].parser, 'Expected variable.')
  } else if (expr.exprs[2].kind != 'integer') {
    throw new ParseError(expr.exprs[2].parser, 'Expected integer.')
  }
  // TODO: Based on context, require the variable identifier to have the correct prefix @quest %zone $room
  state.push({
    name: expr.exprs[1].identifier,
    value: expr.exprs[2].value,
  })
}

// +-- expr
// V
// (xxx (enus `stuff`) (zhch `东西`))
//   \
//    commandName
function parseLangMap(commandName: string, lm: LangMapInput<string>, expr: Expression) {
  if (expr.kind != 'list') {
    throw new ParseError(expr.parser, 'Expected a list expression.')
  } else if (expr.exprs.length == 0) {
    throw new ParseError(expr.parser, 'Expected expression command.')
  } else if (expr.exprs[0].kind != 'identifier') {
    throw new ParseError(expr.exprs[0].parser, 'Expected identifier.')
  } else if (expr.exprs[0].identifier != commandName) {
    throw new ParseError(expr.exprs[0].parser, `Expected identifier "${ commandName }".`)
  }
  for (const e of expr.exprs.slice(1)) {
    parseLangMapEntry(lm, e)
  }
}

// +-- expr
// V
// (dede `die Sachen`)
function parseLangMapEntry(lm: LangMapInput<string>, expr: Expression) {
  if (expr.kind != 'list') {
    throw new ParseError(expr.parser, 'Expected a list expression.')
  } else if (expr.exprs.length != 2) {
    throw new ParseError(expr.parser, 'Expected (lang `text`) style entry.')
  } else if (expr.exprs[0].kind != 'identifier') {
    throw new ParseError(expr.exprs[0].parser, 'Expected identifier.') 
  } else if (expr.exprs[1].kind != 'string') {
    throw new ParseError(expr.exprs[1].parser, 'Expected string.') 
  }
  const langID = expr.exprs[0]
  const text = expr.exprs[1]
  const lang = LANGS.find(x => x == langID.identifier)
  if (!lang) {
    throw new ParseError(langID.parser, `Unknown language code ${ langID.identifier }.`)
  }
  lm[lang] = text.value
}

// command is passed to give context for errors.
function worldParseZone(w: ScriptWorld, command: TokenIdentifier, args: Expression[]) {
  throw new ParseError(command.parser, `worldParseZone() is not implemented.`)
}

// Sample

try {
  const parser = newParserFromFile('./sample.ast')
  const [_, result] = parseListInterior(parser, true)
  const world = newWorld()
  worldParse(world, { parser, kind: 'list', exprs: result })
  console.log(JSON.stringify(result[1],null,'  '))
} catch (err) {
  if (err instanceof ParseError) {
    err.printParseError()
  } else {
    throw err
  }
}
