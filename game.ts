import { Battle } from './battle.js'
import { Room, RoomExit } from './room.js'
import { Scene } from './scene.js'
import { UI } from './ui.js'
import { World, getZoneNoFromRoomNo } from './world.js'

class GameTimer {
  interval: number
  action: () => void

  constructor() {
    this.interval = 0
    this.action = () => {}
  }

  start(action: () => void) {
    this.interval = setInterval(action, 500)
  }

  stop() {
    if (this.interval != 0) {
      clearInterval(this.interval)
      this.interval = 0
      this.action = () => {}
    }
  }
}

export interface GameProgress {
  get: (name: string) => number,
  set: (name: string, value: number) => void,
}

class GameProgressTotal {
  questValues: Map<string, number>
  zoneValues: Map<number, Map<string, number>>
  roomValues: Map<number, Map<string, number>>

  constructor() {
    this.questValues = new Map()
    this.zoneValues = new Map()
    this.roomValues = new Map()
  }

  static isQuestVariable(name: string): boolean {
    return name.startsWith('@')
  }

  static isZoneVariable(name: string): boolean {
    return name.startsWith('%')
  }

  static isRoomVariable(name: string): boolean {
    return name.startsWith('$')
  }

  getQuestValue(name: string): number {
    const result = this.questValues.get(name)
    return result == null ? 0 : result
  }

  getZoneValue(zoneNo: number, name: string): number {
    const zoneValues = this.zoneValues.get(zoneNo)
    if (zoneValues == null) {
      return 0
    }
    const result = zoneValues.get(name)
    return result == null ? 0 : result
  }

  getRoomValue(roomNo: number, name: string): number {
    const roomValues = this.roomValues.get(roomNo)
    if (roomValues == null) {
      return 0
    }
    const result = roomValues.get(name)
    return result == null ? 0 : result
  }

  setQuestValue(name: string, value: number) {
    this.questValues.set(name, value)
  }

  setZoneValue(zoneNo: number, name: string, value: number) {
    let zoneValues = this.zoneValues.get(zoneNo)
    if (zoneValues == null) {
      this.zoneValues.set(zoneNo, zoneValues = new Map())
    }
    zoneValues.set(name, value)
  }

  setRoomValue(roomNo: number, name: string, value: number) {
    let roomValues = this.roomValues.get(roomNo)
    if (roomValues == null) {
      this.roomValues.set(roomNo, roomValues = new Map())
    }
    roomValues.set(name, value)
  }

  getForRoom(roomNo: number): GameProgress {
    return {
      get: (name) => {
        if (GameProgressTotal.isQuestVariable(name)) {
          return this.getQuestValue(name)
        } else if (GameProgressTotal.isZoneVariable(name)) {
          return this.getZoneValue(getZoneNoFromRoomNo(roomNo), name)
        } else if (GameProgressTotal.isRoomVariable(name)) {
          return this.getRoomValue(roomNo, name)
        }
        throw new Error(`Invalid variable name "${ name }".`)
      },
      set: (name, value) => {
        if (GameProgressTotal.isQuestVariable(name)) {
          return this.setQuestValue(name, value)
        } else if (GameProgressTotal.isZoneVariable(name)) {
          return this.setZoneValue(getZoneNoFromRoomNo(roomNo), name, value)
        } else if (GameProgressTotal.isRoomVariable(name)) {
          return this.setRoomValue(roomNo, name, value)
        }
        throw new Error(`Invalid variable name "${ name }".`)
      }
    }
  }
}

export class Game {
  ui: UI
  timer: GameTimer
  state: 'init' | 'main_menu' | 'world' | 'world_menu' | 'battle' | 'scene'
  world: World
  roomNo: number
  progress: GameProgressTotal
  battle: null | Battle

  constructor() {
    this.ui = new UI()
    this.timer = new GameTimer()
    this.state = 'init'
    this.world = new World()
    this.roomNo = this.world.getStartingRoomNo()
    this.progress = new GameProgressTotal()
    this.battle = null
  }

