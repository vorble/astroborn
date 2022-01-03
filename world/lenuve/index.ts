import { GameState, Item, langmap, Room } from '../index.js'

function stateItems() {
  return {
    grayCap1: false,
  }
}

export function state() {
  return {
    items: stateItems(),
    bed_made: false,
    fireflies_caught: 0,
  }
}

export const rooms: Array<Room> = []
export const items: Array<Item> = []

// Planet: Lenuve
// Land: The Cup
//
// An isolated people exist on the planet Lenuve. The small population is nestled within a large
// stone basin rising above the trees along all sides. They call the land "The Cup" and its the
// only land they have ever known.
//
// In the last two hundred years, more and more lights have started to appear in the sky. Sometimes
// as solitary points crossing between the rims or hurried streaks or things that leave cloudy
// tracks frozen above.

rooms.push({
  roomNo: 2_000,
  name: langmap({
    enus: `Row Room`,
  }),
  description: langmap({
    enus: `You are in dimly lit, permanent room built from fine, dark planks that let in only
           tendrils of light. A bed, some racks, and drawers line the walls. A thatch door is
           on the narrow wall. On the other narrow wall, a thin window lets in a ray of sunlight.`,
  }),
  things: (state) => [
    {
      name: langmap({
        enus: `Thatch Door`,
      }),
      description: langmap({
        enus: `It's woven from mature thera grass blades with hinges on one side that allow
               door to open into the room.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You go through the door and down the hallway to enter the outdoors.`,
        }),
        toRoomNo: 2_001,
      },
    },
    {
      name: langmap({
        enus: `Bed`,
      }),
      description: state.lenuve.bed_made ? langmap({
        enus: `It's purposefully tidy.`,
      }) : langmap({
        enus: `It's not quite neat with the linens pushed to one side as if the last occupant
               did not get much rest.`,
      }),
      use: {
        text: langmap({
          enus: `Bed`,
        }),
        action: (state) => {
          const result = state.lenuve.bed_made ? langmap({
            enus: `The bed is already tidy.`,
          }) : langmap({
            enus: `You pull the linens evenly over the mattress.`,
          })
          state.lenuve.bed_made = true
          return result
        },
      },
    },
  ],
})
