import { Scene } from './scene.js'
import { UI } from './ui.js'
import { World } from './world.js'

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

class GameState {

}

class GameStateWorld extends GameState {

}

export class Game {
  ui: UI
  timer: GameTimer
  state: 'init' | 'main_menu' | 'world' | 'battle' | 'scene'
  world: World
  roomNo: number

  constructor() {
    this.ui = new UI()
    this.timer = new GameTimer()
    this.state = 'init'
    this.world = new World()
    this.roomNo = this.world.getStartingRoomNo()
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

  enterState(state: 'init' | 'main_menu' | 'world' | 'battle' | 'scene') {
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

  doNewGame() {
    this.ui.actions.reset()
    this.ui.targets.reset()
    this.ui.narration.reset()
    this.enterState('world')
    this.setupWorldButtons()
    this.runScene(this.world.getOpeningScene())
  }

  setupWorldButtons() {
    const room = this.world.getRoom(this.roomNo)
    this.ui.targets.setTargets([
      { text: 'Here', action: () => {} },
      { text: 'There', action: () => {} },
    ])
    this.ui.actions.setActions([
      {
        text: 'Look',
        action: () => {
          // TODO: Should there be a game level function for narrating things? for brevity? for other reasons?
          this.ui.narration.append(room.description)
        },
      },
    ])
  }

  /*
  doLoadGame() {
  }
  */

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

  doStateWorld() {
  }

  doStateBattle() {
  }
}
