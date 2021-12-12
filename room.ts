import {
  LangMap,
} from './lang'
import {
  FromGameState,
} from './game'

export interface Room {
  roomNo: number,
  name: LangMap<string>
  description: FromGameState<LangMap<string>>
  exits: FromGameState<Array<RoomExit>>
}

export interface RoomExit {
  name: LangMap<string>
  roomNo: number
  description: LangMap<string>
}
