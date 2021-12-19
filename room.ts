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
  // Unique number per exit per room. Game state can change, changing the exits. This number uniquely
  // identifies the exit in this room. Useful when there is a delay between attempting to take an exit
  // and actually trying to use the exit object which may no longer be available as the game state may
  // have changed (wouldn't want to use the index or something like that since it could use the wrong
  // exit in that case).
  roomExitNo: number,
  name: LangMap<string>
  roomNo: number
  description: LangMap<string>
  takeDescription: LangMap<string>
}
