import { Item } from './item.js'
import { Status } from './status.js'

// Cumulative EXP required to reach a given level. The index in the array is the target level.
const LEVEL_TABLE: Array<PlayerLevelEntry> = [
  { exp:      0, hp:     0, mp:  0, pp:  0, off:  0, def:  0, psy:  0 },
  // Level 1
  { exp:      0, hp:   100, mp:  45, pp:  30, off: 15, def: 17, psy: 12 },
  { exp:    200, hp:   110, mp:  50, pp:  33, off: 16, def: 17, psy: 12 },
  { exp:    400, hp:   121, mp:  56, pp:  37, off: 16, def: 18, psy: 12 },
  { exp:    600, hp:   132, mp:  62, pp:  41, off: 16, def: 18, psy: 13 },
  { exp:   1000, hp:   146, mp:  69, pp:  46, off: 17, def: 18, psy: 13 },
  { exp:   1400, hp:   160, mp:  76, pp:  50, off: 17, def: 19, psy: 13 },
  { exp:   1800, hp:   175, mp:  83, pp:  55, off: 17, def: 19, psy: 14 },
  { exp:   2500, hp:   199, mp:  90, pp:  61, off: 18, def: 19, psy: 14 },
  { exp:   3500, hp:   230, mp:  99, pp:  66, off: 18, def: 20, psy: 14 },
  // Level 10
  { exp:   5000, hp:   262, mp: 108, pp:  72, off: 18, def: 20, psy: 15 },
  { exp:  10000, hp:   319, mp: 117, pp:  78, off: 19, def: 20, psy: 15 },
  { exp:  15000, hp:   371, mp: 127, pp:  85, off: 19, def: 21, psy: 15 },
  { exp:  22000, hp:   470, mp: 138, pp:  92, off: 19, def: 21, psy: 16 },
  { exp:  30000, hp:   585, mp: 149, pp:  99, off: 20, def: 21, psy: 16 },
  { exp:  40000, hp:   699, mp: 162, pp: 107, off: 20, def: 22, psy: 16 },
  { exp:  54000, hp:   810, mp: 175, pp: 115, off: 20, def: 22, psy: 17 },
  { exp:  69000, hp:   950, mp: 188, pp: 125, off: 21, def: 22, psy: 17 },
  { exp:  88000, hp:  1022, mp: 201, pp: 134, off: 21, def: 23, psy: 17 },
  { exp: 100000, hp:  1175, mp: 218, pp: 145, off: 21, def: 23, psy: 18 },
  // Level 20
  { exp: 120000, hp:  1400, mp: 237, pp: 156, off: 22, def: 24, psy: 19 },
]

LEVEL_TABLE.forEach(Object.freeze)
Object.freeze(LEVEL_TABLE)

const MAX_LEVEL = LEVEL_TABLE.length - 1

export interface PlayerResources {
  hp: number,
  mp: number,
  pp: number,
}

export interface PlayerResourcesInput {
  hp?: number,
  mp?: number,
  pp?: number,
}

export function playerResourcesInput(input: PlayerResourcesInput) {
  return {
    hp: input.hp || 0,
    mp: input.mp || 0,
    pp: input.pp || 0,
  }
}

export interface PlayerLevelEntry {
  exp: number,
  hp: number,
  mp: number,
  pp: number,
  off: number,
  def: number,
  psy: number,
}

export interface PlayerStats {
  hp: number,
  mp: number,
  pp: number,
  off: number,
  def: number,
  psy: number,
  dmgphy: number,
  dmgele: number,
  dmgmys: number,
  dmgpsy: number,
  resphy: number,
  resele: number,
  resmys: number,
  respsy: number,
}

export interface PlayerStatsInput {
  hp?: number,
  mp?: number,
  pp?: number,
  off?: number,
  def?: number,
  psy?: number,
  dmgphy?: number,
  dmgele?: number,
  dmgmys?: number,
  dmgpsy?: number,
  resphy?: number,
  resele?: number,
  resmys?: number,
  respsy?: number,
}

export function playerStatsInput(input: PlayerStatsInput) {
  return {
    hp: input.hp || 0,
    mp: input.mp || 0,
    pp: input.pp || 0,
    off: input.off || 0,
    def: input.def || 0,
    psy: input.psy || 0,
    dmgphy: input.dmgphy || 0,
    dmgele: input.dmgele || 0,
    dmgmys: input.dmgmys || 0,
    dmgpsy: input.dmgpsy || 0,
    resphy: input.resphy || 0,
    resele: input.resele || 0,
    resmys: input.resmys || 0,
    respsy: input.respsy || 0,
  }
}

export function playerStatsAdd(a: PlayerStats, b: PlayerStats): PlayerStats {
  return {
    hp: a.hp + b.hp,
    mp: a.mp + b.mp,
    pp: a.pp + b.pp,
    off: a.off + b.off,
    def: a.def + b.def,
    psy: a.psy + b.psy,
    dmgphy: a.dmgphy + b.dmgphy,
    dmgele: a.dmgele + b.dmgele,
    dmgmys: a.dmgmys + b.dmgmys,
    dmgpsy: a.dmgpsy + b.dmgpsy,
    resphy: a.resphy + b.resphy,
    resele: a.resele + b.resele,
    resmys: a.resmys + b.resmys,
    respsy: a.respsy + b.respsy,
  }
}

