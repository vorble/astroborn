import { makePickupItem, Item, langmap, Room } from '../index.js'
import { Scene } from '../../scene.js'

function stateItems() {
  return {
    windBandana: false,
  }
}

export function state() {
  return {
    items: stateItems(),
    bed_made: false,
    voyeur: false,
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
}
items.push(itemWindBandana)

// TODO: Can I add some items to this room to give the player a sense of who the character is?
// What is their role in The Cup?
rooms.push({
  roomNo: 2_000,
  name: langmap({
    enus: `Row Room`,
  }),
  description: langmap({
    enus: `You are in dimly lit, permanent room built from rough-hewn, dark planks that let in only
    tendrils of light and moist air from the outdoors. A bed, some racks, and drawers line the walls.
    A thatch door is on the narrow wall. On the other narrow wall, a thin window lets in a ray of
    sunlight, illuminating the dust in the dank smelling air.`,
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
    {
      name: langmap({
        enus: `Common Wall`,
      }),
      description: langmap({
        enus: `The long wall is shared with the adjoining room.`,
      }),
      use: {
        text: langmap({
          enus: `Common Wall`,
        }),
        action: langmap({
          enus: `Getting close to the wall to listen, you can hear a calm, muffled voice and the indistinct patter of activity.`,
        }),
      },
    },
    {
      name: langmap({
        enus: `Rack`,
      }),
      description: langmap({
        enus: `Affixed to the wall, small shelves and pegs offer a place to put clothes.`,
      }),
    },
    {
      name: langmap({
        enus: `Drawer`,
      }),
      description: langmap({
        enus: `It's a worn and marked set of wooden drawers that has been used by many over the years.`,
      }),
    },
    {
      name: langmap({
        enus: `Slit`,
      }),
      description: langmap({
        enus: `A delicate beam of light illuminates a thin blade of dust in the air, laying as a skewed line across the floor and straight up the adjacent wall.`,
      }),
      use: {
        text: langmap({
          enus: 'Slit',
        }),
        action: langmap({
          enus: `You peer through the slit into the outdoors. You see the back meadow and the top of the latrine some ways in the distance.`,
        }),
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
    enus: `Lawn`,
  }),
  description: langmap({
    enus: `You are on a worn, sandy walkway stretching through the grassy plot, connecting a larger
    road and a series of faded wooden houses constructed in a row. The grass is short and
    worn from use. A meadow surrounds the lawn and reaches around to the rear of the houses.
    A small, but traveled opening is on the tree line in the distance, past the meadow.`,
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
        enus: `Road`,
      }),
      description: langmap({
        enus: `It's a road through the countryside, between the town center and a series of row houses.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You go down the road toward the countryside.`,
        }),
        toRoomNo: 2_004,
      },
    },
    {
      name: langmap({
        enus: `Meadow`,
      }),
      description: langmap({
        enus: `Worn grass gives way to a meadow leading toward the forest.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You go across the lawn and start to push your way through the tall grass.`,
        }),
        toRoomNo: 2_002,
      },
    },
    {
      name: langmap({
        enus: `Rear`,
      }),
      description: langmap({
        enus: `A path leads around the houses along the precipice of the longer grass just a short ways out.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You go around to the back of the houses.`,
        }),
        toRoomNo: 2_003,
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
    {
      name: langmap({
        enus: `Greg and Maun`,
      }),
      isHereText: langmap({
        enus: `Greg and Maun are raucously joking in the lawn.`,
      }),
      description: langmap({
        enus: `Greg and Maun, young men, are riled up on the lawn, talking and joking with smiles on their faces.`,
      }),
      talk: {
        text: langmap({
          enus: `Greg and Maun`,
        }),
        action: [
          {
            text: langmap({
              enus: `Funny?`,
            }),
            action: (state) => langmap({
              enus: new Scene([
                `You ask about what's so funny. Greg replies with a smile,
                  "Maun was telling me the gopher he saw cutting wood yesterday."`,
                `Maun interjects, "Looking at me like this:" He tilts his head and
                  exposes his front teeth, raising his left eyebrow.`,
                `Greg and Maun continue their playful banter and make other animalistic
                  motions toward each other.`
              ]),
            }),
          },
        ],
      },
    },
  ],
})

