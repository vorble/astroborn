import { GameState, Room, Item, langmap, Thing, EquipmentStats } from '../index.js'
import { stateAddItem } from '../../game.js'
import { strings } from '../../strings.js'

function stateItems() {
  return {
    grayCap1: false,
  }
}

export function state() {
  return {
    items: stateItems(),
    redRoom: {
    },
  }
}

export const rooms: Array<Room> = []
export const items: Array<Item> = []

function makeThings(setupFunction: (state: GameState, things: Array<Thing>) => any) {
  return (state: GameState) => {
    const things: Array<Thing> = []
    setupFunction(state, things)
    return things
  }
}

function makePickupItem(items: ReturnType<typeof stateItems>, things: Array<Thing>, item: Item, stateItemsKey: keyof ReturnType<typeof stateItems>) {
  if (!items.grayCap1) {
    things.push({
      name: item.name,
      description: item.description,
      get: {
        text: item.name,
        action: (state: GameState) => {
          state.void.items[stateItemsKey] = true
          stateAddItem(state, item.itemNo)
          return strings.actions.youPickUpItem(item)
        },
      },
    })
  }
}

const itemGrayCap = {
  itemNo: 1_000,
  name: langmap({
    enus: `Gray Cap`,
  }),
  description: langmap({
    enus: `It is a gray, knit cap.`,
  }),
  equipmentStats: {
    defense: 1,
  },
};
items.push(itemGrayCap)

// IDK why, but I have to put the type here or else it gets confused about singletonCategory
// in equipmentStats.
const itemSimpleCrown: Item = {
  itemNo: 1_001,
  name: langmap({
    enus: `Simple Crown`,
  }),
  description: langmap({
    enus: `It's a simple metallic crown.`,
  }),
  equipmentStats: {
    singletonCategory: 'head',
    defense: 1,
  },
}
items.push(itemSimpleCrown)

rooms.push({
  roomNo: 1_000,
  name: langmap({
    enus: `Red Room`,
  }),
  description: langmap({
    enus: `You are in a square, red room. The floor is covered with a stiff, beige carpet.
          There are no windows, but there is a doorway on one wall and a rusty light switch
          on the other.`, 
  }),
  things: makeThings((state, things) => {
    things.push({
      name: langmap({
        enus: `Doorway`,
      }),
      description: langmap({
        enus: `It is an open doorway lined with white trim. You see blue beyond its threshold.`,
      }),
      exit: {
        useNarration: langmap({
          enus: `You go through the doorway.`,
        }),
        toRoomNo: 1_001,
      },
    })
    makePickupItem(state.void.items, things, itemGrayCap, 'grayCap1')
  }),
})

rooms.push({
  roomNo: 1_001,
  name: langmap({
    enus: `Blue Room`,
  }),
  description: langmap({
    enus: `You are in a square, blue room. A gentle grey carpet lines the floor. There is a doorway
          and a ivory switch on the wall to its right.`, 
  }),
  things: [{
    name: langmap({
      enus: `Doorway`,
    }),
    description: langmap({
      enus: `It is an open doorway lined with white trim. You see red beyond its threshold.`,
    }),
    exit: {
      useNarration: langmap({
        enus: `You go through the doorway.`,
      }),
      toRoomNo: 1_000,
    },
  }],
})

rooms.push({
  roomNo: 1_002,
  name: langmap({
    enus: `Green Room`,
  }),
  description: langmap({
    enus: `You are in a square, green room. Marble tiles are adorning the floor. There is a doorway.`
  }),
  things: [{
    name: langmap({
      enus: `Doorway`,
    }),
    description: langmap({
      enus: `It is an open doorway lined with white trim. You see red beyond its threshold.`,
    }),
    exit: {
      useNarration: langmap({
        enus: `You go through the doorway.`,
      }),
      toRoomNo: 1_000,
    },
  }],
})
