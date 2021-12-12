import {
  LangMap,
} from './lang'
import {
  FromGameState,
} from './game'

export interface Mob {
  mobNo: number,
  name: LangMap<string>
  description: FromGameState<LangMap<string>>
}
