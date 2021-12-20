import { LangID } from './lang.js'

export interface StringTable {
  welcomeMessage: string,
  buttonGrid: {
    look: string,
    lookAt: string,
    use: string,
  },
}

export async function getStrings(langID: LangID): Promise<StringTable> {
  const result = await import('./strings_' + langID + '.js')
  return result.default
}
