import { Room } from './room.js'
import { Scene } from './scene.js'

import * as lenuve from './world/lenuve.js'

export class World {
  rooms: Map<number, Room>

  constructor() {
    this.rooms = new Map()
    lenuve.init(this)
  }

  getOpeningScene() {
    return new Scene([
      `It is already light as you open your heavy eye lids for the first time today.`,

      `You push yourself up and out of the bed you fought against the night before,
      where the thoughts of the day prior and the uncertainty of what today and the next
      will bring occupied your mind.`,
    ])
  }

  getStartingRoomNo(): number {
    return 1000
  }

  getRoom(roomNo: number): Room {
    const result = this.rooms.get(roomNo)
    if (result == null) {
      throw new Error(`Room ${ roomNo } not found.`)
    }
    return result
  }
}
