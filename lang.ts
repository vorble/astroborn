// A LangMap is an object which holds data in several languages.
// Use LangMap class for user-facing text.
// Use langmap() function as a shorthand for new LangMap().
// Example LangMap with German and Chinese strings:
//   lm = langmap({ dede: 'Hallo.', zhcn: '你好.' })
// Get the text for a particular language with .get()
//   lm.get('dede') -> 'Hallo.'
//   lm.get('enus') -> 'Hallo.' // Fallback to first language given during creation.
//   lm.get('zhcn') -> '你好.'

export type LangID = 'dede' | 'enus' | 'zhcn'

export interface LangMapInput<T> {
  dede?: T
  enus?: T
  zhcn?: T
}

export class LangMap<T> {
  private def: T // XXX: Hmm, maybe I want a reference to the LangID too.
  private dede?: T
  private enus?: T
  private zhcn?: T

  constructor(langs: LangMapInput<T>) {
    let def: undefined | T
    // JavaScript promises to keep object key order stable, right? ...right?
    // Relied upon to have first specified language in the constructor be the
    // default.
    for (const langID of Object.keys(langs)) {
      if (langID === 'dede' || langID === 'enus' || langID === 'zhcn') {
        this[langID] = langs[langID]
        if (!def) {
          def = langs[langID]
        }
      }
    }
    if (typeof def === 'undefined') {
      throw new Error('No languages given!')
    }
    this.def = def
  }

  get(langID: LangID): T {
    const lookedUp = this[langID]
    return typeof lookedUp === 'undefined' ? this.def : lookedUp
  }

  getDefault(): T {
    return this.def
  }
}

export function langmap<T>(langs: LangMapInput<T>): LangMap<T> {
  return new LangMap<T>(langs)
}