  start() {
    this.enterState('main_menu')
    this.ui.reset()
    this.ui.narration.append(`Welcome to Astroborn!`)
    this.ui.actions.setActions([
      {
        text: 'New Game',
        action: () => {
          this.doNewGame()
        },
      },
      /*
      {
        text: 'Load Game',
        action: () => {
          this.doLoadGame()
        },
      },
      */
    ])
  }

  tick() {
    switch (this.state) {
      case 'world':
        this.doStateWorld()
        break
      case 'battle':
        this.doStateBattle()
        break
    }
  }

  enterState(state: 'init' | 'main_menu' | 'world' | 'world_menu' | 'battle' | 'scene') {
    // Stop and restart the timer as necessary. Doing a stop and then a start will
    // reset the timer so you don't end up entering a battle and unfairly miss a
    // round if the timer is really close to firing already.
    const toTimerState = state == 'world' || state == 'battle'
    this.timer.stop()
    if (toTimerState) {
      this.timer.start(() => this.tick())
    }
    this.state = state
  }

  getCurrentRoom(): Room {
    return this.world.getRoom(this.progress.getForRoom(this.roomNo), this.roomNo)
  }

  updateWorldButtons() {
    const room = this.getCurrentRoom()
    const exits = room.things.filter((thing) => thing.exit != null)
      .map((thing) => {
        if (thing.exit == null) {
          throw new Error(`Assertion error, thing.exit is null: thing=${ thing }.`) 
        }
        const exit = thing.exit
        return {
          text: thing.name,
          action: () => {
            this.doWorldTakeExit(exit)
          },
        }
      })
    this.ui.targets.setTargets(exits)
    this.ui.actions.setActions([
      {
        text: 'Look',
        action: () => this.doWorldLook(),
      },
      {
        text: 'Look At...',
        action: () => this.doWorldOpenLookAtMenu(),
      },
    ])
  }

  runScene(scene: Scene) {
    if (scene.narrations.length == 0) {
      return
    }
    this.ui.narration.append(scene.narrations[0])
    if (scene.narrations.length > 1) {
      const prevState = this.state
      this.enterState('scene')
      const targets = this.ui.targets.save()
      const actions = this.ui.actions.save()
      const blank = { text: '', action: () => {} }
      let i = 1
      this.ui.targets.reset()
      this.ui.actions.setActions([
        blank, blank, blank,
        blank,
        {
          text: 'Next',
          action: () => {
            this.ui.narration.append(scene.narrations[i])
            ++i
            if (i >= scene.narrations.length) {
              this.ui.targets.restore(targets)
              this.ui.actions.restore(actions)
              this.enterState(prevState)
            }
          },
        },
      ])
    }
  }

  doNewGame() {
    this.ui.actions.reset()
    this.ui.targets.reset()
    this.ui.narration.reset()
    this.enterState('world')
    this.updateWorldButtons()
    this.runScene(this.world.getOpeningScene())
  }

  /*
  doLoadGame() {
  }
  */

  doWorldLook() {
    const room = this.getCurrentRoom()
    this.ui.narration.append(room.description)
  }

  doWorldTakeExit(exit: RoomExit) {
    this.ui.narration.append(exit.goNarration)
    if (exit.roomNo != null) {
      this.roomNo = exit.roomNo
      this.updateWorldButtons()
    }
  }

  doWorldOpenLookAtMenu() {
    const room = this.getCurrentRoom()
    const prevState = this.state
    this.enterState('world_menu')
    const targets = this.ui.targets.save()
    const actions = this.ui.actions.save()
    const close = () => {
      this.ui.targets.restore(targets)
      this.ui.actions.restore(actions)
      this.enterState(prevState)
    }
    const items = room.things.map((thing) => {
      return {
        text: thing.name,
        action: () => {
          this.ui.narration.append(thing.lookAt)
          close()
        },
      }
    })
    this.ui.targets.reset()
    this.ui.actions.setList(items, close)
  }

  doStateWorld() {
    const room = this.getCurrentRoom()
    if (room.tick != null) {
      if (room.tick()) {
        this.updateWorldButtons()
      }
    }
  }

  doStateBattle() {
  }
}