// Things similar to the player like enemies.
export interface PlayerLike extends PlayerStats {
  resources: PlayerResources,
  base: PlayerStats,
  status: Array<Status>,
}

export interface PlayerLikeInput {
  resources?: PlayerResources,
  base: PlayerStats,
  status?: Array<Status>,
}

export function playerLikeInput(player: PlayerLikeInput): PlayerLike {
  const base = playerStatsInput(player.base)
  const result = {
    ...base,
    resources: playerResourcesInput(player.resources || player.base),
    base,
    status: player.status ? [...player.status] : [],
  }
  playerCalculate(result)
  return result
}

// These things set the player apart from enemies.
export interface Player extends PlayerLike {
  exp: number,
  level: number,
  equipment: Array<Item>, // WARNING: This field is used to determine whether we have a Player or PlayerLike.
}

export function playerMakeDefault(): Player {
  const base = {
    hp: 100,
    mp: 45,
    pp: 30,
    off: 15,
    def: 18,
    psy: 12,
    dmgphy: 0,
    dmgele: 0,
    dmgmys: 0,
    dmgpsy: 0,
    resphy: 0,
    resele: 0,
    resmys: 0,
    respsy: 0,
  }
  return {
    ...base,
    resources: playerResourcesInput(base),
    base: base,
    status: [],
    exp: 0,
    level: 1,
    equipment: [],
  }
}

export function getPlayerLevelEntry(level: number): null | PlayerLevelEntry {
  if (level < 0 || level > MAX_LEVEL) {
    return null
  }
  return LEVEL_TABLE[level]
}

export interface PlayerStatsMod {
  addPercent?: PlayerStats
  add?: PlayerStats
}

export function playerStatsModAdd(a: PlayerStatsMod, b: PlayerStatsMod): PlayerStatsMod {
  const add = a.add && b.add ? playerStatsAdd(a.add, b.add) : a.add ? a.add : b.add ? b.add : undefined
  const addPercent = a.addPercent && b.addPercent ? playerStatsAdd(a.addPercent, b.addPercent) : a.addPercent ? a.addPercent : b.addPercent ? b.addPercent : undefined
  return { add, addPercent }
}

export function playerCalculate(player: PlayerLike | Player): void {
  let mod: null | PlayerStatsMod = null
  for (const status of player.status) {
    if (status.playerStatsMod) {
      if (mod) {
        mod = playerStatsModAdd(mod, status.playerStatsMod)
      } else {
        mod = status.playerStatsMod
      }
    }
  }
  if ('equipment' in player) {
    for (const eq of player.equipment) {
      if (eq.playerStatsMod) {
        if (mod) {
          mod = playerStatsModAdd(mod, eq.playerStatsMod)
        } else {
          mod = eq.playerStatsMod
        }
      }
    }
  }
  let newStats = playerStatsInput(player.base)
  if (mod) {
    if (mod.addPercent) {
      newStats = playerStatsAdd(newStats, {
        hp: Math.round(newStats.hp * mod.addPercent.hp / 100),
        mp: Math.round(newStats.mp * mod.addPercent.mp / 100),
        pp: Math.round(newStats.pp * mod.addPercent.pp / 100),
        off: Math.round(newStats.off * mod.addPercent.off / 100),
        def: Math.round(newStats.def * mod.addPercent.def / 100),
        psy: Math.round(newStats.psy * mod.addPercent.psy / 100),
        dmgphy: Math.round(newStats.dmgphy * mod.addPercent.dmgphy / 100),
        dmgele: Math.round(newStats.dmgele * mod.addPercent.dmgele / 100),
        dmgmys: Math.round(newStats.dmgmys * mod.addPercent.dmgmys / 100),
        dmgpsy: Math.round(newStats.dmgpsy * mod.addPercent.dmgpsy / 100),
        resphy: Math.round(newStats.resphy * mod.addPercent.resphy / 100),
        resele: Math.round(newStats.resele * mod.addPercent.resele / 100),
        resmys: Math.round(newStats.resmys * mod.addPercent.resmys / 100),
        respsy: Math.round(newStats.respsy * mod.addPercent.respsy / 100),
      })
    }
    if (mod.add) {
      newStats = playerStatsAdd(newStats, mod.add)
    }
    newStats = {
      hp: Math.max(newStats.hp, 1),
      mp: Math.max(newStats.mp, 1),
      pp: Math.max(newStats.pp, 1),
      off: Math.max(newStats.off, 1),
      def: Math.max(newStats.def, 1),
      psy: Math.max(newStats.psy, 1),
      dmgphy: Math.max(newStats.dmgphy, 0),
      dmgele: Math.max(newStats.dmgele, 0),
      dmgmys: Math.max(newStats.dmgmys, 0),
      dmgpsy: Math.max(newStats.dmgpsy, 0),
      resphy: newStats.resphy,
      resele: newStats.resele,
      resmys: newStats.resmys,
      respsy: newStats.respsy,
    }
  }
  Object.assign(player, newStats)
  const newResources: PlayerResources = {
    hp: Math.min(player.resources.hp, player.hp),
    mp: Math.min(player.resources.mp, player.mp),
    pp: Math.min(player.resources.pp, player.pp),
  }
  Object.assign(player.resources, newResources)
}
