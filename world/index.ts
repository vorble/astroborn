import { LangID, LangMap } from '../lang.js'
import { GameState, FromGameState } from '../game.js'
import { Narration, Scene } from '../scene.js'

export {
  LangMap,
  langmap,
} from '../lang.js'
export {
  GameState,
} from '../game.js'
export {
  Scene,
} from '../scene.js'

import * as Lenuve from './lenuve/index.js'
import * as Void from './void/index.js'

export const rooms = [
  ...Lenuve.rooms,
  ...Void.rooms,
]

// Use this function to create an initial game state. Implicit return type is intentional. It helps
// define the GameState interface.
export function state() {
  return {
    lenuve: Lenuve.state(),
    void: Void.state(),
  }
}

export const startRoomNo = Void.rooms[0].roomNo

export interface Room {
  roomNo: number,
  name: LangMap<string>,
  description: FromGameState<LangMap<string>>,
  things: FromGameState<Thing | Array<Thing>>,
}

export interface Thing {
  name: LangMap<string>,
  description: LangMap<string>,
  exit?: ThingExit,
  use?: Menu,
  talk?: Menu,
}

export interface ThingExit {
  useNarration: LangMap<Narration | Scene>,
  toRoomNo?: number,
}

export type Action = Menu
                   | Array<Menu>
                   | LangMap<Narration | Scene>
                   | ((state: GameState) => ActionResult)

export interface Menu {
  text: LangMap<string>,
  action: Action,
}

export type ActionResult = undefined | null | LangMap<Narration | Scene>

export interface Item {
  itemNo: number,
  name: LangMap<string>,
  description: LangMap<string>,
  // If it can be used, it has a use action.
  use?: ((state: GameState) => ActionResult),
  // If it can be equipped, it has equipment stats.
  equipmentStats?: EquipmentStats,
  // If it can be sold, it has a sell value.
  sellValue?: number,
}

export interface EquipmentStats {
  // Only one piece of equipment in a singleton category may be equipped. For example, the player
  // may only equip a single weapon.
  singletonCategory?: 'weapon',
}
