import {
  LangMap,
} from './lang.js'
import {
  FromGameState,
} from './game.js'

export interface Room {
  roomNo: number,
  name: LangMap<string>
  description: FromGameState<LangMap<string>>
  exits: FromGameState<Array<RoomExit>>
  // TODO: an array of interactible things will be next (townsfolk for talking, shops, switches, etc).
}

export interface RoomExit {
  name: LangMap<string>
  roomNo: number
  description: LangMap<string>
}