rooms.push({
  roomNo: 2_002,
  name: langmap({
    enus: `Meadow`,
  }),
  description: langmap({
    enus: `You are in a meadow of tall grass and wildflowers situated between the houses on the outskirts of town and a forest.
    The pathway is obvious, but not so worn down as to trample the grass completely.`,
  }),
  things: [
    {
      name: langmap({
        enus: `Houses`,
      }),
      description: langmap({
        enus: `The pathway leads toward the lawn and some houses not far off.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You push through the tall grass toward the houses and reach the lawn.`,
        }),
        toRoomNo: 2_001,
      },
    },
    {
      name: langmap({
        enus: `Grass`,
      }),
      description: langmap({
        enus: `The grass moves gently with a hiss as the waves of wind draw over it.`,
      }),
    },
  ],
})

rooms.push({
  roomNo: 2_003,
  name: langmap({
    enus: `Back Yard`,
  }),
  description: langmap({
    enus: `You are behind the row of houses on a walkway leading to a latrine. Gentle undulations of
    wind bring a light odorous scent to your nose.`,
  }),
  things: [
    {
      name: langmap({
        enus: `Front`,
      }),
      description: langmap({
        enus: `The walkway leads around to the front of the houses.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You go along the walkway to the front of the houses.`,
        }),
        toRoomNo: 2_001,
      },
    },
    {
      name: langmap({
        enus: `Latrine`,
      }),
      description: langmap({
        enus: `A small, enclosed structure hosts an area for relieving oneself in private a short distance away.`,
      }),
    },
    {
      name: langmap({
        enus: `Houses`,
      }),
      description: langmap({
        enus: `Each house in the row has a small window.`,
      }),
      use: {
        text: langmap({
          enus: `Window`,
        }),
        action: (state) => {
          const intro = `You come up to the back of the houses and pull yourself up to peer into the window.`
          const result = !state.lenuve.voyeur ? langmap({
            enus: new Scene([
              intro,
              `Ria is in the room mending a cloth sack. She doesn't seem to notice you as your shadow does
                not stretch into the window.`,
              `Climbing down with a thud, Ria's voice reaches out with startled hesitation "H-Hey!"`,
            ]),
          }) : langmap({
            enus: new Scene([
              intro,
              `The room is empty.`,
              `You climb down.`,
            ]),
          })
          state.lenuve.voyeur = true
          return result
        },
      },
    },
  ],
})

// TODO: Needs a recheck for completeness.
rooms.push({
  roomNo: 2_004,
  name: langmap({
    enus: `Road`,
  }),
  description: langmap({
    enus: `You are on a road leading through the countryside with a wide view of the surrounding land.
      To the north lies a forest beyond a thick meadow of flowers and tall grass. Animal runs flow and
      twist around in it. To the west there is a series of row houses. To the south east is a town
      with a smattering of mostly small buildings. Directly south, past the buildings, and surrounded
      by constructed stone archways, lies The Populace, an open area with various lines made of stone crossing the
      ground in ceremonial patterns.`,
  }),
  things: [
    {
      name: langmap({
        enus: `Houses`,
      }),
      description: langmap({
        enus: `The road tapers as it approaches a series of houses.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You go along the road toward the houses.`,
        }),
        toRoomNo: 2_001,
      },
    },
    {
      name: langmap({
        enus: `Forest`,
      }),
      description: langmap({
        enus: `A forest stands in the distance across a meadow. Leaves top the trees and prevent you from
          observing any details within.`,
      }),
    },
    {
      name: langmap({
        enus: `Town`,
      }),
      description: langmap({
        enus: `Many small buildings line walkways and open areas in the town center. A few larger
          structures are interspersed among them.`,
      }),
    },
    {
      name: langmap({
        enus: `The Populace`,
      }),
      description: langmap({
        enus: `Stone lines in the shape of the wind, waterfall, root, and fire crests are distinctly
          visible, surrounded by three stone archways.`,
      }),
    },
  ],
})
