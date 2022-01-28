class ParseError extends Error {}
type ParseResult<T> = [string, T]

interface ParseTokenParenOpen {
  kind: '(',
}
interface ParseTokenParenClose {
  kind: ')',
}
interface ParseTokenString {
  kind: 'string',
  value: string,
}
interface ParseTokenInteger {
  kind: 'integer',
  value: number,
}
interface ParseTokenIdentifier {
  kind: 'identifier',
  identifier: string,
}
type ParseToken = ParseTokenParenOpen
                | ParseTokenParenClose
                | ParseTokenString
                | ParseTokenInteger
                | ParseTokenIdentifier

interface ExpressionEach {
  kind: 'each',
  exprs: Array<Expression>,
}
interface ExpressionIdentifier {
  kind: 'identifier',
  identifier: string,
}
interface ExpressionIf {
  kind: 'if',
  condition: Expression,
  trueBranch: Expression,
  falseBranch?: Expression,
}
interface ExpressionModuleItem {
  kind: 'module',
  moduleKind: 'item',
  itemNo: number,
  exprs: Array<Expression>,
}
interface ExpressionModuleMob {
  kind: 'module',
  moduleKind: 'mob',
  mobNo: number,
  exprs: Array<Expression>,
}
interface ExpressionModuleRoom {
  kind: 'module',
  moduleKind: 'room',
  roomNo: number,
  exprs: Array<Expression>,
}
interface ExpressionModuleQuest {
  kind: 'module',
  moduleKind: 'quest',
  questNo: number,
  exprs: Array<Expression>,
}
interface ExpressionModuleZone {
  kind: 'module',
  moduleKind: 'zone',
  zoneNo: number,
  exprs: Array<Expression>,
}
type ExpressionModule = ExpressionModuleItem
                      | ExpressionModuleMob
                      | ExpressionModuleRoom
                      | ExpressionModuleQuest
                      | ExpressionModuleZone
interface ExpressionRoom {
  kind: 'room',
  roomNo: number,
  exprs: Array<Expression>,
}
interface ExpressionThing {
  kind: 'thing',
  exprs: Array<Expression>,
}
interface ExpressionState {
  kind: 'state',
  identifier: string,
  value: number,
}
interface ExpressionValue {
  kind: 'value',
  value: number | string,
}
type Expression = ExpressionEach
                | ExpressionIdentifier
                | ExpressionIf
                | ExpressionModule
                | ExpressionRoom
                | ExpressionState
                | ExpressionThing
                | ExpressionValue

function parse(text: string): Array<Expression> {
  return parseExpressionRest(text, true)[1]
}

function parseExpressionRest(text: string, root: boolean): ParseResult<Array<Expression>> {
  const result: Array<Expression> = []
  while (true) {
    const [rest, token] = nextToken(text)
    text = rest
    if (token == null) {
      if (root) {
        break
      } else {
        throw new ParseError('Unterminated expression.')
      }
    } else if (token.kind == ')') {
      if (root) {
        throw new ParseError('Unexpected close paren.')
      } else {
        break
      }
    } else {
      const [rest2, expr] = parseExpressionHaveToken(text, token)
      text = rest2
      result.push(expr)
    }
  }
  return [text, result]
}

function parseExpressionHaveToken(text: string, token: ParseToken): ParseResult<Expression> {
  if (token.kind == 'identifier') {
    return [text, token]
  } else if (token.kind == 'integer' || token.kind == 'string') {
    return [text, { kind: 'value', value: token.value }]
  } else if (token.kind == '(') {
    return parseExpressionInterior(text)
  } else if (token.kind == ')') {
    throw new ParseError('Unexpected close paren.')
  } else {
    throw new ParseError('Assertion error. token = ' + JSON.stringify(token))
  }
}

function parseExpressionInterior(text: string): ParseResult<Expression> {
  const [rest, token] = _nextIdentifier(text)
  text = rest
  if (token.identifier == 'each') {
    return parseExpressionInteriorEach(text)
  } else if (token.identifier == 'if') {
    return parseExpressionInteriorIf(text)
  } else if (token.identifier == 'module') {
    return parseExpressionInteriorModule(text)
  } else if (token.identifier == 'room') {
    return parseExpressionInteriorRoom(text)
  } else if (token.identifier == 'state') {
    return parseExpressionInteriorState(text)
  } else if (token.identifier == 'thing') {
    return parseExpressionInteriorThing(text)
  }
  throw new ParseError('Unexpected expression kind ' + JSON.stringify(token.identifier) + '.')
}

function parseExpressionInteriorEach(text: string): ParseResult<ExpressionEach> {
  const [rest, exprs] = parseExpressionRest(text, false)
  text = rest
  return [text, { kind: 'each', exprs }]
}

