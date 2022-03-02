import { GameProgress } from './game.js'

export interface Room {
  description: string,
  things: Array<RoomThing>,
  // Return true if the room's state is updated.
  tick?: () => boolean,
}

export interface RoomThing {
  name: string,
  lookAt: string,
  exit?: RoomExit,
}

export interface RoomExit {
  goNarration: string,
  roomNo?: number
}

export type RoomGenerator = (progress: GameProgress, roomNo: number) => Room
