import { LangID, lookupLangID } from './lang.js'

import mobs from './world/mobs.js'
import rooms, { ROOM_NO_START } from './world/rooms.js'

export interface GameState {
}

export type FromGameState<T> = T | ((state: GameState) => T)

export class Game {
  private langID: LangID
  private playerRoomNo: number
  private state: GameState

  constructor(lang: any) {
    this.langID = lookupLangID(lang)
    this.playerRoomNo = ROOM_NO_START
    this.state = {
    }
  }
}
