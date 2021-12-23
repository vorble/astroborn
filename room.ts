import {
  LangMap,
} from './lang.js'
import {
  FromGameState,
  GameState,
} from './game.js'

export interface Room {
  roomNo: number,
  name: LangMap<string>,
  description: FromGameState<LangMap<string>>,
  exits: FromGameState<Array<RoomExit>>,
  objects: FromGameState<Array<RoomObject>>,
  convos: FromGameState<Array<RoomConvo>>,
}

export interface RoomExit {
  name: LangMap<string>,
  roomNo: number,
  description: LangMap<string>,
  takeDescription: LangMap<string>,
}

export interface RoomObject {
  name: LangMap<string>,
  description: LangMap<string>,
  useDescription: LangMap<string>,
  use: (state: GameState) => any,
}

// Presents itself as a person or entity in the room.
export interface RoomConvo {
  name: LangMap<string>,
  description: LangMap<string>,
  topics: Array<RoomConvoTopic>,
}

export interface RoomConvoTopic {
  name: LangMap<string>,
  narration: LangMap<string>,
  use: (state: GameState) => any,
}

