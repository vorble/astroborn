import { Item } from './item.js'
import { Status } from './status.js'

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

// These things set the player apart from enemies.
export interface Player extends PlayerLike {
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
    equipment: [],
  }
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
