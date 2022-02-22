import { UI } from './ui.js'

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

export class Game {
  ui: UI
  timer: GameTimer

  constructor() {
    this.ui = new UI()
    this.timer = new GameTimer()
  }

  start() {
    this.timer.start(() => this.tick())
  }

  tick() {
    console.log('Tick.');
  }

  stop() {
    this.timer.stop()
  }
}
