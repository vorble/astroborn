import { Game, GameAction } from './game.js'
import { PlayerLike, PlayerLikeInput, playerLikeInput, Player, PlayerStats } from './player.js'
import { rollUniform, rollRatio, rollRange } from './roll.js'
import { UITargetBarState, UIActionGridState } from './ui.js'

function calculateBattleDamagePhysical(a: PlayerStats, d: PlayerStats): number {
  const oompf = rollUniform(1.0, 1.5)
  let dmgphy = a.dmgphy
  if (d.resphy < 0) {
    dmgphy -= d.resphy // Increases dmgphy by the negative amount of resphy
  }
  let dmg = Math.round(a.off * oompf + dmgphy)
  dmg = Math.max(0, dmg - Math.round(d.def / 3))
  dmg = Math.max(0, dmg - Math.round(Math.max(0, d.def - a.off) / 2))
  if (d.resphy > 0) {
    dmg = Math.max(0, dmg - d.resphy)
  }
  return dmg
}

function calculateBattleDamageElemental(a: PlayerStats, d: PlayerStats): number {
  const oompf = rollUniform(0.9, 1.1)
  let dmgele = a.dmgele
  if (d.resele < 0) {
    dmgele -= d.resele // Increases dmgele by the negative amount of resele
  }
  let dmg = Math.round((1 + a.off / 15.0) * oompf * dmgele)
  dmg = Math.max(0, dmg - Math.round(d.def / 3))
  if (d.resele > 0) {
    dmg = Math.max(0, dmg - d.resele)
  }
  return dmg
}

function calculateBattleDamageMystic(a: PlayerStats, d: PlayerStats): number {
  const oompf = rollUniform(0.5, 1.5) * (rollRatio() >= .333 ? 2 : 1)
  let dmgmys = a.dmgmys
  if (d.resmys < 0) {
    dmgmys -= d.resmys // Increases dmgmys by the negative amount of resmys
  }
  let dmg = Math.round(dmgmys * oompf)
  dmg = Math.max(0, dmg - Math.round(d.def / 6))
  if (d.resmys > 0) {
    dmg = Math.max(0, dmg - d.resmys)
  }
  return dmg
}

function calculateBattleDamagePsychic(a: PlayerStats, d: PlayerStats): number {
  const oompf = rollUniform(1.0, 1.25)
  const psybase = a.psy / 15
  // Disparity in psy produces bonus damage.
  const psyboost = Math.max(a.psy - d.psy, 0) / 4
  let dmgpsy = a.dmgpsy  
  if (d.respsy < 0) {
    dmgpsy -= d.respsy // Increases dmgpsy by the negative amount of respsy
  }
  let dmg = Math.round((1 + psybase + psyboost) * oompf * dmgpsy)
  dmg = Math.max(0, dmg - Math.round(d.def / 4 + d.psy / 4))
  if (d.respsy > 0) {
    dmg = Math.max(0, dmg - d.respsy)
  }
  return dmg
}

export interface BattleDamageBase {
  phy: number,
  ele: number,
  mys: number,
  psy: number,
  total: number,
}

export interface BattleDamage {
  base: BattleDamageBase,
  pa: number,
  pi: number,
  effective: number,
  special: null | 'bad_position',
}

export interface BattleMob extends PlayerLike {
  name: string,
  position: 'fight' | 'guard' | 'left' | 'right' | 'back' | 'duck',
  attackCountdown: number,
  nextAttack: null | BattleMobAttack,
}

export interface BattleMobInput extends PlayerLikeInput {
  name: string,
}

function battleMobInput(mob: BattleMobInput): BattleMob {
  return {
    name: mob.name,
    position: 'fight',
    attackCountdown: rollRange(8, 10),
    nextAttack: null,
    ...playerLikeInput(mob),
  }
}

// Powers are 0 for ineffective, 100 for full power, 200 for double power, etc.
// fight power is e.g. the power of the attack against the player in the fight position.
interface BattleMobAttack {
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
    stats: PlayerStats,
    position: 'fight' | 'guard' | 'left' | 'right' | 'back' | 'duck',
    attack: BattleMobAttack,
  },
  defender: {
    stats: PlayerStats,
    position: 'fight' | 'guard' | 'left' | 'right' | 'back' | 'duck',
  },
}

