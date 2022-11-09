import { GameProgress } from './game.js'
import { Room, RoomGenerator } from './room.js'
import { Scene } from './scene.js'

import * as lenuve from './world/lenuve.js'

export function getZoneNoFromRoomNo(roomNo: number): number {
  return Math.floor(roomNo / 1000)
}

export class World {
  zones: Map<number, RoomGenerator>

  constructor() {
    this.zones = new Map()
    lenuve.init(this)
  }

  registerZone(zoneNo: number, roomGenerator: RoomGenerator) {
    this.zones.set(zoneNo, roomGenerator);
  }

  getOpeningScene() {
    return new Scene([
      `It is already light as you open your heavy eye lids for the first time today.`,

      `You push yourself out of the bed you fought against the night before,
      where the thoughts of the day prior and the uncertainty of what today and the next
      will bring occupied your mind.`,
    ])
  }

  getStartingRoomNo(): number {
    return 1000
  }

  getRoom(progress: GameProgress, roomNo: number): Room {
    const zoneNo = getZoneNoFromRoomNo(roomNo)
    const roomGenerator = this.zones.get(zoneNo)
    if (roomGenerator == null) {
      throw new Error(`Room generator for zone ${ zoneNo } for room ${ roomNo } not found.`)
    }
    return roomGenerator(progress, roomNo)
  }
}
