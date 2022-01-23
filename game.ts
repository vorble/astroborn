import { ButtonBar, ButtonGrid, ButtonGridLayoutAction } from './buttons.js'
import * as lang from './lang.js'
import { LangMap } from './lang.js'
import * as quest from './quest/index.js'
import { QuestState } from './quest/index.js'
import { Narration, Scene } from './scene.js'
import { strings } from './strings.js'

import * as world from './world/index.js'
import { Menu, Room, Thing, ThingExit, Action, Item } from './world/index.js'

// TODO: Move this to a player module or something
interface Player {
  roomNo: number,
  items: Array<number>,
  equipment: Array<number>,
  health: number,
  healthMax: number,
  energy: number,
  energyMax: number,
  attack: number,
  defense: number,
  power: number,
  spirit: number,
  tech: number,
}

type GameStateFromWorlds = ReturnType<typeof world.state>
export interface GameState extends GameStateFromWorlds {
  quest: QuestState,
  player: Player,
}
export type FromGameState<T> = T | ((state: GameState) => T)

export function stateAddItem(state: GameState, itemNo: number) {
  state.player.items.push(itemNo)
}

export class Game {
  callPassState: number
  state: GameState
  bar: ButtonBar
  grid: ButtonGrid
  activeScene: null | Scene

  constructor() {
    this.callPassState = 0
    this.state = {
      ...world.state(),
      quest: quest.state(),
      player: {
        roomNo: world.startRoomNo,
        items: [],
        equipment: [],
        health: 10,
        healthMax: 10,
        energy: 5,
        energyMax: 5,
        attack: 10,
        defense: 10,
        power: 10,
        spirit: 10,
        tech: 10,
      },
    }
    this.bar = new ButtonBar()
    this.grid = new ButtonGrid(this)
    this.activeScene = null

    this.updateActions(/*resetPage=*/true)
    this.narrate(strings.welcomeMessage)
    this.doLook()
  }

  getPlayerRoom(): Room {
    const room = world.rooms.find((room) => room.roomNo == this.state.player.roomNo)
    if (!room) {
      throw new Error(`Player room ${ this.state.player.roomNo } not found.`)
    }
    return room
  }

  getRoomDescription(room: Room): string {
    const description = (
      typeof room.description === 'function' ? room.description(this.state) : room.description
    ).get(lang.langID)
    const things = this.getRoomThings(room)
    const extra = []
    for (const thing of things) {
      if (thing.isHereText != null) {
        extra.push(thing.isHereText.get(lang.langID))
      }
    }
    return lang.joinSentences(lang.langID, [description, ...extra])
  }

  getRoomThings(room: Room): Array<Thing> {
    let things = typeof room.things === 'function' ? room.things(this.state) : room.things
    let thingsForQuests = quest.getThings(this.state, room.roomNo)
    return things.concat(thingsForQuests)
  }

  _callPassExit(exit: ThingExit): () => void {
    const expectation = this.callPassState
    return () => {
      if (this.callPassState == expectation) {
        return this.doTakeExit(exit)
      }
    }
  }

  _callPassNarrate(narration: Narration | Scene): () => void {
    const expectation = this.callPassState
    return () => {
      if (this.callPassState == expectation) {
        return this.narrate(narration)
      }
    }
  }

  _callPassEquip(item: Item): () => void {
    const expectation = this.callPassState
    return () => {
      if (this.callPassState == expectation) {
        return this.doEquip(item)
      }
    }
  }

  _callPassUnequip(item: Item): () => void {
    const expectation = this.callPassState
    return () => {
      if (this.callPassState == expectation) {
        return this.doUnequip(item)
      }
    }
  }

  _callPassAction(action: Action): () => void {
    const expectation = this.callPassState
    return () => {
      if (this.callPassState == expectation) {
        return this.doAction(action)
      }
    }
  }

  _makeMenu(menu: Menu): ButtonGridLayoutAction {
    const result: ButtonGridLayoutAction = {
      text: menu.text.get(lang.langID),
    }
    const action = menu.action
    if (typeof action === 'function') {
      result.do = this._callPassAction(action)
    } else if (action instanceof LangMap) {
      result.do = this._callPassNarrate(action.get(lang.langID))
    } else if (Array.isArray(action)) {
      result.options = action.map((action) => this._makeMenu(action))
    } else {
      result.options = [this._makeMenu(action)]
    }
    return result
  }

