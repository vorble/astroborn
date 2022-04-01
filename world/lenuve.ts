import { BattleTemplate, BattleMobInput } from '../battle.js'
import { GameProgress, GameAction } from '../game.js'
import { Item } from '../item.js'
import { playerStatsInput } from '../player.js'
import { rollRange, rollRatio } from '../roll.js'
import { Room, RoomThing } from '../room.js'
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

function tickAmbiance(narration: string, progress: GameProgress): null | GameAction {
  let count = progress.get('ambiance') // ephemeral variable
  let max = progress.get('ambiance_max')
  if (max == 0) {
    progress.set('ambiance_max', max = rollRange(75, 250))
  }
  progress.set('ambiance', count = count + 1)
  if (count >= max) {
    progress.set('ambiance', 0)
    progress.set('ambiance_max', rollRange(75, 250))
    return { narration }
  }
  return null
}

function windy(progress: GameProgress) {
  return tickAmbiance(`The wind blows gently around you.`, progress)
}

// The beak has interlocking teeth.
function mobGaolBeak(): BattleMobInput {
  return {
    name: `Gaol Beak`,
    exp: 10,
    base: {
      hp: 23,
      mp: 0,
      pp: 0,
      off: 11,
      def: 7,
      psy: 2,
      dmgphy: 2,
      dmgele: 0,
      dmgmys: 0,
      dmgpsy: 0,
      resphy: 3,
      resele: 0,
      resmys: 0,
      respsy: 0,
    },
    decide: (mob, battle, oldActionDone) => {
      if (!oldActionDone) {
        return null
      }
      const r = rollRatio()
      if (r < 0.10) {
        return {
          attackCountdown: 12,
          initialNarration: `${ mob.name } puffs its chest and spreads its wings.`,
        }
      } else if (r < 0.20) {
        return {
          attackCountdown: 6,
          initialNarration: `${ mob.name } buzzes by your head.`,
        }
      }
      return null
    }
  }
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

function battleMeadow(): void | GameAction {
  if (rollRatio() <= 0.02) {
    return {
      battle: {
        mobs: [mobBushTail(), mobBushTail()],
      }
    }
  } else if (rollRatio() <= 0.20) {
    return {
      battle: {
        mobs: [mobBushTail()],
      }
    }
  }
}

function battleHillRoad(): void | GameAction {
  if (rollRatio() <= 0.005) {
    return {
      battle: {
        mobs: [mobGaolBeak(), mobGaolBeak(), mobBushTail()],
      }
    }
  } else if (rollRatio() <= 0.02) {
    return {
      battle: {
        mobs: [mobGaolBeak(), mobGaolBeak()],
      }
    }
  } else if (rollRatio() <= 0.20) {
    return {
      battle: {
        mobs: [mobGaolBeak()],
      }
    }
  }
}

function battleForest(): void | GameAction {
  // TODO
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
  const room: Room = {
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
  const room: Room = {
    description: `You are in dimly lit, permanent room built from rough-hewn, dark planks that let
      in only tendrils of light and moist air from the outdoors. A bed, some racks, and drawers
      line the walls. A thatch door is on the narrow wall. On the other narrow wall, a thin window
      lets in a ray of sunlight, illuminating the dust in the dank smelling air.`,
    healing: true,
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
      // TODO: Remove this debug battle.
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
  const room: Room = {
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
          roomNo: 1003,
        },
      },
      {
        name: `Rear`,
        lookAt: `A path leads around the houses along the precipice of the longer grass just a short ways out.`,
        exit: {
          goNarration: `You go around to the back of the houses.`,
          roomNo: 1002,
        },
      },
      {
        name: `Hill Road`,
        lookAt: `The walkway leads away from the houses and yard, raising toward a pair of hills.`,
        exit: {
          goNarration: `You walk down the gently rising roadway.`,
          roomNo: 1031,
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

function roomBackYard(progress: GameProgress): Room {
  const room: Room = {
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

function roomMeadow(progress: GameProgress): Room {
  const room: Room = {
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
          roomNo: 1010,
        },
      },
      {
        name: `Grass`,
        lookAt: `The grass moves gently with a hiss as the waves of wind draw over it.`,
      },
      {
        name: `Flowers`,
        lookAt: `Hearty violet and crimson flowers sprout tall through the grass.`,
      },
    ],
    tick: () => windy(progress),
    battle: battleMeadow,
  }

  return room
}

function roomOutsideTheForest(progress: GameProgress): Room {
  const room: Room = {
    description: `You are surrounded by long, hissing grass and gently swaying flowers upon a lightly trodden path.
      In one direction lies more grass and in the other lies a forest whose tree tops are visible over the surrounding foliage.`,
    things: [
      {
        name: `Grass`,
        lookAt: `Tall grass is lightly trodden to guide you along a pathway.`,
        exit: {
          goNarration: `You push forward through the grass.`,
          roomNo: 1003,
        },
      },
      {
        name: `Flowers`,
        lookAt: `Bulbous yellow flowers peer over tall grass.`,
      },
      {
        name: `Forest`,
        lookAt: `Tall grass is lightly trodden to guide you along a pathway toward the forest.`,
        exit: {
          goNarration: `You push forward through the grass and shrubbery as you make your way toward the forest.`,
          roomNo: 1011,
        },
      },
    ],
    tick: () => windy(progress),
    battle: battleMeadow,
  }

  return room
}

function roomForestOutskirts(progress: GameProgress): Room {
  const room: Room = {
    description: `You are in the well-traveled space between thick shrubbery amidst the tall trees, draped in vinery, that define the forest's south-western face.`,
    things: [
      {
        name: `Meadow`,
        lookAt: `Shrubbery gives way to a meadow of tall grass through the well-traveled exit from the forest.`,
        exit: {
          goNarration: `You go along the path and begin to push through taller and taller grass.`,
          roomNo: 1010,
        },
      },
      {
        name: `Trees`,
        lookAt: `The vine covered trees are smaller here than further into the forest.`,
      },
      {
        name: `Vines`,
        lookAt: `Fibrous vines hang loosely, but firmly from the branches and sibling trunks of the trees here.`,
      },
    ],
    battle: battleForest,
  }

  return room
}

function roomHillRoad(progress: GameProgress): Room {
  const room: Room = {
    description: `You are on a dirt road cut across the tops of a pair of gentle hills by years of foot traffic.
      Wildflowers and an intimidating bramble grow beside the roadway.
      The elevation provides you with a good vantage point to observe the surrounding land.`,
    things: [
      {
        name: `Butterflies`,
        lookAt: `Butterflies use slow wing flaps to float effortlessly between the flowers which are surrounded by thorny bushes.`,
        isHereDescription: `Butterflies are busy inspecting the flowers here.`,
      },
      {
        name: `Cliffs`,
        lookAt: `You see the sheer rock face towering above everything natural and unnatural, far off, in all directions around you.`,
      },
      {
        name: `Forest`,
        lookAt: `A blanketing thicket of trees abuts against the cliffs and stands next to a grassy meadow far off.`,
      },
      {
        name: `Lake`,
        lookAt: `A still lake lies in the distance near the cliff face. A river is connected to it and which runs near town.`,
      },
      {
        name: `Houses`,
        lookAt: `There is a row of small structures down the other side of the hills next to a grassy meadow.`,
        exit: {
          roomNo: 1001,
          goNarration: `You go along the declining road.`,
        },
      },
      {
        name: `Town`,
        lookAt: `The road continues over a bridge and toward some large structures some ways down the hill. The structures lie spaced
          out on either side of a roadway that leads to a large open area. The area is decorated with stones in the shape of the
          wind, water and fire crests which are clearly visible from this distance.`,
        exit: {
          roomNo: 1032,
          goNarration: `You go along the road toward town.`,
        },
      },
      {
        name: `Fields`,
        lookAt: `Green topped plots of land lie just outside of town. Irrigation ditches guide water from a small lake into
          the furrows.`,
      },
    ],
    battle: battleHillRoad,
  }

  return room
}

const hillBridgeDescription = `It's a bridge over the river. An assortment of large gray and orange stones define the bridge's exterior
  while smaller stones and a thick mortar fill the interior and have formed a seal over the structures faces. Large
  holes let the shallow water flow freely through the lower parts collecting algae and moss.`

function roomHillRoadBridge(progress: GameProgress): Room {
  const room: Room = {
    description: `You are on one side of a stone bridge crossing the thin part of a river running through the countryside.
      The grass is long and untamed in the surrounding area, but there is a clearly traveled path next to the stonework
      leading to the water below.`,
    things: [
      {
        name: `Hill Road`,
        lookAt: `The road extend toward a pair of hills as the ground it traverses gently rises.`,
        exit: {
          roomNo: 1031,
          goNarration: `You go along the road toward the hills.`,
        },
      },
      {
        name: `Town`,
        lookAt: `Several large and quite a few small structures of various design can be see a little way off. `,
        exit: {
          roomNo: 1035,
          goNarration: `You go across the bridge and down the road toward town.`,
        },
      },
      {
        name: `Bridge`,
        lookAt: hillBridgeDescription,
      },
      {
        name: `River`,
        lookAt: `The dark water under the bridge looks still. A path leads down from the side of the bridge, closer to the water.`,
        exit: {
          roomNo: 1033,
          goNarration: `You climb down the narrow path beside the bridge to the water below.`,
        },
      },
    ],
    battle: battleHillRoad,
  }

  return room
}

function roomHillRoadBridgeUnder(progress: GameProgress): Room {
  const room: Room = {
    description: `You are near the side of a stone bridge crossing the water here. The banks are narrow and slippery from
      the persistent wetness. Impenetrable foliage shepherds you close to the water.`,
    things: [
      {
        name: `Bridge`,
        lookAt: hillBridgeDescription + ` A path leads up, away from the water.`,
        exit: {
          roomNo: 1032,
          goNarration: `You climb up the path.`,
        },
      },
      {
        name: `Water`,
        lookAt: `The water looks still, but the gentle sound it makes on the banks and rocks lets you know it's flowing.
          The water is dark from the black clay and sand mixture lining the bottom.`,
        use: () => {
          const times = progress.get('$hillbridge_stones_skipped')
          if (times >= 16) {
            return {
              narration: `You search for a flat looking stone, but don't find any.`,
            }
          } else {
            let skips = 0
            let saying = ''
            const r = rollRatio()
            if (r < 0.02) {
              skips = 0
              saying = 'The stone flies straight down into your foot. Yeow!'
            } else if (r < 0.1) {
              skips = 0
              saying = 'The stone flies straight down into the mud.'
            } else if (r < 0.25) {
              skips = 0
              saying = 'Blub. The stone sinks.'
            } else if (r < 0.35) {
              skips = 1
              saying = 'The stone skips once before sinking.'
            } else if (r < 0.75) {
              skips = 2
              saying = 'The stone skips twice before sinking.'
            } else if (r < 0.95) {
              skips = 3
              saying = 'The stone skitters three times atop the water.'
            } else if (r < 0.995) {
              skips = 4
              saying = 'The stone makes four skips across the surface before sinking near the opposite bank.'
            } else {
              skips = 5
              saying = 'The stone splashes five times along the surface until it smacks into the opposite bank with a thud.'
            }
            progress.set('$hillbridge_max_skips', Math.max(progress.get('$hillbridge_max_skips'), skips))
            progress.set('$hillbridge_stones_skipped', times + 1)
            return {
              narration: `You pick up a flat looking stone and throw it at the water. ${ saying }`,
            }
          }
        },
      },
      {
        name: `Foliage`,
        lookAt: `A tangle of vines, shrubs, and thorny plants fills any space that might be found between the stout trees
          that grow in this soft, wet soil.`,
      },
      {
        name: `Banks`,
        lookAt: `The slippery banks extend further down stream surrounded on one side by the water and on the other
          dense foliage.`,
        exit: {
          roomNo: 1034,
          goNarration: `You go along the water's edge.`,
        },
      },
    ],
    battle: battleHillRoad,
  }

  return room
}

function roomHillRoadBridgeUnderDownRiver(progress: GameProgress): Room {
  const room: Room = {
    description: `You are surrounded by a thick bramble on one side and the river on the other.
      The banks are overtaken by foliage further down stream.
      You see hints of a bridge through the greenery up stream.`,
    things: [
      {
        name: `Bridge`,
        lookAt: `You see bits of unnatural gray and orange through the morphing mesh of leaves and branches
          manipulated by the wind.`,
        exit: {
          roomNo: 1033,
          goNarration: `You go along the water's edge.`,
        },
      },
    ],
    healing: true,
    // no battles, this is a safe place.
    tick: () => tickAmbiance(`You hear the water trickle.`, progress),
  }

  return room
}

function roomBehindTheHall(progress: GameProgress): Room {
  const room: Room = {
    description: `You are on the outskirts of town behind the largest structure used as a gathering place.
      A road starts here and leads out to the countryside.`,
    things: [
      {
        name: `Hill Road`,
        lookAt: `A road leads out of town through the lush countryside. You cannot see the turns in the road around
          here, but you see it on its way across a pair of hills some way off.`,
        exit: {
          roomNo: 1032,
          goNarration: `You go along the road out of town to a bridge.`,
        },
      },
    ],
    battle: battleHillRoad,
  }

  return room
}

export function init(world: World) {
  world.registerZone(1, (progress, roomNo) => {
    switch (roomNo) {
      case 1000: return roomInRowHouse(progress)
      case 1001: return roomRowHouseLawn(progress)
      case 1002: return roomBackYard(progress)
      case 1003: return roomMeadow(progress)
      // 1003 - 1009 for the meadow.
      case 1010: return roomOutsideTheForest(progress)
      case 1011: return roomForestOutskirts(progress)
      // 1011 - 1030 for the forest.
      case 1031: return roomHillRoad(progress)
      case 1032: return roomHillRoadBridge(progress)
      case 1033: return roomHillRoadBridgeUnder(progress)
      case 1034: return roomHillRoadBridgeUnderDownRiver(progress)
      case 1035: return roomBehindTheHall(progress)
    }
    return roomOops()
  });
}
