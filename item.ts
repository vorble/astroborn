import { PlayerStatsMod } from './player.js'

export interface Item {
  name: string,
  description: string,
  kind: 'item' | 'weapon' | 'head' | 'hands' | 'body' | 'feet'
  playerStatsMod?: PlayerStatsMod,
}
