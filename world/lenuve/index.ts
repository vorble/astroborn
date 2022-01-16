import { makePickupItem, Item, langmap, Room } from '../index.js'

function stateItems() {
  return {
    windBandana: false,
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

const itemWindBandana = {
  itemNo: 2_000,
  name: langmap({
    enus: `Wind Bandana`,
  }),
  description: langmap({
    enus: `It's a soft linen bandana, yellowed over the years. The Cup's crest of the wind is sewn upon it.`,
  }),
  equipmentStats: {
    defense: 1,
  },
};
items.push(itemWindBandana)

rooms.push({
  roomNo: 2_000,
  name: langmap({
    enus: `Row Room`,
  }),
  // TODO: Make it so you can play around with some of the features of the room, like maybe
  // you can hear through the wall or peek under something.
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
            enus: `You pull the linens evenly over the mattress. A bandana was in the mess.`,
          })
          state.lenuve.bed_made = true
          return result
        },
      },
    },
    ...(
      state.lenuve.bed_made ? makePickupItem(itemWindBandana, state.lenuve.items, 'windBandana') : []
    ),
  ],
})

rooms.push({
  roomNo: 2_001,
  name: langmap({
    enus: `Row Lawn`,
  }),
  description: langmap({
    enus: `There is a worn, sandy walkway through the grassy plot, running between a larger causeway and a series of row houses.
    The grass is short and worn from foot traffic. Greg and Maun are raucously joking in the lawn.
    A small, traveled opening is on the tree line.`,
  }),
  things: [
    {
      name: langmap({
        enus: `House Door`,
      }),
      description: langmap({
        enus: `It's a sturdy wooden door with hinges.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You go through the door and go down the hallway to one of the rooms.`,
        }),
        toRoomNo: 2_000,
      },
    },
    {
      name: langmap({
        enus: `Row Houses`,
      }),
      description: langmap({
        enus: `It's a series of row houses built from dark wooden planks, but are greyed and faded from years in the sun.`,
      }),
    },
    // TODO: Exit to common area.
    // TODO: Exit into woods.
    // TODO: Greg and Maun talking.
    // TODO: Looking at things around. Grass?
  ],
})
