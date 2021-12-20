import { ButtonBar, ButtonBarAction, ButtonGrid } from './buttons.js'
import { LangID, LangMap, langmap, langmapFull, lookupLangID } from './lang.js'
import { Room, RoomExit } from './room.js'
import { getStrings, StringTable } from './strings.js'

import mobs from './world/mobs.js'
import rooms, { ROOM_NO_START } from './world/rooms.js'

export interface GameState {
}

export type FromGameState<T> = T | ((state: GameState) => T)

export async function start() {
  const langID = lookupLangID(window.navigator.languages)
  const strings = await getStrings(langID)
  const game = new Game(langID, strings)
  ;(window as any).game = game // ; is necessary
}

export class Game {
  langID: LangID
  strings: StringTable
  playerRoomNo: number
  state: GameState
  bar: ButtonBar
  grid: ButtonGrid

  constructor(langID: LangID, strings: StringTable) {
    this.langID = langID
    this.strings = strings
    this.playerRoomNo = ROOM_NO_START
    this.state = {
    }
    this.bar = new ButtonBar()
    this.grid = new ButtonGrid(this)

    this.updateActions(/*resetPage=*/true)
    this.narrate(strings.welcomeMessage)
    this.doLook()
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

    const lookAt = []
    for (const exit of exits) {
      lookAt.push({
        text: exit.name.get(this.langID),
        do: () => {
          this.narrate(exit.description.get(this.langID))
        },
      })
    }

    this.grid.setLayout({
      lookAt: lookAt, // TODO
      use: [], // TODO
    })
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
