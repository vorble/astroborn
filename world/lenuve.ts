import { BattleTemplate, BattleMobInput } from '../battle.js'
import { GameProgress, GameAction } from '../game.js'
import { Item } from '../item.js'
import { playerStatsInput } from '../player.js'
import { rollRange, rollRatio, rollChoice } from '../roll.js'
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

// minWaitFirst was added so a really low first message time can occur in the fields.
function tickAmbiance(narration: string, progress: GameProgress, minWaitFirst?: number, maxWaitFirst?: number): null | GameAction {
  let count = progress.get('ambiance') // ephemeral variable
  let max = progress.get('ambiance_max')
  if (minWaitFirst == null) {
    minWaitFirst = 75;
  }
  if (maxWaitFirst == null) {
    maxWaitFirst = 250;
  }
  if (max == 0) {
    progress.set('ambiance_max', max = rollRange(minWaitFirst, maxWaitFirst))
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

function tickAmbianceFields(progress: GameProgress) {
  const saying = rollChoice([
    `The sun bears down upon you.`,
    `A cicada buzzes.`,
    `The stillness of the air makes it difficult to breath.`,
  ]);
  return tickAmbiance(saying, progress, 5, 10)
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

function battleFields(): void | GameAction {
  // TODO: I'd like a different kind of enemy here.
  if (rollRatio() <= 0.02) {
    return {
      battle: {
        mobs: [mobGaolBeak(), mobGaolBeak(), mobBushTail()],
      }
    }
  } else if (rollRatio() <= 0.20) {
    return {
      battle: {
        mobs: [mobGaolBeak(), mobGaolBeak()],
      }
    }
  }
}

function battleForest(): void | GameAction {
  // TODO: I'd like a different kind of enemy here.
  if (rollRatio() <= 0.02) {
    return {
      battle: {
        mobs: [mobGaolBeak(), mobGaolBeak(), mobBushTail()],
      }
    }
  } else if (rollRatio() <= 0.20) {
    return {
      battle: {
        mobs: [mobGaolBeak(), mobGaolBeak()],
      }
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
          roomNo: 1005,
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
          roomNo: 1030,
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
                    "Maun was telling me about the gopher he saw cutting wood yesterday."`,
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
          roomNo: 1009,
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
          roomNo: 1005,
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
          roomNo: 1010,
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
          roomNo: 1009,
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
          roomNo: 1031,
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
          roomNo: 1030,
          goNarration: `You go along the road toward the hills.`,
        },
      },
      {
        name: `Town`,
        lookAt: `Several large and quite a few small structures and tents of various design can be see a little way off. `,
        exit: {
          roomNo: 1050,
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
          roomNo: 1032,
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
          roomNo: 1031,
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
          roomNo: 1033,
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
          roomNo: 1032,
          goNarration: `You go back along the water's edge.`,
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
    description: `You are on the outskirts of town behind the largest structure, which is used as a gathering hall.
      Past the hall, the land gives way to open fields and a rows of plants further out.
      Around the building wraps a foot path, opening the way to more of the town.
      A road begins here and leads out to the countryside.`,
    things: [
      // TODO: Exit into town
      {
        name: `Hill Road`,
        lookAt: `A road leads out of town through the lush countryside. You cannot see the turns in the road around
          here, but you see it on its way across a pair of hills some way off.`,
        exit: {
          roomNo: 1031,
          goNarration: `You go along the road out of town to a bridge.`,
        },
      },
      {
        name: `Fields`,
        lookAt: `Barely visible from here are rows of plants in the soil in a series of rectangular plots.`,
        exit: {
          roomNo: 1040,
          goNarration: `You go off the road and head away from town, toward the fields.`,
        },
      },
    ],
  }

  return room
}

function roomFieldsAreaWest(progress: GameProgress): Room {
  const room: Room = {
    description: `You are in the short grass outside of town near the western edge of the farm fields.
      Each field appears to host a different crop, some taller or greener than the others.`,
    things: [
      {
        name: `Town`,
        lookAt: `The broad details of town are painted on the horizon, greyed in a haze from the distance and the moisture in the air.`,
        exit: {
          roomNo: 1050,
          goNarration: `You go toward town.`,
        },
      },
      {
        name: `Fields`, // TODO: should this say the kind of field it is? Make it consistent with what's in the rest of the fields.
        lookAt: `There are rows of a small, green, leafy plants in the near plots. Beyond, there is a bare plot and another with taller plants.`,
        exit: {
          roomNo: 1041,
          goNarration: `You go into the fields and through several rows of plants.`,
        },
      },
    ],
    battle: battleFields,
  }

  return room
}

function roomFieldsSweetRoot(progress: GameProgress): Room {
  const room: Room = {
    description: `You are among the rows of sweet root plants, their leafy tops not quite brushing against your legs as you move about.
      The sea of green stretches far, catching the sun.
      The air is still and hot, the distant plant tops shimmering and dancing in the swelter.`,
    things: [
      // TODO: Look at the plants more closely.
      {
        name: `Fields Area`,
        lookAt: `Past the rows of vegetables, a grassy area is separated from the fields.`,
        exit: {
          roomNo: 1040,
          goNarration: `You go through the rows and out of the field.`,
        },
      },
      {
        name: `Bridge`,
        lookAt: `There is a bridge on the other side of the field, to the end of the rows.`,
        exit: {
          roomNo: 1045,
          goNarration: `You go along the row of plants.`,
        },
      },
      {
        name: `Irrigation Ditch`,
        lookAt: `Situated between this field and another is an irrigation ditch.`,
        exit: {
          roomNo: 1046,
          goNarration: `You go through the rows of plants.`,
        },
      },
    ],
    tick: () => tickAmbianceFields(progress),
    battle: battleFields,
  }

  return room
}

function roomFieldsPillowBean(progress: GameProgress): Room {
  const room: Room = {
    description: `You are far into the field, in the soft dirt of the furrow where lanky, dark green plants come up to your knees.
      A sea of gently waving leafage extends in all directions around you.
      You can barely see the hints of the structures comprising the town as a sliver on the horizon.`,
    things: [
      // TODO: Look at the beans more closely. Pick some beans? Can I make them grow back over time while you're away?
      // TODO: If every room had a tick function, that might work (since there's no zone-specific callbacks).
      // TODO: One might be injected in the main room lookup function.
      {
        name: `Empty`,
        lookAt: `Bare soil with spotted wild growth lies on the other side of the field.`,
        exit: {
          roomNo: 1044,
          goNarration: `You carefully pass through the beans to avoid damaging them.`,
        },
      },
      {
        name: `Bridge`,
        lookAt: `There is a bridge barely visible beyond the rows of beans.`,
        exit: {
          roomNo: 1045,
          goNarration: `You carefully pass through the beans to avoid damaging them.`,
        },
      },
    ],
    tick: () => tickAmbianceFields(progress),
    battle: battleFields,
  }

  return room
}

function roomFieldsWheat(progress: GameProgress): Room {
  const room: Room = {
    description: `You are in a worn trail through a field of green wheat, smooth to the touch,
      which is reaching up to your mid section.`,
    things: [
      {
        name: `Ditch`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1046,
          goNarration: ``, // TODO
        },
      },
      {
        name: `Empty`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1044,
          goNarration: ``, // TODO
        },
      },
      {
        name: `Run Up`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1047,
          goNarration: ``, // TODO
        },
      },
    ],
    tick: () => tickAmbianceFields(progress),
    battle: battleFields,
  }

  return room
}

function roomFieldsEmpty(progress: GameProgress): Room {
  const room: Room = {
    description: `Empty`, // TODO
    things: [
      {
        name: `Pillow Bean`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1042,
          goNarration: ``, // TODO
        },
      },
      {
        name: `Wheat`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1043,
          goNarration: ``, // TODO
        },
      },
      {
        name: `Run Up`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1047,
          goNarration: ``, // TODO
        },
      },
    ],
    tick: () => tickAmbianceFields(progress),
    battle: battleFields,
  }

  return room
}

