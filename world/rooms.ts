import { langmap } from '../lang.js'
import { Room } from '../room.js'

export const ROOM_NO_START = 1_000

const rooms: Array<Room> = []

rooms.push({
  roomNo: 1_000,
  name: langmap({
    enus: 'Red Room',
  }),
  description: langmap({
    enus: 'You are in a square, red room.',
  }),
  exits: [
    {
      name: langmap({
        enus: 'Northern Doorway',
      }),
      description: langmap({
        enus: 'You see blue beyond the doorway to the north.',
      }),
      roomNo: 1_001,
    },
  ],
})

rooms.push({
  roomNo: 1_001,
  name: langmap({
    enus: 'Blue Room',
  }),
  description: langmap({
    enus: 'You are standing in a square, blue room.',
  }),
  exits: [
    {
      name: langmap({
        enus: 'Southern Doorway',
      }),
      description: langmap({
        enus: 'You see red beyond the doorway to the south.',
      }),
      roomNo: 1_000,
    },
  ],
})

export default rooms
