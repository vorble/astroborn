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

interface ExpressionIdentifier {
  kind: 'identifier',
  identifier: string,
}
interface ExpressionModuleItem {
  kind: 'module',
  moduleKind: 'item',
}
interface ExpressionModuleMob {
  kind: 'module',
  moduleKind: 'mob',
}
interface ExpressionModuleRoom {
  kind: 'module',
  moduleKind: 'room',
}
interface ExpressionModuleQuest {
  kind: 'module',
  moduleKind: 'quest',
}
interface ExpressionModuleZone {
  kind: 'module',
  moduleKind: 'zone',
}
type ExpressionModule = ExpressionModuleItem
                      | ExpressionModuleMob
                      | ExpressionModuleRoom
                      | ExpressionModuleQuest
                      | ExpressionModuleZone
interface ExpressionValue {
  kind: 'value',
  value: number | string,
}
type Expression = ExpressionIdentifier
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
  const [rest, token] = _parseExpressionGetNextIdentifier(text)
  text = rest
  if (token.identifier == 'module') {
    return parseExpressionInteriorModule(text)
  }
  throw new ParseError('Unexpected expression kind ' + JSON.stringify(token.identifier) + '.')
}

function _parseExpressionGetNextIdentifier(text: string): ParseResult<ExpressionIdentifier> {
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

function parseExpressionInteriorModule(text: string): ParseResult<Expression> {
  const [rest, token] = _parseExpressionGetNextIdentifier(text)
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

function nextToken(text: string): ParseResult<null | ParseToken> {
  text = eatSpace(text)[0]
  while (text.length > 0 && text[0] == '#') {
    text = eatComment(text)[0]
    text = eatSpace(text)[0]
  }
  if (text.length <= 0) {
    return null
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
  if (!/^[$%@]?[a-zA-Z_][a-zA-Z0-9_-]{0,15}$/.test(text)) {
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
