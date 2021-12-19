export interface ButtonBarAction {
  text: string
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
    this.page = 0
    this.updateButtons()
  }

  getAction(buttonIndex: number): ButtonBarAction | typeof ButtonBarActionNone | typeof ButtonBarActionPageLeft | typeof ButtonBarActionPageRight {
    if (this.page > 0 && buttonIndex == 0) {
      return ButtonBarActionPageLeft
    }
    const first = calculateFirstActionIndex(this.page, this.buttons.length)
    let countActions = this.actions.length
    countActions -= first
    const showRightScroll = countActions > this.buttons.length - (this.page != 0 ? 1 : 0)
    if (showRightScroll && buttonIndex == this.buttons.length - 1) {
      return ButtonBarActionPageRight
    }
    const index = first + buttonIndex - (this.page != 0 ? 1 : 0)
    if (index >= this.actions.length) {
      return ButtonBarActionNone
    }
    return this.actions[index]



  }

  getAction1(totalActions: number, totalButtons: number, buttonIndex: number) {
    if (totalActions <= totalButtons) {
      return buttonIndex
    }

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

      }
  }
}

// Based on action bar page number, find the first action's index that would be
// available on the bar. page is zero-indexed.
function calculateFirstActionIndex(page: number, buttons: number) {
  if (page == 0) {
    return 0
  }
  return (buttons - 1) + (page - 1) * (buttons - 2)
}
(window as any).calculateFirstActionIndex = calculateFirstActionIndex

export class ButtonsGrid {
  buttons: Array<HTMLButtonElement>

  constructor() {
    this.buttons = []
    for (const button of document.querySelectorAll('.buttons_grid button')) {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('Button bar contains non-button.')
      }
      this.buttons.push(button)
    }
  }
}