function calculateBattleDamageBase(a: PlayerStats, d: PlayerStats): BattleDamageBase {
  const phy = calculateBattleDamagePhysical(a, d)
  const ele = calculateBattleDamageElemental(a, d)
  const mys = calculateBattleDamageMystic(a, d)
  const psy = calculateBattleDamagePsychic(a, d)
  return { phy, ele, mys, psy, total: phy + ele + mys + psy }
}

// TODO: Need to make space for attack power when in each kind of position.
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

function lookupPI(round: BattleAttackRound): number {
  if (round.attacker.position == 'fight') {
    return 100
  } else if (round.attacker.position == 'guard') {
    return 0
  } else if (round.attacker.position == 'left') {
    return 75
  } else if (round.attacker.position == 'right') {
    return 75
  } else if (round.attacker.position == 'back') {
    return 75
  } else if (round.attacker.position == 'duck') {
    return 75
  }
  throw new Error(`Assertion error, ${ round.attacker.position } unhandled.`)
}

function calculateBattleDamage(round: BattleAttackRound): BattleDamage {
  const base = calculateBattleDamageBase(round.attacker.stats, round.defender.stats)
  const pi = lookupPI(round)
  const damage = Math.round((pi / 100.0) * base.total)
  let special: null | 'bad_position' = null
  if (round.attacker.position == 'guard') {
    special = 'bad_position'
  }
  const pa = lookupPA(round)
  const effective = Math.round((pa / 100.0) * damage)
  return { base, pa, pi, effective, special }
}

export interface BattleTemplate {
  mobs: Array<BattleMobInput>,
  winAction?: () => GameAction,
  loseAction?: () => GameAction,
}

interface BattlePostState {
  // TODO: this is duplicated but I've had trouble with type aliases to string lists in the past...
  state: 'init' | 'main_menu' | 'world' | 'world_menu' | 'battle' | 'scene' | 'game_over',
  targets: UITargetBarState,
  actions: UIActionGridState,
}

export class Battle {
  game: Game
  postState: BattlePostState
  player: BattleMob
  mobs: Array<BattleMob>
  target: BattleMob
  winAction?: () => GameAction
  loseAction?: () => GameAction

  constructor(game: Game, battle: BattleTemplate) {
    this.game = game
    this.postState = {
      state: game.state,
      targets: game.ui.targets.save(),
      actions: game.ui.actions.save(),
    }
    this.player = battleMobInput({ name: 'YOU', ...game.player })
    if (battle.mobs.length == 0) {
      throw new Error(`Cannot create battle with no mobs!`)
    }
    this.mobs = battle.mobs.map((mob) => battleMobInput(mob))
    this.target = this.mobs[0]
    this.winAction = battle.winAction
    this.loseAction = battle.loseAction
  }

  tick() {
    this.player.attackCountdown -= 1
    if (this.player.attackCountdown <= 0) {
      this.doPlayerAttack(this.target)
      this.player.attackCountdown = 10
    }
    const living = []
    for (let i = 0; i < this.mobs.length; ++i) {
      const mob = this.mobs[i]
      // Because of the player attack, the mob might be dead already.
      if (mob.resources.hp > 0) {
        mob.attackCountdown -= 1
        if (mob.attackCountdown <= 0) {
          this.doMobAttack(mob)
          mob.attackCountdown = 10
        }
      }
      if (mob.resources.hp > 0) {
        living.push(mob)
      } else {
        this.game.ui.narration.append(`${ mob.name } dies!`)
      }
    }
    // TODO: end determination and UI update paths could use some work.
    let end = false
    this.mobs = living
    if (this.player.resources.hp <= 0) {
      end = true
      this.game.ui.narration.append(`The world around goes dark as you lose consciousness.`)
    } 
    if (living.length == 0) {
      end = true
    } else {
      if (this.mobs.indexOf(this.target) < 0) {
        this.target = this.mobs[0]
      }
      this.game.ui.hp.set(this.player.resources.hp, this.player.hp)
      this.game.ui.mp.set(this.player.resources.mp, this.player.mp)
      this.game.ui.pp.set(this.player.resources.pp, this.player.pp)
      this.updateBattleButtons()
    }
    if (end) {
      this.end()
    } 
  }

