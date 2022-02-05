// These are the world components for a single language that the game engine uses
// directly to show the game state to the player.

export interface Thing {
}

export interface Zone {
}

export interface Room {
  roomNo: number,
  name: string,
  description: string,
  things: Array<Thing>,
}

