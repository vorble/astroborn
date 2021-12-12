import { langmap } from '../lang'
import { Mob } from '../mob'

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
