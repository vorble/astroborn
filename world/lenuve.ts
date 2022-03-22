import { BattleTemplate, BattleMobInput } from '../battle.js'
import { GameProgress, GameAction } from '../game.js'
import { Item } from '../item.js'
import { playerStatsInput } from '../player.js'
import { rollRange, rollRatio } from '../roll.js'
import { Room, RoomThing} from '../room.js'
import { Scene } from '../scene.js'
import { World } from '../world.js'

const itemWindBandana: Item = {
  name: `Wind Bandana`,
  description: `It's a soft linen bandana, yellowed over the years. The Cup's crest of the wind is sewn upon it.`,
  kind: 'head',
  playerStatsMod: {
    add: playerStatsInput({
      off: 1,
      dmgele: 1,
      resele: 1,
    }),
  }
}

function windy(progress: GameProgress): null | GameAction {
  let count = progress.get('ambiance') // ephemeral variable
  let max = progress.get('ambiance_max')
  if (max == 0) {
    progress.set('ambiance_max', max = rollRange(75, 250))
  }
  progress.set('ambiance', count = count + 1)
  if (count >= max) {
    progress.set('ambiance', 0)
    progress.set('ambiance_max', rollRange(75, 250))
    return { narration: `The wind blows gently around you.` }
  }
  return null
}

function mobBushTail(): BattleMobInput {
  return {
    name: `Bush Tail`,
    exp: 10,
    base: {
      hp: 25,
      mp: 0,
      pp: 0,
      off: 10,
      def: 10,
      psy: 0,
      dmgphy: 3,
      dmgele: 0,
      dmgmys: 0,
      dmgpsy: 0,
      resphy: 6,
      resele: 0,
      resmys: 0,
      respsy: 0,
    },
  }
}

function mobBoreMite(): BattleMobInput {
  return {
    name: `Bore Mite`,
    exp: 50,
    base: {
      hp: 50,
      mp: 0,
      pp: 0,
      off: 10,
      def: 6,
      psy: 6,
      dmgphy: 2,
      dmgele: 0,
      dmgmys: 0,
      dmgpsy: 0,
      resphy: 0,
      resele: 0,
      resmys: 0,
      respsy: 0,
    },
    decide: (mob, battle, oldActionDone) => {
      if (!oldActionDone) {
        return null
      }
      const r = rollRatio()
      if (r < 0.05) {
        return { position: 'guard' }
      } else if (r < 0.10) {
        return { initialNarration: `${ mob.name } lets out a series of clicks.` }
      } else if (r < 0.20) {
        const which = rollRatio() <= 0.5 ? 'right' : 'left'
        const left = which == 'left' ? 200 : 'miss'
        const right = which == 'right' ? 200 : 'miss'
        return {
          initialNarration: `${ mob.name } raises its ${ which } claw...`,
          attackCountdown: 15,
          position: 'fight',
          nextAttack: {
            powerIn: {
              fight: 100,
              guard: 'noact',
              left: 'noact',
              right: 'noact',
              back: 'noact',
              duck: 'noact',
            },
            powerAgainst: {
              fight: 150,
              guard: 100,
              left: left,
              right: right,
              back: 150,
              duck: 150,
            },
            specialNarrationDo: `${ mob.name } slams down its ${ which } claw!`,
          },
        }
      }
      return null
    }
  }
}

function makeSampleBattle(): BattleTemplate {
  return {
    mobs: [
      mobBoreMite(),
      mobBoreMite(),
    ],
  }
}

function makePickupItem(item: Item, variable: string, progress: GameProgress): Array<RoomThing> {
  if (progress.get(variable)) {
    return []
  }
  return [{
    name: itemWindBandana.name,
    lookAt: itemWindBandana.description,
    take: () => {
      progress.set(variable, 1)
      return {
        receiveItems: [item],
      }
    },
  }]
}

function roomOops(): Room {
  const room = {
    description: `You are in a vast, dark emptiness. In front of you is a white light.`,
    things: [
      {
        name: `Light`,
        lookAt: `It's a mesmerizing, pure white light.`,
        exit: {
          goNarration: `You go to the light and pass through it with a blinding flash.`,
          roomNo: 1000,
        },
      },
    ],
  }

  return room
}

