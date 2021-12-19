import { ButtonsBar, ButtonBarAction, ButtonsGrid } from './buttons.js'
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
  private bar: ButtonsBar
  private grid: ButtonsGrid

  constructor(lang: any) {
    this.langID = lookupLangID(lang)
    this.playerRoomNo = ROOM_NO_START
    this.state = {
    }
    this.bar = new ButtonsBar()
    this.grid = new ButtonsGrid(this)
    this.updateActions(/*resetPage=*/true)
  }

  // TODO: Unused?
  /*
  getRoom(roomNo: number): Room {
    const room = rooms.find((room) => room.roomNo == roomNo)
    if (!room) {
      throw new Error(`Room ${ roomNo } not found.`)
    }
    return room
  }
  */

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

  updateActions(resetPage: boolean) {
    const room = this.getPlayerRoom()
    const exits = this.getRoomExits(room)

    const actions: Array<ButtonBarAction> = []
    for (const exit of exits) {
      actions.push({
        text: exit.name.get(this.langID),
        // XXX: Hmmm... is this good or bad? Would using an interface with action tokens work better instead?
        do: () => {
          this.doTakeExit(exit.roomExitNo)
        },
      })
    }
    if (resetPage) {
      this.bar.setActionsAndPage(actions, 0)
    } else {
      this.bar.setActions(actions)
    }
    this.grid.reset()
  }

  narrate(text: string) {
    const story = document.getElementsByClassName('story')[0]

    const storyElement = document.createElement('div')
    storyElement.classList.add('story_element')
    storyElement.innerText = text
    story.appendChild(storyElement)
    storyElement.scrollIntoView()
  }

  doLook() {
    const room = this.getPlayerRoom()
    const description = this.getRoomDescription(room)
    this.narrate(description.get(this.langID))
  }

  doTakeExit(roomExitNo: number) {
    const room = this.getPlayerRoom()
    const exits = this.getRoomExits(room)
    const exit = exits.find((exit) => exit.roomExitNo == roomExitNo)
    if (!exit) {
      throw new Error('Exit not found.')
    }
    this.playerRoomNo = exit.roomNo
    this.narrate(exit.takeDescription.get(this.langID))
    this.updateActions(/*resetPage=*/true)
  }
}
