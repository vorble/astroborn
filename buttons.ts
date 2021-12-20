import { Game } from './game.js'
import { langmapFull, LangMap } from './lang.js'

export interface ButtonBarAction {
  text: string
  do: () => any
}
const ButtonBarActionNone = 'none'
const ButtonBarActionPageLeft = 'left'
const ButtonBarActionPageRight = 'right'

export class ButtonBar {
  buttons: Array<HTMLButtonElement>
  actions: Array<ButtonBarAction>
  page: number

  constructor() {
    this.buttons = []
    for (const button of document.querySelectorAll('.buttons_bar button')) {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('Button bar contains non-button.')
      }
      const buttonIndex = this.buttons.length
      button.onclick = () => { this.doAction(buttonIndex) }
      this.buttons.push(button)
    }
    this.actions = []
    this.page = 0
  }

  setActions(actions: Array<ButtonBarAction>) {
    this.actions = actions.slice()
    this.updateButtons()
  }

  setActionsAndPage(actions: Array<ButtonBarAction>, page: number) {
    this.actions = actions.slice()
    this.page = page
    this.updateButtons()
  }

  _calculateFirstActionIndex(page: number): number {
    if (page == 0) {
      return 0
    }
    return (this.buttons.length - 1) + (page - 1) * (this.buttons.length - 2)
  }

  getAction(buttonIndex: number): ButtonBarAction | typeof ButtonBarActionNone | typeof ButtonBarActionPageLeft | typeof ButtonBarActionPageRight {
    const first = this._calculateFirstActionIndex(this.page)
    const remainingActions = this.actions.length - first
    const getActionSimple = (buttonIndex: number, noButtons: number) : ButtonBarAction | typeof ButtonBarActionNone | typeof ButtonBarActionPageRight => {
      const showRightScroll = remainingActions > noButtons
      if (showRightScroll && buttonIndex == noButtons - 1) {
        return ButtonBarActionPageRight
      }
      const index = first + buttonIndex
      return index < this.actions.length ? this.actions[index] : ButtonBarActionNone
    }
    if (this.page == 0) {
      return getActionSimple(buttonIndex, this.buttons.length)
    } else if (buttonIndex == 0) {
      return ButtonBarActionPageLeft
    }
    return getActionSimple(buttonIndex - 1, this.buttons.length - 1) 
  }

  updateButtons() {
    for (let i = 0; i < this.buttons.length; ++i) {
      const button = this.buttons[i]
      const action = this.getAction(i)
      if (ButtonBarActionNone == action) {
        button.innerText = ''
      } else if (ButtonBarActionPageLeft == action) {
        button.innerText = '...'
      } else if (ButtonBarActionPageRight == action) {
        button.innerText = '...'
      } else {
        button.innerText = action.text
      }
    }
  }

  doAction(buttonIndex: number) {
    const action = this.getAction(buttonIndex)
    if (ButtonBarActionNone == action) {
    } else if (ButtonBarActionPageLeft == action) {
      this.page -= 1
      this.updateButtons()
    } else if (ButtonBarActionPageRight == action) {
      this.page += 1
      this.updateButtons()
    } else {
      action.do()
    }
  }
}

export interface ButtonGridLayoutAction {
  text: string,
  do: () => any,
}
type ButtonGridLayoutControl = 'none' | 'look' | 'lookat' | 'use'
const BG_LOOK = 0
const BG_LOOK_AT = 1
const BG_USE = 2

export interface ButtonGridLayout {
  lookAt: Array<ButtonGridLayoutAction>,
  use: Array<ButtonGridLayoutAction>,
}

export class ButtonGrid {
  buttons: Array<HTMLButtonElement>
  game: Game
  layout: null | ButtonGridLayout

  constructor(game: Game) {
    this.buttons = []
    for (const button of document.querySelectorAll('.buttons_grid button')) {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('Button bar contains non-button.')
      }
      const buttonIndex = this.buttons.length
      button.onclick = () => this.doAction(buttonIndex)
      this.buttons.push(button)
    }
    this.game = game
    this.layout = null
  }

  // CAUTION: Holds onto the layout object, so don't modify it after giving it to the method.
  setLayout(layout: ButtonGridLayout) {
    this.layout = layout
    this.updateButtons()
  }

  updateButtons() {
    if (this.layout == null) {
      return ''
    }
    for (let i = 0; i < this.buttons.length; ++i) {
      const button = this.buttons[i]
      if (i == BG_LOOK) {
        button.innerText = this.game.strings.buttonGrid.look
      } else if (i == BG_LOOK_AT) {
        button.innerText = this.game.strings.buttonGrid.lookAt
      } else if (i == BG_USE) {
        button.innerText = this.game.strings.buttonGrid.use
      }
    }
  }

  getAction(buttonIndex: number): ButtonGridLayoutAction | ButtonGridLayoutControl {
    if (this.layout == null) {
      return 'none'
    } else if (buttonIndex == BG_LOOK) {
      return 'look'
    } else if (buttonIndex == BG_LOOK_AT) {
      return 'lookat'
    } else if (buttonIndex == BG_USE) {
      return 'use'
    }
    return 'none'
  }

  doAction(buttonIndex: number) {
    const action = this.getAction(buttonIndex)
    if (action == 'none') {
    } else if (action == 'look') {
      this.game.doLook()
    } else if (action == 'lookat') {
      // TODO
    } else if (action == 'use') {
      // TODO
    } else {
      action.do()
    }
  }
}