function roomInRowHouse(progress: GameProgress): Room {
  const room = {
    description: `You are in dimly lit, permanent room built from rough-hewn, dark planks that let
      in only tendrils of light and moist air from the outdoors. A bed, some racks, and drawers
      line the walls. A thatch door is on the narrow wall. On the other narrow wall, a thin window
      lets in a ray of sunlight, illuminating the dust in the dank smelling air.`,
    things: [
      {
        name: `Thatch Door`,
        lookAt: `It's woven from mature thera grass blades with hinges on one side that allow
          door to open into the room.`,
        exit: {
          goNarration: `You go through the door and down the hallway to enter the outdoors.`,
          roomNo: 1001,
        },
      },
      {
        name: `Bed`,
        lookAt: progress.get('$bed_made')
          ? `It's purposefully tidy.`
          : `It's not quite neat with the linens pushed to one side as if the last occupant
            did not get much rest.`,
        use: () => {
          if (progress.get('$bed_made')) {
            return {
              narration: `The bed is already tidy.`,
            }
          } else {
            progress.set('$bed_made', 1)
            progress.set('$bandana_out', 1)
            return {
              narration: `You pull the linens evenly over the mattress. A bandana was in the mess.`
            }
          }
        },
      },
      {
        name: `Common Wall`,
        lookAt: `The long wall is shared with the adjoining room.`,
        use: () => {
          return {
            narration: `Getting close to the wall to listen, you can hear a calm, muffled voice and the indistinct patter of activity.`,
          }
        }
      },
      {
        name: `Rack`,
        lookAt: `Affixed to the wall, small shelves and pegs offer a place to put clothes.`,
      },
      {
        name: `Drawer`,
        lookAt: `It's a worn and marked set of wooden drawers that has been used by many over the years.`,
      },
      {
        name: `Slit`,
        lookAt: `A delicate beam of light illuminates a thin blade of dust in the air, laying as a skewed line across the floor and straight up the adjacent wall.`,
        use: () => {
          return {
            narration: `You peer through the slit into the outdoors. You see the back meadow and the top of the latrine some ways in the distance.`,
          }
        },
      },
      ...(
        progress.get('$bed_made') ? makePickupItem(itemWindBandana, '$bandana_got', progress) : []
      ),
      {
        name: `DEBUG`,
        lookAt: `It's a DEBUG protruding into this universe. You might be able to get a closer look.`,
        use: () => {
          return {
            narration: `You look into the DEBUG. Something is inside!`,
            battle: makeSampleBattle(),
          }
        },
      },
    ],
  }

  return room
}

function roomRowHouseLawn(progress: GameProgress): Room {
  const room = {
    description: `You are on a worn, sandy walkway stretching through the grassy plot, connecting
    a larger footpath and a series of faded wooden houses constructed in a row. The grass is short
    and worn from use. A meadow surrounds the lawn and reaches around to the rear of the houses.
    A small, but traveled opening is on the tree line in the distance, past the meadow.`,
    things: [
      {
        name: `House Door`,
        lookAt: `It's a sturdy wooden door with hinges.`,
        exit: {
          goNarration: `You go through the door and go down the hallway to one of the rooms.`,
          roomNo: 1000,
        },
      },
      {
        name: `Meadow`,
        lookAt: `Worn grass gives way to a meadow leading toward the forest.`,
        exit: {
          goNarration: `You go across the lawn and start to push your way through the tall grass.`,
          roomNo: 1002,
        },
      },
      {
        name: `Rear`,
        lookAt: `A path leads around the houses along the precipice of the longer grass just a short ways out.`,
        exit: {
          goNarration: `You go around to the back of the houses.`,
          roomNo: 1003,
        },
      },
      {
        name: `Row Houses`,
        lookAt: `It's a series of row houses built from dark wooden planks, but are greyed and faded from years in the sun.`,
      },
      {
        name: `Greg and Maun`,
        lookAt: `Greg and Maun, young men, are riled up on the lawn, talking and joking with smiles on their faces.`,
        isHereDescription: `Greg and Maun are raucously joking in the lawn.`,
        talk: [
          {
            topic: `Funny?`,
            action: () => {
              return {
                scene: new Scene([
                  `You ask about what's so funny. Greg replies with a smile,
                    "Maun was telling me the gopher he saw cutting wood yesterday."`,
                  `Maun interjects, "Looking at me like this:" He tilts his head and
                    exposes his front teeth, raising his left eyebrow.`,
                  `Greg and Maun continue their playful banter and make other animalistic
                    motions toward each other.`
                ])
              }
            },
          },
        ],
      },
    ],
  }

  return room
}

