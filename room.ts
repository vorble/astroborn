import { GameProgress } from './game.js'

export interface Room {
  description: string,
  things: Array<RoomThing>,
  // Return true if the room's state is updated.
  tick?: () => boolean,
}

interface RoomThing {
  name: string,
  lookAt: string,
}

export type RoomGenerator = (progress: GameProgress, roomNo: number) => Room
