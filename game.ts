import { LangID, LangMap, lookupLangID } from './lang.js'
import { Room, RoomExit } from './room.js'

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

  // TODO: Unused?
  getRoom(roomNo: number): Room {
    const room = rooms.find((room) => room.roomNo == roomNo)
    if (!room) {
      throw new Error(`Room ${ roomNo } not found.`)
    }
    return room
  }

  getPlayerRoom(): Room {
    const room = rooms.find((room) => room.roomNo == this.playerRoomNo)
    if (!room) {
      throw new Error(`Player room ${ this.playerRoomNo } not found.`)
    }
    return room
  }

  getRoomDescription(room: Room): LangMap<string> {
    return typeof room.description === 'function' ? room.description(this.state) : room.description
  }

  getRoomExits(room: Room): Array<RoomExit> {
    return typeof room.exits === 'function' ? room.exits(this.state) : room.exits
  }

  show() {
    const room = this.getPlayerRoom()
    const description = this.getRoomDescription(room)
    const exits = this.getRoomExits(room)
    console.log('Room - ' + room.name.get(this.langID))
    console.log(description.get(this.langID))
    console.log('Exits:')
    for (const exit of exits) {
      console.log(exit.name.get(this.langID) + ' - ' + exit.description.get(this.langID))
    }
  }

  doTakeExit(roomExitNo: number) {
    const room = this.getPlayerRoom()
    const exits = this.getRoomExits(room)
    const exit = exits.find((exit) => exit.roomExitNo == roomExitNo)
    if (!exit) {
      throw new Error('Exit not found.')
    }
    this.playerRoomNo = exit.roomNo
  }
}
