import { Battle, BattleTemplate } from './battle.js'
import { Player, playerMakeDefault, playerResourcesInput, playerCalculate } from './player.js'
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

// Quest variables are prefixed with @ and are accessible through the entire game and should
// be used to guide the overarching story.
// Zone variables are prefixed with % and are accessible from any room in that zone. These
// should be used to give life to the zone or to control aspects only relevant to the zone.
// Room variables are prefixed with $ and are accessible only from one room. These should be
// used for persistent room states that should persist when the player returns.
// Ephemeral variables have no prefix and are accessible only from one room for the time that
// the player is in the room. These are cleared as the player travels between rooms. These
// should be used for non-persistent state in the room (ambiance).
class GameProgressTotal {
  questValues: Map<string, number>
  zoneValues: Map<number, Map<string, number>>
  roomValues: Map<number, Map<string, number>>
  ephemeralValues: Map<string, number>

  constructor() {
    this.questValues = new Map()
    this.zoneValues = new Map()
    this.roomValues = new Map()
    this.ephemeralValues = new Map()
  }

  clearEphemeral() {
    this.ephemeralValues.clear()
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

  static isEphemeralVariable(name: string): boolean {
    return /^[a-zA-Z0-9_]/.test(name)
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

  getEphemeral(name: string): number {
    const result = this.ephemeralValues.get(name)
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

  setEphemeral(name: string, value: number) {
    this.ephemeralValues.set(name, value)
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
        } else if (GameProgressTotal.isEphemeralVariable(name)) {
          return this.getEphemeral(name)
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
        } else if (GameProgressTotal.isEphemeralVariable(name)) {
          return this.setEphemeral(name, value)
        }
        throw new Error(`Invalid variable name "${ name }".`)
      }
    }
  }
}

export interface GameAction {
  // Should a narration be displayed?
  narration?: string,
  // Should the targets bar and action grid be updated?
  updated?: boolean,
  battle?: BattleTemplate,
}

export class Game {
  ui: UI
  timer: GameTimer
  state: 'init' | 'main_menu' | 'world' | 'world_menu' | 'battle' | 'scene' | 'game_over'
  world: World
  roomNo: number
  progress: GameProgressTotal
  battle: null | Battle
  player: Player

  DEBUG_BATTLE: boolean

  constructor() {
    this.ui = new UI()
    this.timer = new GameTimer()
    this.state = 'init'
    this.world = new World()
    this.roomNo = this.world.getStartingRoomNo()
    this.progress = new GameProgressTotal()
    this.battle = null
    this.player = playerMakeDefault()

    this.DEBUG_BATTLE = false
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

  enterState(state: 'init' | 'main_menu' | 'world' | 'world_menu' | 'battle' | 'scene' | 'game_over') {
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

  enterBattle(battle: BattleTemplate) {
    this.battle = new Battle(this, battle)
    this.enterState('battle')
    this.updateBattleButtons()
    // this.battle will take it from here
  }

  endBattle(result: 'win' | 'lose') {
    if (this.battle != null) {
      this.ui.targets.restore(this.battle.postState.targets)
      this.ui.actions.restore(this.battle.postState.actions)
      this.enterState(this.battle.postState.state)
      Object.assign(this.player.resources, playerResourcesInput(this.battle.player.resources))
      if (result == 'win') {
        // TODO: Gain exp, do levels up.
        this.ui.narration.append(`You gain ${ this.battle.expTally } experience!`)
        playerCalculate(this.player)
        if (this.battle.winAction) {
          this.doGameAction(this.battle.winAction())
        }
        this.player.resources.hp = Math.max(1, this.player.resources.hp) // TODO: Hackish, need to keep 1 hp to keep alive.
      } else if (result == 'lose') {
        if (this.battle.loseAction) {
          this.doGameAction(this.battle.loseAction())
        } else {
          this.doGameOver()
        }
      }
      this.battle = null
    }
  }

  getCurrentRoom(): Room {
    return this.world.getRoom(this.progress.getForRoom(this.roomNo), this.roomNo)
  }

  updateResources() {
    this.ui.hp.set(this.player.resources.hp, this.player.hp)
    this.ui.mp.set(this.player.resources.mp, this.player.mp)
    this.ui.pp.set(this.player.resources.pp, this.player.pp)
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
      {
        text: 'Use...',
        action: () => this.doWorldOpenUseMenu(),
      },
    ])
  }

  updateBattleButtons() {
    if (this.battle == null) {
      throw new Error(`Assertion error, battle is null!`)
    }
    this.battle.updateBattleButtons()
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
    this.player = playerMakeDefault()
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
      this.progress.clearEphemeral()
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
          close()
          this.ui.narration.append(thing.lookAt)
        },
      }
    })
    this.ui.targets.reset()
    this.ui.actions.setList(items, close)
  }

  doWorldOpenUseMenu() {
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
    const items = room.things.filter((thing) => thing.use != null).map((thing) => {
      if (thing.use == null) {
        throw new Error(`Assertion error, ineffective filter.`)
      }
      const use = thing.use
      return {
        text: thing.name,
        action: () => {
          close()
          this.doGameAction(use())
        },
      }
    })
    this.ui.targets.reset()
    this.ui.actions.setList(items, close)
  }

  doGameAction(action: GameAction) {
    if (action.updated != null && action.updated) {
      this.updateWorldButtons()
    }
    if (action.narration != null) {
      this.ui.narration.append(action.narration)
    }
    if (action.battle != null) {
      this.enterBattle(action.battle)
    }
  }

  doGameOver() {
    this.enterState('game_over')
    const blank = { text: '', action: () => {} }
    this.ui.narration.append(`Game over.`)
    this.ui.targets.reset()
    this.ui.actions.setActions([
      blank, blank, blank,
      blank,
      {
        text: 'Continue',
        action: () => {
          this.start()
        },
      },
    ])
  }

  doStateWorld() {
    const room = this.getCurrentRoom()
    if (room.tick != null) {
      const action = room.tick()
      if (action != null) {
        this.doGameAction(action)
      }
    }
  }

  doStateBattle() {
    if (this.battle == null) {
      throw new Error(`Assertion error, battle is null!`)
    }
    this.battle.tick()
  }
}
