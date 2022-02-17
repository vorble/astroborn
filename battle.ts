import { LangMap, langmap } from './lang.js'
import { Game } from './game.js'

interface BattleStats {
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

// The player is in the fight stance when they are trading blows with enemies.
// They may assume one of several other stances to evade special attacks of various sorts.
// Assuming a non-fight stance prevents the player from trading damage.
type BattlePlayerStance = 'fight' | 'block' | 'down' | 'side' | 'back' | 'reverse'

interface BattlePlayer extends BattleStats {
  stance: BattlePlayerStance
  stanceTicksRemaining: number
  stancePostAction?: BattleSpecialAttack
}

type BattleFoeStance = 'fight' | 'block' | 'charge'

interface BattleFoe extends BattleStats {
  stance: BattleFoeStance
}

interface BattleScript {
  makeFoes: () => Array<BattleFoe>,
}

interface BattleSpecialAttack {
  narration: LangMap<string>,
}

export class Battle {
  game: Game
  player: BattlePlayer
  foes: Array<BattleFoe>
  target: number
  tickNo: number
  script: BattleScript
  
  constructor(game: Game, player: BattlePlayer, script: BattleScript) {
    this.game = game
    this.player = { ...player }
    this.foes = script.makeFoes()
    this.target = 0
    this.tickNo = 0
    this.script = script
  }

  // One second or so.
  tick() {
    ++this.tickNo
    while (this.tickNo >= 5) {
      this.tickNo -= 5
      this.tock()
    }
  }

  // Five seconds or so. Damage is exchanged.
  tock() {
  }

  playerGoStance(stance: BattlePlayerStance) {

  }
}
