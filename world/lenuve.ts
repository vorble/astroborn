import { BattleTemplate, BattleMobInput } from '../battle.js'
import { GameProgress } from '../game.js'
import { rollRange, rollRatio } from '../roll.js'
import { Room } from '../room.js'
import { World } from '../world.js'

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
      if (r < 0.15) {
        return { position: 'guard' }
      } else if (r < 0.30) {
        return { initialNarration: `${ mob.name } lets out a series of clicks.` }
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
      },
      {
        name: `Hole`,
        lookAt: `It's a hole in the wood. You might be able to get a closer look.`,
        use: () => {
          return {
            narration: `You look into the hole. Something is inside!`,
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
    ],
    // This bit of ambiance isn't very important to the room and probably belongs more in the meadow.
    tick: () => {
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
    },
  }

  return room
}

export function init(world: World) {
  world.registerZone(1, (progress, roomNo) => {
    switch (roomNo) {
      case 1000: return roomInRowHouse(progress) 
      case 1001: return roomRowHouseLawn(progress) 
    }
    return roomOops()
  });
}