function roomFieldsBridge(progress: GameProgress): Room {
  const room: Room = {
    description: `You are on a sturdy bridge made from long planks of sun greyed wood.
      A still ditch filled with still, dark water sits underneath.
      On either end of the bridge is the start of a farm field.`,
    things: [
      // TODO: Look at ditch/water
      // TOOD: Look at bridge itself. It's in good repair, some planks have been replaced and are less faded.
      {
        name: `Sweet Root`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1041,
          goNarration: ``, // TODO
        },
      },
      {
        name: `Pillow Bean`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1042,
          goNarration: ``, // TODO
        },
      },
    ],
    tick: () => tickAmbianceFields(progress),
    battle: battleFields,
  }

  return room
}

function roomFieldsDitch(progress: GameProgress): Room {
  const room: Room = {
    description: `Ditch`, // TODO
    things: [
      {
        name: `Sweet Root`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1041,
          goNarration: ``, // TODO
        },
      },
      {
        name: `Wheat`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1043,
          goNarration: ``, // TODO
        },
      },
    ],
    tick: () => tickAmbianceFields(progress),
    battle: battleFields,
  }

  return room
}

function roomFieldsRunUp(progress: GameProgress): Room {
  const room: Room = {
    description: `Run Up`, // TODO
    things: [
      {
        name: `Wheat`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1043,
          goNarration: ``, // TODO
        },
      },
      {
        name: `Empty`, // TODO
        lookAt: ``, // TODO
        exit: {
          roomNo: 1044,
          goNarration: ``, // TODO
        },
      },
    ],
  }

  return room
}

export function init(world: World) {
  world.registerZone(1, (progress, roomNo) => {
    switch (roomNo) {
      // 1000 - 1004 for the houses.
      case 1000: return roomInRowHouse(progress)
      case 1001: return roomRowHouseLawn(progress)
      case 1002: return roomBackYard(progress)

      // 1005 - 1009 for the meadow.
      case 1005: return roomMeadow(progress)
      case 1009: return roomOutsideTheForest(progress)

      // 1010 - 1029 for the forest.
      case 1010: return roomForestOutskirts(progress)

      // 1030 - 1039 for hill road.
      case 1030: return roomHillRoad(progress)
      case 1031: return roomHillRoadBridge(progress)
      case 1032: return roomHillRoadBridgeUnder(progress)
      case 1033: return roomHillRoadBridgeUnderDownRiver(progress)

      // 1040 - 1049 for the fields.
      case 1040: return roomFieldsAreaWest(progress)     //     2 - - - 4
      case 1041: return roomFieldsSweetRoot(progress)    //     |       | \
      case 1042: return roomFieldsPillowBean(progress)   //     5       |  7
      case 1043: return roomFieldsWheat(progress)        //     |       | /
      case 1044: return roomFieldsEmpty(progress)        // 0 - 1 - 6 - 3
      case 1045: return roomFieldsBridge(progress)
      case 1046: return roomFieldsDitch(progress)
      case 1047: return roomFieldsRunUp(progress)

      // 1050 - 1079 for town.
      case 1050: return roomBehindTheHall(progress)
    }
    return roomOops()
  });
}