function roomMeadow(progress: GameProgress): Room {
  const room = {
    description: `You are in a meadow of tall grass and wildflowers situated between the houses on the outskirts of town and a forest.
      The pathway is obvious, but not so worn down as to trample the grass completely.`,
    things: [
      {
        name: `Houses`,
        lookAt: `The pathway leads toward the lawn and some houses not far off.`,
        exit: {
          goNarration: `You push through the tall grass toward the houses and reach the lawn.`,
          roomNo: 1001,
        },
      },
      {
        name: `Forest`,
        lookAt: `The pathway continues toward the forest.`,
        exit: {
          goNarration: `You push through the tall grass toward the forest.`,
          roomNo: 1004,
        },
      },
      {
        name: `Grass`,
        lookAt: `The grass moves gently with a hiss as the waves of wind draw over it.`,
      },
    ],
    tick: () => windy(progress),
    battle: () => {
      if (rollRatio() <= 0.20) {
        return {
          battle: {
           mobs: [mobBushTail()],
          }
        }
      }
    },
  }

  return room
}

function roomBackYard(progress: GameProgress): Room {
  const room = {
    description: `You are behind the row of houses on a walkway leading to a latrine. Gentle undulations of
    wind bring a light odorous scent to your nose.`,
    things: [
      {
        name: `Front`,
        lookAt: `The walkway leads around to the front of the houses.`,
        exit: {
          goNarration: `You go along the walkway to the front of the houses.`,
          roomNo: 1001,
        },
      },
      {
        name: `Latrine`,
        lookAt: `A small, enclosed structure hosts an area for relieving oneself in private a short distance away.`,
      },
      {
        name: `Windows`,
        lookAt: `Each house in the row has a small window.`,
        use: () => {
          const intro = `You come up to the back of the houses and pull yourself up to peer into the window.`
          if (!progress.get('$voyeur')) {
            progress.set('$voyeur', 1)
            return {
              scene: new Scene([
                intro,
                `Ria is in the room mending a cloth sack. She doesn't seem to notice you as your shadow does
                  not stretch into the window.`,
                `Climbing down with a thud, Ria's voice reaches out with startled hesitation "H-Hey!"`,
              ])
            }
          } else {
            return {
              scene: new Scene([
                intro,
                `The room is empty.`,
                `You climb down.`,
              ])
            }
          }
        },
      },
    ],
  }

  return room
}

function roomOutsideTheForest(progress: GameProgress): Room {
  const room = {
    description: `You are surrounded by long, hissing grass and gently swaying flowers upon a lightly trodden path.
      In one direction lies more grass and in the other lies a forest whose tree tops are visible over the surrounding foliage.`,
    things: [
      {
        name: `Grass`,
        lookAt: `Tall grass is lightly trodden to guide you along a pathway.`,
        exit: {
          goNarration: `You push forward through the grass.`,
          roomNo: 1002,
        },
      },
      {
        name: `Forest`,
        lookAt: `Tall grass is lightly trodden to guide you along a pathway toward the forest.`,
        exit: {
          goNarration: `You push forward through the grass and shrubbery as you make your way toward the forest.`,
          roomNo: 1005,
        },
      },
    ],
    tick: () => windy(progress),
    battle: () => {
      if (rollRatio() <= 0.20) {
        return {
          battle: {
           mobs: [mobBushTail()],
          }
        }
      }
    },
  }

  return room
}

function roomForestOutskirts(progress: GameProgress): Room {
  const room = {
    description: `You are in the well-traveled space between thick shrubbery amidst the tall trees that define the forest's south-western face.`,
    things: [
      {
        name: `Meadow`,
        lookAt: `Shrubbery gives way to a meadow of tall grass through the well-traveled exit from the forest.`,
        exit: {
          goNarration: `You go along the path and begin to push through taller and taller grass.`,
          roomNo: 1004,
        },
      },
    ],
  }

  return room
}

export function init(world: World) {
  world.registerZone(1, (progress, roomNo) => {
    switch (roomNo) {
      case 1000: return roomInRowHouse(progress)
      case 1001: return roomRowHouseLawn(progress)
      case 1002: return roomMeadow(progress)
      case 1003: return roomBackYard(progress)
      case 1004: return roomOutsideTheForest(progress)
      case 1005: return roomForestOutskirts(progress)
    }
    return roomOops()
  });
}
