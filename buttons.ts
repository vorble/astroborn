import { Game } from './game.js'

export interface ButtonBarAction {
  text: string
  do: () => any
}
const ButtonBarActionNone = 'none'
const ButtonBarActionPageLeft = 'left'
const ButtonBarActionPageRight = 'right'

export class ButtonsBar {
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

export class ButtonsGrid {
  buttons: Array<HTMLButtonElement>
  game: Game

  constructor(game: Game) {
    this.buttons = []
    for (const button of document.querySelectorAll('.buttons_grid button')) {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('Button bar contains non-button.')
      }
      this.buttons.push(button)
    }

    this.buttons[0].innerText = 'Look' // TODO: Temporarily here, need to do like the action bar, but the grid needs some extra modes like left and right paging.
    this.buttons[0].onclick = () => {
      this.game.doLook()
    }
    this.game = game
  }

  reset() {
  }
}