function parseExpressionInteriorIf(text: string): ParseResult<ExpressionIf> {
  const [rest, conditionStart] = nextToken(text)
  text = rest
  if (conditionStart == null) {
    throw new ParseError('Expected if condition.')
  }
  const [rest2, condition] = parseExpressionHaveToken(text, conditionStart)
  text = rest2
  const [rest3, trueBranchStart] = nextToken(text)
  text = rest3
  if (trueBranchStart == null) {
    throw new ParseError('Expected true branch.')
  }
  const [rest4, trueBranch] = parseExpressionHaveToken(text, trueBranchStart)
  text = rest4
  const [rest5, closeParenMaybe] = nextToken(text)
  text = rest5
  if (closeParenMaybe == null) {
    throw new ParseError('Unexpected end of input.')
  }
  let falseBranch: undefined | Expression
  if (closeParenMaybe.kind != ')') {
    const [rest6, falseBranchPresent] = parseExpressionHaveToken(text, closeParenMaybe)
    text = rest6
    falseBranch = falseBranchPresent
  }
  const [rest7, closeParenExpected] = nextToken(text)
  text = rest7
  if (closeParenExpected == null) {
    throw new ParseError('Unexpected end of input.')
  } else if (closeParenExpected.kind != ')') {
    throw new ParseError('Expected close parenthesis.')
  }
  return [text, { kind: 'if', condition, trueBranch, falseBranch }]
}

function parseExpressionInteriorModule(text: string): ParseResult<ExpressionModule> {
  const [rest, token] = _nextIdentifier(text)
  text = rest
  if (token.identifier == 'item') {
    return parseExpressionInteriorModuleItem(text)
  } else if (token.identifier == 'mob') {
    return parseExpressionInteriorModuleMob(text)
  } else if (token.identifier == 'room') {
    return parseExpressionInteriorModuleRoom(text)
  } else if (token.identifier == 'quest') {
    return parseExpressionInteriorModuleQuest(text)
  } else if (token.identifier == 'zone') {
    return parseExpressionInteriorModuleZone(text)
  }
  throw new ParseError('Unexpected module kind ' + JSON.stringify(token.identifier) + '.')
}

function parseExpressionInteriorModuleItem(text: string): ParseResult<ExpressionModuleItem> {
  const [rest, token] = _nextTokenInteger(text)
  text = rest
  const [rest2, exprs] = parseExpressionRest(text, false)
  text = rest2
  return [text, { kind: 'module', moduleKind: 'item', itemNo: token.value, exprs }]
}

function parseExpressionInteriorModuleMob(text: string): ParseResult<ExpressionModuleMob> {
  const [rest, token] = _nextTokenInteger(text)
  text = rest
  const [rest2, exprs] = parseExpressionRest(text, false)
  text = rest2
  return [text, { kind: 'module', moduleKind: 'mob', mobNo: token.value, exprs }]
}

function parseExpressionInteriorModuleRoom(text: string): ParseResult<ExpressionModuleRoom> {
  const [rest, token] = _nextTokenInteger(text)
  text = rest
  const [rest2, exprs] = parseExpressionRest(text, false)
  text = rest2
  return [text, { kind: 'module', moduleKind: 'room', roomNo: token.value, exprs }]
}

function parseExpressionInteriorModuleQuest(text: string): ParseResult<ExpressionModuleQuest> {
  const [rest, token] = _nextTokenInteger(text)
  text = rest
  const [rest2, exprs] = parseExpressionRest(text, false)
  text = rest2
  return [text, { kind: 'module', moduleKind: 'quest', questNo: token.value, exprs }]
}

function parseExpressionInteriorModuleZone(text: string): ParseResult<ExpressionModuleZone> {
  const [rest, token] = _nextTokenInteger(text)
  text = rest
  const [rest2, exprs] = parseExpressionRest(text, false)
  text = rest2
  return [text, { kind: 'module', moduleKind: 'zone', zoneNo: token.value, exprs }]
}

function parseExpressionInteriorRoom(text: string): ParseResult<ExpressionRoom> {
  const [rest, token] = _nextTokenInteger(text)
  text = rest
  const [rest2, exprs] = parseExpressionRest(text, false)
  text = rest2
  return [text, { kind: 'room', roomNo: token.value, exprs }]
}

function parseExpressionInteriorState(text: string): ParseResult<ExpressionState> {
  const [rest, identifierToken] = _nextIdentifier(text)
  text = rest
  const [rest2, valueToken] = _nextTokenInteger(text)
  text = rest2
  return [text, { kind: 'state', identifier: identifierToken.identifier, value: valueToken.value }]
}

