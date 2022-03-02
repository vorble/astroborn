import { GameProgress } from '../game.js'
import { Room } from '../room.js'
import { World } from '../world.js'

function roomInRowHouse(progress: GameProgress): Room {
  const room = {
    description: `You are in dimly lit, permanent room built from rough-hewn, dark planks that let in only
      tendrils of light and moist air from the outdoors. A bed, some racks, and drawers line the walls.
      A thatch door is on the narrow wall. On the other narrow wall, a thin window lets in a ray of
      sunlight, illuminating the dust in the dank smelling air.`,
    things: [
      {
        name: `Bed`,
        lookAt: progress.get('$bed_made')
          ? `It's purposefully tidy.`
          : `It's not quite neat with the linens pushed to one side as if the last occupant
            did not get much rest.`,
      },
    ],
  }

  return room
}

export function init(world: World) {
  world.registerZone(1, (progress, roomNo) => {
    switch (roomNo) {
      case 1000: return roomInRowHouse(progress) 
    }
    throw new Error(`Room ${ roomNo } not found.`)
  });
}
