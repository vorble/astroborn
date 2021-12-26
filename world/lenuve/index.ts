import { GameState, Item, langmap, Room } from '../index.js'

export function state() {
  return {
    fireflies_caught: 0,
  }
}

export const rooms: Array<Room> = []
export const items: Array<Item> = []
