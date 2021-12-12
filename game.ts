import mobs from './world/mobs'
import rooms from './world/rooms'

export interface GameState {
}

export type FromGameState<T> = T | ((state: GameState) => T)

export class Game {
  constructor() {
  }
}

new Game()
