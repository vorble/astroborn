import { LangID, LangMap } from '../lang.js'
import { GameState, FromGameState, stateAddItem } from '../game.js'
import { Narration, Scene } from '../scene.js'
import { strings } from '../strings.js'

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

export function getRoom(roomNo: number): null | Room {
  for (const room of rooms) {
    if (room.roomNo == roomNo) {
      return room
    }
  }
  return null
}

export const items = [
  ...Lenuve.items,
  ...Void.items,
]

export function getItem(itemNo: number): null | Item {
  for (const item of items) {
    if (item.itemNo == itemNo) {
      return item
    }
  }
  return null
}

// Use this function to create an initial game state. Implicit return type is intentional. It helps
// define the GameState interface.
export function state() {
  return {
    lenuve: Lenuve.state(),
    void: Void.state(),
  }
}

export const startRoomNo = Lenuve.rooms[0].roomNo

export interface Room {
  roomNo: number,
  name: LangMap<string>,
  description: FromGameState<LangMap<string>>,
  things: FromGameState<Array<Thing>>,
}

export interface Thing {
  name: LangMap<string>,
  description: LangMap<string>,
  exit?: ThingExit,
  use?: Menu,
  talk?: Menu,
  get?: Menu,
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

export type ActionResult = undefined | null | void | LangMap<Narration | Scene> | string

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

interface StatsOptional {
  health?: number,
  energy?: number,
  attack?: number,
  defense?: number,
  power?: number,
  spirit?: number,
  tech?: number,
}
export interface EquipmentStats extends StatsOptional {
  // Only one piece of equipment in a singleton category may be equipped. For example, the player
  // may only equip a single weapon.
  singletonCategory?: 'weapon' | 'head' | 'gloves',
}

export function makePickupItem<R>(item: Item, items: Record<keyof R, boolean>, stateItemsKey: keyof R): Array<Thing> {
  if (items[stateItemsKey]) {
    return []
  }
  return [{
    name: item.name,
    description: item.description,
    get: {
      text: item.name,
      action: (state: GameState) => {
        items[stateItemsKey] = true
        stateAddItem(state, item.itemNo)
        return strings.actions.youPickUpItem(item)
      },
    },
  }]
}
