import { playerStatsInput, PlayerStatsMod } from './player.js'

export interface Status {
  playerStatsMod?: PlayerStatsMod,
}

export const statusPoison: Status = Object.freeze({
  playerStatsMod: Object.freeze({
    addPercent: Object.freeze(playerStatsInput({
      off: -15,
    })),
  }),
})
