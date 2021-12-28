import { LangID } from './lang.js'

export interface StringTable {
  welcomeMessage: string,
  buttonGrid: {
    look: string,
    lookAt: string,
    use: string,
    talk: string,
    get: string,
    item: string,
    item_look_at: string,
    item_use: string,
    item_equip: string,
    item_unequip: string,
    item_equip_full: string,
    item_equip_dupe: string,
    item_equip_success: string,
  },
}

export async function getStrings(langID: LangID): Promise<StringTable> {
  const result = await import('./strings_' + langID + '.js')
  return result.default
}
