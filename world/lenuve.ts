import { World } from '../world.js'

export function init(world: World) {
    const room = {
      roomNo: 1000,
      description: `You are in dimly lit, permanent room built from rough-hewn, dark planks that let in only
        tendrils of light and moist air from the outdoors. A bed, some racks, and drawers line the walls.
        A thatch door is on the narrow wall. On the other narrow wall, a thin window lets in a ray of
        sunlight, illuminating the dust in the dank smelling air.`
    }
    world.rooms.set(room.roomNo, room)
}
