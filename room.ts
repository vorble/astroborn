import { GameProgress, GameAction } from './game.js'

export interface Room {
  description: string,
  things: Array<RoomThing>,
  tick?: () => void | undefined | null | GameAction,
  battle?: () => void | undefined | null | GameAction,
  healing?: boolean,
}

export interface RoomThing {
  name: string,
  lookAt: string,
  isHereDescription?: string,
  exit?: RoomExit,
  use?: () => GameAction,
  take?: () => GameAction,
  talk?: Array<RoomThingTalk>,
}

export interface RoomThingTalk {
  topic: string,
  action: () => GameAction,
}

export interface RoomExit {
  goNarration: string,
  roomNo?: number
}

export type RoomGenerator = (progress: GameProgress, roomNo: number) => Room
