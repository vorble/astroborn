import { GameProgress, GameAction } from './game.js'

export interface Room {
  description: string,
  things: Array<RoomThing>,
  tick?: () => void | undefined | null | GameAction,
}

export interface RoomThing {
  name: string,
  lookAt: string,
  exit?: RoomExit,
  use?: () => GameAction,
}

export interface RoomExit {
  goNarration: string,
  roomNo?: number
}

export type RoomGenerator = (progress: GameProgress, roomNo: number) => Room
