import { GameState } from '../game.js'
import { langmap } from '../lang.js'
import { Room, RoomConvoTopic } from '../room.js'

export const ROOM_NO_START = 1_000

const rooms: Array<Room> = []

rooms.push({
  roomNo: 1_000,
  name: langmap({
    enus: `Red Room`,
  }),
  description: langmap({
    enus: `You are in a square, red room. There is a rusted switch on the wall. A doorway is to the north.`,
  }),
  exits: (state) => {
    if (state.switchDown) {
      return [
        {
          roomExitNo: 0,
          name: langmap({
            enus: `Northern Doorway`,
          }),
          description: langmap({
            enus: `You see blue beyond the doorway to the north.`,
          }),
          takeDescription: langmap({
            enus: `You go through the doorway to the north.`,
          }),
          roomNo: 1_001,
        },
      ]
    } else {
      return [
        {
          roomExitNo: 1,
          name: langmap({
            enus: `Northern Doorway`,
          }),
          description: langmap({
            enus: `You see green beyond the doorway to the north.`,
          }),
          takeDescription: langmap({
            enus: `You go through the doorway to the north.`,
          }),
          roomNo: 1_002,
        },
      ]
    }
  },
  objects: (state) => [
    {
      roomObjectNo: 0,
      name: langmap({
        enus: `Rusted Switch`,
      }),
      description: langmap({
        enus: `It is a toggle switch, middlway up the wall, which has begun to rust heavily with red and brown oxides. The switch is in the ${ state.switchDown ? 'down' : 'up' } position.`,
      }),
      useDescription: langmap({
        enus: `The switch lets out a solemn click as you toggle it.`,
      }),
      use: (state) => {
        state.switchDown = !state.switchDown
      },
    },
  ],
  convos: (state) => {
    function speak(state: GameState) {
      state.spoken += 1
    }

    const topics: Array<RoomConvoTopic> = []

    if (state.spoken == 0) {
      topics.push({
        roomConvoTopicNo: 0,
        name: langmap({
          enus: 'Hello?',
        }),
        narration: langmap({
          enus: 'You speak, possibly expecting a response, into the void, "Hello?"',
        }),
        use: speak,
      })
    } else if (state.spoken == 1) {
      topics.push({
        roomConvoTopicNo: 1,
        name: langmap({
          enus: 'Hello??',
        }),
        narration: langmap({
          enus: 'You hesitate momentarily, but speak "Hello?"',
        }),
        use: speak,
      })
    } else {
      topics.push({
        roomConvoTopicNo: state.spoken,
        name: langmap({
          enus: 'Helllo?',
        }),
        narration: langmap({
          enus: 'You speak to the void "Hello?"',
        }),
        use: speak,
      })
    }

    return [
      {
        roomConvoNo: 0,
        name: langmap({
          enus: 'Absence',
        }),
        description: langmap({
          enus: 'There is nothing there, but you are unable to pry your attention away from it.',
        }),
        topics: topics,
      },
    ]
  },
})

rooms.push({
  roomNo: 1_001,
  name: langmap({
    enus: `Blue Room`,
  }),
  description: langmap({
    enus: `You are standing in a square, blue room. A doorway is to the south.`,
  }),
  exits: [
    {
      roomExitNo: 0,
      name: langmap({
        enus: `Southern Doorway`,
      }),
      description: langmap({
        enus: `You see red beyond the doorway to the south.`,
      }),
      takeDescription: langmap({
        enus: `You go through the doorway to the south.`,
      }),
      roomNo: 1_000,
    },
  ],
  objects: [
  ],
  convos: [
  ],
})

rooms.push({
  roomNo: 1_002,
  name: langmap({
    enus: `Green Room`,
  }),
  description: langmap({
    enus: `You are standing in a square, green room. A doorway is to the south.`,
  }),
  exits: [
    {
      roomExitNo: 0,
      name: langmap({
        enus: `Southern Doorway`,
      }),
      description: langmap({
        enus: `You see red beyond the doorway to the south.`,
      }),
      takeDescription: langmap({
        enus: `You go through the doorway to the south.`,
      }),
      roomNo: 1_000,
    },
  ],
  objects: [
  ],
  convos: [
  ],
})

export default rooms
