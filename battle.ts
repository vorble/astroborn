import { Game, GameAction } from './game.js'
import { rollRatio } from './roll.js'
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

// Powers are 0 for ineffective, 100 for full power, 200 for double power, etc.
// fight power is e.g. the power of the attack against the player in the fight position.
interface BattleMobAttack {
  power: number,
  damage: 'physical' | 'elemental' | 'mystical' | 'psychic',

  // pa, mnemonic "power against". Determines how effective the attack is against someone
  // in the given position. Scales the attack. 0 for not effective, 100 for regular power,
  // 200 for double power.
  paFight: number,
  paGuard: number,
  paLeft: number,
  paRight: number,
  paBack: number,
  paDuck: number,
}

function makeBasicMobAttack(): BattleMobAttack {
  return {
    power: 100,
    damage: 'physical',
    paFight: 100,
    paGuard: 75,
    paLeft: 85,
    paRight: 85,
    paBack: 60,
    paDuck: 100,
  }
}

interface BattleAttackRound {
  attacker: {
    stats: BattleStats,
    position: 'fight' | 'guard' | 'left' | 'right' | 'back' | 'duck',
    attack: BattleMobAttack,
  },
  defender: {
    stats: BattleStats,
    position: 'fight' | 'guard' | 'left' | 'right' | 'back' | 'duck',
  },
}

function lookupPA(round: BattleAttackRound): number {
  if (round.defender.position == 'fight') {
    return round.attacker.attack.paFight
  } else if (round.defender.position == 'guard') {
    return round.attacker.attack.paGuard
  } else if (round.defender.position == 'left') {
    return round.attacker.attack.paLeft
  } else if (round.defender.position == 'right') {
    return round.attacker.attack.paRight
  } else if (round.defender.position == 'back') {
    return round.attacker.attack.paBack
  } else if (round.defender.position == 'duck') {
    return round.attacker.attack.paDuck
  }
  throw new Error(`Assertion error, ${ round.defender.position } unhandled.`)
}

function determineMitigation(round: BattleAttackRound): number {
  if (round.attacker.attack.damage == 'physical') {
    return Math.round(round.defender.stats.defense / 10.0)
  } else if (round.attacker.attack.damage == 'elemental') {
    return Math.round(round.defender.stats.defense / 2.5 + round.defender.stats.resist / 7.5)
  } else if (round.attacker.attack.damage == 'mystical') {
    return Math.round(round.defender.stats.psyche / 1.5 + round.defender.stats.mystic / 8.5)
  } else if (round.attacker.attack.damage == 'psychic') {
    return Math.round(round.defender.stats.psyche / 6.5 + round.defender.stats.defense / 3.5)
  }
  throw new Error(`Assertion error, ${ round.attacker.attack.damage } unhandled.`)
}

function calculateBaseDamage(round: BattleAttackRound): number {
  const variance = (1.0 + rollRatio(.2))
  if (round.attacker.attack.damage == 'physical') {
    return Math.round(round.attacker.attack.power * round.attacker.stats.attack / 10.0 * variance)
  } else if (round.attacker.attack.damage == 'elemental') {
    return Math.round(round.attacker.attack.power * round.attacker.stats.attack / 10.0 * variance)
  } else if (round.attacker.attack.damage == 'mystical') {
    return Math.round(round.attacker.attack.power * round.attacker.stats.mystic / 10.0 * variance)
  } else if (round.attacker.attack.damage == 'psychic') {
    return Math.round(round.attacker.attack.power * round.attacker.stats.psyche / 10.0 * variance)
  }
  throw new Error(`Assertion error, ${ round.attacker.attack.damage } unhandled.`)
}

function calculateDamage(round: BattleAttackRound): number {
  // Algorithm:
  //  attack damage type and power determine the base damage to do. This is varied some based on luck and 100%-120% of atk power.
  //  the defender's position mitigates (or makes worse) the damage based on the attack "pa" values.
  //  depending on the type of damage, the defender's stats can further mitigate the damage done.
  const baseDamage = calculateBaseDamage(round)
  const pa = lookupPA(round)
  const preMitigateDamage = (pa / 100.0) * baseDamage
  const mitigation = determineMitigation(round)
  return Math.max(0, preMitigateDamage - mitigation)
}

