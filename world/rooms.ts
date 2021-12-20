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
    enus: 'You are in a square, red room. There is a rusted switch on the wall. A doorway is to the north.',
  }),
  exits: [
    {
      roomExitNo: 0,
      name: langmap({
        enus: 'Northern Doorway',
      }),
      description: langmap({
        enus: 'You see blue beyond the doorway to the north.',
      }),
      takeDescription: langmap({
        enus: 'You go through the doorway to the north.',
      }),
      roomNo: 1_001,
    },
  ],
  objects: (state) => [
    {
      roomObjectNo: 0,
      name: langmap({
        enus: 'Rusted Switch',
      }),
      description: langmap({
        enus: `It is a toggle switch, middlway up the wall, which has begun to rust heavily. The switch is in the ${ state.switchDown ? 'down' : 'up' } position.`,
      }),
      useDescription: langmap({
        enus: 'The switch lets out a gentle click as you toggle it.',
      }),
      use: (state) => {
        state.switchDown = !state.switchDown
      },
    },
  ],
})

rooms.push({
  roomNo: 1_001,
  name: langmap({
    enus: 'Blue Room',
  }),
  description: langmap({
    enus: 'You are standing in a square, blue room. A doorway is to the south.',
  }),
  exits: [
    {
      roomExitNo: 0,
      name: langmap({
        enus: 'Southern Doorway',
      }),
      description: langmap({
        enus: 'You see red beyond the doorway to the south.',
      }),
      takeDescription: langmap({
        enus: 'You go through the doorway to the south.',
      }),
      roomNo: 1_000,
    },
  ],
  objects: [
  ],
})

export default rooms
