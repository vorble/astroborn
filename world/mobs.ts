import { langmap } from '../lang.js'
import { Mob } from '../mob.js'

const mobs: Array<Mob> = []

mobs.push({
  mobNo: 1_000,
  name: langmap({
    enus: 'Vacancy',
  }),
  description: langmap({
    enus: 'Your senses fail you, but you know something is present.',
  }),
})

export default mobs