  doPlayerAttack(mob: BattleMob) {
    const damage = calculateBattleDamage({
      attacker: {
        attack: makeBasicMobAttack(),
        position: this.player.position,
        stats: this.player,
      },
      defender: {
        position: mob.position,
        stats: mob,
      },
    })
    if (damage.special == null) {
      mob.resources.hp = Math.max(0, mob.resources.hp - damage.effective)
    }
    if (this.game.DEBUG_BATTLE) {
      // TODO: Need a good debugging output for damage. This sucks.
      if (damage.special == 'bad_position') {
        this.game.ui.narration.append(`You are unable to attack ${ mob.name } in your current position! `
         + `(${ JSON.stringify(damage).replace(/:/g, ': ') })!`)
      } else {
        this.game.ui.narration.append(`You attack ${ mob.name } and deliver ${ damage.effective } damage! `
         + `(${ JSON.stringify(damage).replace(/:/g, ': ') })!`)
      }
    } else {
      if (damage.special == 'bad_position') {
        this.game.ui.narration.append(`You are unable to attack ${ mob.name } in your current position!`)
      } else {
        this.game.ui.narration.append(`You attack ${ mob.name } and deliver ${ damage.effective } damage!`)
      }
    }
  }

  doMobAttack(mob: BattleMob) {
    const damage = calculateBattleDamage({
      attacker: {
        attack: mob.nextAttack == null ? makeBasicMobAttack() : mob.nextAttack,
        position: mob.position,
        stats: mob,
      },
      defender: {
        position: this.player.position,
        stats: this.player,
      },
    })
    this.player.resources.hp = Math.max(0, this.player.resources.hp - damage.effective)
    if (this.game.DEBUG_BATTLE) {
      // TODO: Need a good debugging output for damage. This sucks.
      this.game.ui.narration.append(`${ mob.name } attacks and delivers ${ damage.effective } damage `
       + `(${ JSON.stringify(damage).replace(/:/g, ': ') })!`)
    } else {
      this.game.ui.narration.append(`${ mob.name } attacks and delivers ${ damage.effective } damage!`)
    }
  }

  end() {
    const result = this.player.resources.hp <= 0 ? 'lose' : 'win'
    this.game.endBattle(result)
  }

  updateBattleButtons() {
    const mobs = this.mobs.map((mob) => {
      return {
        text: (this.target == mob ? '*' : '') + mob.name,
        action: () => {
          this.target = mob,
          this.updateBattleButtons()
        },
      }
    })
    this.game.ui.targets.setTargets(mobs)
    const blank = { text: ``, action: () => {} }
    this.game.ui.actions.setActions([
      blank, blank, blank,
      {
        text: (this.player.position == 'left' ? '*' : '') + `Left`,
        action: () => {
          this.doGoPosition('left')
        },
      },
      {
        text: (this.player.position == 'fight' ? '*' : '') + `Fight`,
        action: () => {
          this.doGoPosition('fight')
        },
      },
      {
        text: (this.player.position == 'right' ? '*' : '') + `Right`,
        action: () => {
          this.doGoPosition('right')
        },
      },
      {
        text: (this.player.position == 'back' ? '*' : '') + `Back`,
        action: () => {
          this.doGoPosition('back')
        },
      },
      {
        text: (this.player.position == 'guard' ? '*' : '') + `Guard`,
        action: () => {
          this.doGoPosition('guard')
        },
      },
      {
        text: (this.player.position == 'duck' ? '*' : '') + `Duck`,
        action: () => {
          this.doGoPosition('duck')
        },
      },
    ])
  }

  doGoPosition(position: 'fight' | 'guard' | 'left' | 'right' | 'back' | 'duck') {
    if (position != this.player.position) {
      this.player.position = position
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