  updateActions(resetPage: boolean) {
    this.callPassState = (this.callPassState + 1) % 256

    const room = this.getPlayerRoom()
    const things = this.getRoomThings(room)

    const lookAt = []
    const go = []
    const get = []
    const use = []
    const talk = []
    const items: Array<ButtonGridLayoutAction> = []

    const addItem = (itemNo: number, isEquipped: boolean) => {
      const item = world.getItem(itemNo)
      if (item == null) {
        console.warn(`Couldn\'t find item for itemNo=${ itemNo }.`)
        this.state.player.items = this.state.player.items.filter((ino) => ino != itemNo)
        return
      }
      const options = [
        {
          text: strings.buttonGrid.itemLookAt,
          do: this._callPassNarrate(item.description.get(lang.langID)),
        },
      ]
      if (typeof item.use !== 'undefined') {
        options.push({
          text: strings.buttonGrid.itemUse,
          do: this._callPassAction(item.use),
        })
      }
      if (typeof item.equipmentStats !== 'undefined') {
        if (isEquipped) {
          options.push({
            text: strings.buttonGrid.itemUnequip,
            do: this._callPassUnequip(item),
          })
        } else {
          options.push({
            text: strings.buttonGrid.itemEquip,
            do: this._callPassEquip(item),
          })
        }
      }
      items.push({
        text: (isEquipped ? '@' : '') + item.name.get(lang.langID),
        options,
      })
    }
    for (const itemNo of this.state.player.equipment) {
      addItem(itemNo, true)
    }
    for (const itemNo of this.state.player.items) {
      addItem(itemNo, false)
    }

    for (const thing of things) {
      const name = thing.name.get(lang.langID)
      lookAt.push({
        text: name,
        do: this._callPassNarrate(thing.description.get(lang.langID)),
      })
      if (thing.exit) {
        go.push({
          text: name,
          do: this._callPassExit(thing.exit),
        })
      }
      if (thing.get) {
        get.push({
          text: name,
          do: this._callPassAction(thing.get.action),
        })
      }
      if (thing.use) {
        use.push(this._makeMenu(thing.use))
      }
      if (thing.talk) {
        talk.push(this._makeMenu(thing.talk))
      }
    }

    const sceneActive = this.activeScene != null

    if (resetPage) {
      this.bar.setActionsAndPage(sceneActive ? [] : go, 0)
    } else {
      this.bar.setActions(sceneActive ? [] : go)
    }


    this.grid.setLayout({ lookAt, use, talk, get, items, sceneActive }, resetPage)
  }

  write(text: string) {
    const story = document.getElementsByClassName('story')[0]
    text = text.replace(/\s+/g, ' ').replace(/\r?\n/g, ' ')
    const storyElement = document.createElement('div')
    storyElement.classList.add('story_element')
    storyElement.innerText = text
    story.appendChild(storyElement)
    storyElement.scrollIntoView()
  }

  narrate(narration: Narration | Scene) {
    if (narration instanceof Scene) {
      while (this.activeScene != null) {
        this.progressScene()
      }
      this.activeScene = narration
      this.progressScene()
    } else if (Array.isArray(narration)) {
      for (const stanza of narration) {
        this.write(stanza)
      }
    } else {
      this.write(narration)
    }
  }

  progressScene() {
    if (this.activeScene != null) {
      if (this.activeScene.hasMore()) {
        this.write(this.activeScene.next())
      }
      if (!this.activeScene.hasMore()) {
        this.activeScene = null
      }
      this.updateActions(/*resetPage=*/true)
    }
  }

  doEquip(item: Item) {
    const keepItems = []
    let claimed = false
    for (const itemNo of this.state.player.items) {
      if (!claimed && itemNo == item.itemNo) {
        claimed = true
      } else {
        keepItems.push(itemNo)
      }
    }
    let dupe = false
    if (claimed && item.equipmentStats?.singletonCategory) {
      for (const itemNo of this.state.player.equipment) {
        const equip = world.getItem(itemNo)
        if (equip && equip.equipmentStats?.singletonCategory
            && equip.equipmentStats?.singletonCategory == item.equipmentStats.singletonCategory) {
          dupe = true
        }
      }
    }
    let full = claimed && this.state.player.equipment.length >= 3
    if (full) {
      this.narrate(strings.buttonGrid.itemEquipFull)
    } else if (dupe) {
      this.narrate(strings.buttonGrid.itemEquipDupe)
    } else if (claimed) {
      this.narrate(strings.buttonGrid.itemEquipSuccess)
      this.state.player.equipment.push(item.itemNo)
      this.state.player.items = keepItems
    }
    this.updateActions(/*resetPage=*/true)
  }

  doUnequip(item: Item) {
    const keepEquipment = []
    let claimed = false
    for (const itemNo of this.state.player.equipment) {
      if (!claimed && itemNo == item.itemNo) {
        claimed = true
      } else {
        keepEquipment.push(itemNo)
      }
    }
    if (claimed) {
      this.state.player.equipment = keepEquipment
      this.state.player.items.push(item.itemNo)
    }
    this.updateActions(/*resetPage=*/true)
  }

  doLook() {
    const room = this.getPlayerRoom()
    const description = this.getRoomDescription(room)
    this.narrate(description)
  }

  doTakeExit(exit: ThingExit) {
    if (typeof exit.toRoomNo === 'number') {
      this.state.player.roomNo = exit.toRoomNo
    }
    this.narrate(exit.useNarration.get(lang.langID))
    this.updateActions(/*resetPage=*/true)
  }

  doAction(action: Action) {
    if (typeof action === 'function') {
      const result = action(this.state)
      if (typeof result === 'string') {
        this.narrate(result)
      } else if (result) {
        // TODO: Why can I pass just result without a type error?
        this.narrate(result.get(lang.langID))
      }
    }
    this.updateActions(/*resetPage=*/true)
  }
}