function parseExpressionInteriorThing(text: string): ParseResult<ExpressionThing> {
  const [rest, exprs] = parseExpressionRest(text, false)
  text = rest
  return [text, { kind: 'thing', exprs }]
}

// Because of the error messaging for unexpected ), you should use this function only in functions
// like parseExpressionInterior*() to ensure the error makes sense.
function _nextIdentifier(text: string): ParseResult<ParseTokenIdentifier> {
  const [rest, token] = nextToken(text)
  text = rest
  if (token == null) {
    throw new ParseError('Unterminated expression.')
  } else if (token.kind == 'integer') {
    throw new ParseError('Unexpected integer.')
  } else if (token.kind == 'string') {
    throw new ParseError('Unexpected string.')
  } else if (token.kind == '(') {
    throw new ParseError('Unexpected start of expression.')
  } else if (token.kind == ')') {
    throw new ParseError('Unexpected end of expression.')
  }
  return [rest, token]
}

// Because of the error messaging for unexpected ), you should use this function only in functions
// like parseExpressionInterior*() to ensure the error makes sense.
function _nextTokenInteger(text: string): ParseResult<ParseTokenInteger> {
  const [rest, token] = nextToken(text)
  text = rest
  if (token == null) {
    throw new ParseError('Unterminated expression.')
  } else if (token.kind == 'string') {
    throw new ParseError('Unexpected string.')
  } else if (token.kind == '(') {
    throw new ParseError('Unexpected start of expression.')
  } else if (token.kind == ')') {
    throw new ParseError('Unexpected end of expression.')
  } else if (token.kind == 'identifier') {
    throw new ParseError('Unexpected identifier.')
  }
  return [rest, { kind: 'integer', value: token.value }]
}

function nextToken(text: string): ParseResult<ParseToken | null> {
  text = eatSpace(text)[0]
  while (text.length > 0 && text[0] == '#') {
    text = eatComment(text)[0]
    text = eatSpace(text)[0]
  }
  if (text.length <= 0) {
    return [text, null]
  }
  if (text[0] == '(') {
    return [text.slice(1), { kind: '(' }]
  } else if (text[0] == ')') {
    return [text.slice(1), { kind: ')' }]
  } else if (text[0] == '`') {
    return parseString(text)
  } else if (/^-?\d/.test(text)) {
    return parseABInteger(text)
  } else {
    return parseIdentifier(text)
  }
}

// Read the word until a space, close parenthesis, or other terminating character.
function _parseBasicWord(text: string): ParseResult<string> {
  for (let i = 0; i < text.length; ++i) {
    if (/\s/.test(text[i]) || text[i] == '(' || text[i] == ')') {
      return [text.slice(i), text.slice(0,i)]
    }
  }
  return ['', text]
}

function parseString(text: string): ParseResult<ParseTokenString> {
  if (text.length <= 0 || text[0] != '`') {
    throw new ParseError('Expected string start.')
  }
  const end = text.slice(1).indexOf('`')
  if (end < 0) {
    throw new ParseError('Unterminated string.')
  }
  return [text.slice(end + 1), {kind: 'string', value: text.slice(1, end) }]
}

function parseABInteger(text: string): ParseResult<ParseTokenInteger> {
  const [rest, part] = _parseBasicWord(text)
  if (!/^-?\d{1,10}$/.test(part)) {
    // TODO: Could probably use some more parsing error cases to describe the error to the programmer.
    throw new ParseError('Invalid integer.')
  }
  return [rest, { kind: 'integer', value: parseInt(part) }]
}

function parseIdentifier(text: string): ParseResult<ParseTokenIdentifier> {
  const [rest, part] = _parseBasicWord(text)
  console.log(JSON.stringify(part))
  if (!/^[$%@]?[a-zA-Z_][a-zA-Z0-9_-]{0,15}$/.test(part)) {
    // TODO: Could probably use some more parsing error cases to describe the error to the programmer.
    throw new ParseError('Invalid identifier.')
  }
  return [rest, { kind: 'identifier', identifier: part }]
}

function eatComment(text: string): ParseResult<undefined> {
  if (text.length <= 0) {
    throw new ParseError('Unexpected end of input.')
  } else if (text[0] != '#') {
    throw new ParseError('Comment start character expected.')
  }
  return [cutToEOL(text)[0], undefined]
}

function eatSpace(text: string): ParseResult<undefined> {
  return [text.trimStart(), undefined]
}

// Maybe this needs to handle end-of-line markers better. This should handle \n and \r\n.
function cutToEOL(text: string): ParseResult<undefined> {
  const eol = text.indexOf('\n')
  if (eol < 0) {
    return ['', undefined]
  }
  return [text.slice(eol + 1), undefined]
}

const fs = require('fs')
const data = fs.readFileSync('./sample.ast').toString('utf-8')
console.log(parse(data))
