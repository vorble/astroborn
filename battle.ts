import { Game, GameAction } from './game.js'
import { UITargetBarState, UIActionGridState } from './ui.js'

export interface BattleStats {
  hp: number,
  mp: number,
  pp: number,
  attack: number,
  defense: number,
  resist: number,
  mystic: number,
  psyche: number,
}

export interface BattleMobTemplate {
  name: string,
  stats: BattleStats,
  max?: BattleStats,
}

interface BattleMob {
  name: string,
  stats: BattleStats,
  max: BattleStats,
}

export interface BattleTemplate {
  mobs: Array<BattleMobTemplate>,
  winAction?: () => GameAction,
  loseAction?: () => GameAction,
}

interface BattlePostState {
  state: 'init' | 'main_menu' | 'world' | 'world_menu' | 'battle' | 'scene',
  targets: UITargetBarState,
  actions: UIActionGridState,
}

export class Battle {
  game: Game
  postState: BattlePostState
  mobs: Array<BattleMob>

  constructor(game: Game, battle: BattleTemplate) {
    this.game = game
    this.postState = {
      state: game.state,
      targets: game.ui.targets.save(),
      actions: game.ui.actions.save(),
    }
    this.mobs = battle.mobs.map((mob) => {
      const result = {
        max: { ...mob.stats },
        ...mob,
      }
      return result
    })
  }

  tick() {
    const living = []
    for (let i = 0; i < this.mobs.length; ++i) {
      const mob = this.mobs[i]
      if (mob.stats.hp > 0) {
        living.push(mob)
      } else {
        this.game.ui.narration.append(`${ mob.name } dies!`)
      }
    }
    this.mobs = living
    if (living.length == 0) {
      this.end()
    }
  }

  end() {
    this.game.endBattle()
  }

  updateBattleButtons() {
    const mobs = this.mobs.map((mob) => {
      return {
        text: mob.name,
        action: () => {
        },
      }
    })
    this.game.ui.targets.setTargets(mobs)
    this.game.ui.actions.setActions([
    ])
  }
}


