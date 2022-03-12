import { PlayerStatsMod } from './player.js'

export interface Item {
  kind: 'item' | 'weapon' | 'helmet' | 'hands' | 'body' | 'feet'
  playerStatsMod?: PlayerStatsMod,
}
