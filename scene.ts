export type Narration = string | Array<string>
export class Scene {
  queue: Array<string>

  constructor(queue: Array<string>) {
    this.queue = [...queue]
  }

  hasMore(): boolean {
    return this.queue.length > 0
  }

  next(): string {
    const result = this.queue.shift()
    if (result == null) {
      throw new Error('Scene Underflow!')
    }
    return result
  }
}