interface BattleMob {
  name: string,
  stats: BattleStats,
  max: BattleStats,
  position: 'fight' | 'guard',
  attackCountdown: number,
  nextAttack: null | BattleMobAttack,
}

export interface BattleTemplate {
  mobs: Array<BattleMobTemplate>,
  winAction?: () => GameAction,
  loseAction?: () => GameAction,
}

interface BattlePostState {
  // TODO: this is duplicated but I've had trouble with type aliases to string lists in the past...
  state: 'init' | 'main_menu' | 'world' | 'world_menu' | 'battle' | 'scene',
  targets: UITargetBarState,
  actions: UIActionGridState,
}

export class Battle {
  game: Game
  postState: BattlePostState
  mobs: Array<BattleMob>
  position: 'fight' | 'guard' | 'left' | 'right' | 'back' | 'duck'
  target: BattleMob
  attackCountdown: number

  constructor(game: Game, battle: BattleTemplate) {
    this.game = game
    this.postState = {
      state: game.state,
      targets: game.ui.targets.save(),
      actions: game.ui.actions.save(),
    }
    if (battle.mobs.length == 0) {
      throw new Error(`Cannot create battle with no mobs!`)
    }
    this.mobs = battle.mobs.map((mob) => {
      const result: BattleMob = {
        max: { ...mob.stats },
        ...mob,
        position: 'fight',
        attackCountdown: 10,
        nextAttack: null,
      }
      return result
    })
    this.position = 'fight'
    this.target = this.mobs[0]
    this.attackCountdown = 10
  }

  tick() {
    const living = []
    for (let i = 0; i < this.mobs.length; ++i) {
      const mob = this.mobs[i]

      mob.attackCountdown -= 1
      if (mob.attackCountdown <= 0) {
        this.doMobAttack(mob)
        mob.attackCountdown = 10
      }
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

  doMobAttack(mob: BattleMob) {
    const damage = calculateDamage({
      attacker: {
        attack: mob.nextAttack == null ? makeBasicMobAttack() : mob.nextAttack,
        position: mob.position,
        stats: mob.stats,
      },
      defender: {
        position: this.position,
        stats: mob.stats, // TODO: Use the player stats.
      },
    })
    this.game.ui.narration.append(`${ mob.name } attacks and delivers ${ damage } damage!`)
  }

  end() {
    this.game.endBattle()
  }

  updateBattleButtons() {
    const mobs = this.mobs.map((mob) => {
      return {
        text: (this.target == mob ? '*' : '') + mob.name,
        action: () => {
        },
      }
    })
    this.game.ui.targets.setTargets(mobs)
    const blank = { text: ``, action: () => {} }
    this.game.ui.actions.setActions([
      blank, blank, blank,
      {
        text: (this.position == 'left' ? '*' : '') + `Left`,
        action: () => {
          this.doGoPosition('left')
        },
      },
      {
        text: (this.position == 'fight' ? '*' : '') + `Fight`,
        action: () => {
          this.doGoPosition('fight')
        },
      },
      {
        text: (this.position == 'right' ? '*' : '') + `Right`,
        action: () => {
          this.doGoPosition('right')
        },
      },
      {
        text: (this.position == 'back' ? '*' : '') + `Back`,
        action: () => {
          this.doGoPosition('back')
        },
      },
      {
        text: (this.position == 'guard' ? '*' : '') + `Guard`,
        action: () => {
          this.doGoPosition('guard')
        },
      },
      {
        text: (this.position == 'duck' ? '*' : '') + `Duck`,
        action: () => {
          this.doGoPosition('duck')
        },
      },
    ])
  }

  doGoPosition(position: 'fight' | 'guard' | 'left' | 'right' | 'back' | 'duck') {
    if (position != this.position) {
      this.position = position
      switch (position) {
        case 'fight':
          this.game.ui.narration.append(`You assume a fighting position.`)
          break
        case 'guard':
          this.game.ui.narration.append(`You assume a guarding position.`)
          break
        case 'left':
          this.game.ui.narration.append(`You move to the left.`)
          break
        case 'right':
          this.game.ui.narration.append(`You move to the right.`)
          break
        case 'back':
          this.game.ui.narration.append(`You move back.`)
          break
        case 'duck':
          this.game.ui.narration.append(`You get low to the ground.`)
          break
      }
      this.updateBattleButtons()
    }
  }
}


