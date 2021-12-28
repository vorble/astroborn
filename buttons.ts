import { Game } from './game.js'

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
  do?: () => any,
  options?: Array<ButtonGridLayoutAction>,
}
type ButtonGridLayoutControl = 'none' | 'look' | 'lookat' | 'use' | 'talk' | 'get' | 'item'
// Button Grid Main Buttons
const BG_LOOK = 0
const BG_LOOK_AT = 1
const BG_USE = 2
const BG_TALK = 3
const BG_GET = 4
const BG_ITEM = 5
// Button Grid Menu Navigation Buttons
const BGM_LEFT = 6
const BGM_CLOSE = 7
const BGM_RIGHT = 8

export interface ButtonGridLayout {
  lookAt: Array<ButtonGridLayoutAction>,
  use: Array<ButtonGridLayoutAction>,
  talk: Array<ButtonGridLayoutAction>,
  get: Array<ButtonGridLayoutAction>,
  items: Array<ButtonGridLayoutAction>,
}

export class ButtonGridMenu {
  grid: ButtonGrid
  game: Game
  buttons: Array<HTMLButtonElement>
  parent: null | ButtonGridMenu
  actions: Array<ButtonGridLayoutAction>
  page: number

  constructor(grid: ButtonGrid, parent: null | ButtonGridMenu, actions: Array<ButtonGridLayoutAction>) {
    this.grid = grid
    this.game = grid.game
    this.buttons = grid.buttons
    this.parent = parent
    this.actions = actions
    this.page = 0
  }

  updateButtons() {
    const availableButtons = (this.buttons.length - 3)
    let actionIndex = this.page * availableButtons
    for (let i = 0; i < this.buttons.length; ++i, ++actionIndex) {
      const button = this.buttons[i]
      if (i == BGM_CLOSE) {
        button.innerText = 'X'
      } else if (i == BGM_LEFT) {
        button.innerText = '<'
      } else if (i == BGM_RIGHT) {
        button.innerText = '>'
      } else if (actionIndex < this.actions.length) {
        button.innerText = this.actions[actionIndex].text
      } else {
        button.innerText = ''
      }
    }
  }

  doAction(buttonIndex: number) {
    const availableButtons = (this.buttons.length - 3)
    let actionIndex = this.page * availableButtons + buttonIndex
    if (buttonIndex == BGM_CLOSE) {
      this.grid.menu = this.parent
      this.grid.updateButtons()
    } else if (buttonIndex == BGM_LEFT) {
      if (this.page > 0) {
        this.page -= 1
      }
      this.grid.updateButtons()
    } else if (buttonIndex == BGM_RIGHT) {
      const availableButtons = (this.buttons.length - 3)
      const remainingActions = this.actions.length - this.page * availableButtons
      if (remainingActions > availableButtons) {
        this.page += 1
      }
      this.grid.updateButtons()
    } else if (actionIndex < this.actions.length) {
      const dofn = this.actions[actionIndex].do
      const options = this.actions[actionIndex].options
      if (typeof dofn == 'function') {
        dofn()
        this.grid.menu = null
      } else if (options !== undefined) {
        this.grid.menu = new ButtonGridMenu(this.grid, this, options)
      }
      this.grid.updateButtons()
    }
  }
}

export class ButtonGrid {
  buttons: Array<HTMLButtonElement>
  game: Game
  layout: null | ButtonGridLayout
  menu: null | ButtonGridMenu

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
    this.menu = null
  }

  // CAUTION: Holds onto the layout object, so don't modify it after giving it to the method.
  setLayout(layout: ButtonGridLayout, resetMenus: boolean) {
    this.layout = layout
    if (resetMenus) {
      this.menu = null
    }
    this.updateButtons()
  }

  updateButtons() {
    if (this.menu != null) {
      return this.menu.updateButtons()
    } else if (this.layout == null) {
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
      } else if (i == BG_TALK) {
        button.innerText = this.game.strings.buttonGrid.talk
      } else if (i == BG_GET) {
        button.innerText = this.game.strings.buttonGrid.get
      } else if (i == BG_ITEM) {
        button.innerText = this.game.strings.buttonGrid.item
      } else {
        button.innerText = ''
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
    } else if (buttonIndex == BG_TALK) {
      return 'talk'
    } else if (buttonIndex == BG_GET) {
      return 'get'
    } else if (buttonIndex == BG_ITEM) {
      return 'item'
    }
    return 'none'
  }

  doAction(buttonIndex: number) {
    if (this.menu != null) {
      return this.menu.doAction(buttonIndex)
    }
    const action = this.getAction(buttonIndex)
    if (action == 'none') {
    } else if (action == 'look') {
      this.game.doLook()
    } else if (action == 'lookat') {
      this.openLookMenu()
    } else if (action == 'use') {
      this.openUseMenu()
    } else if (action == 'talk') {
      this.openTalkMenu()
    } else if (action == 'get') {
      this.openGetMenu()
    } else if (action == 'item') {
      this.openItemMenu()
    }
  }

  openLookMenu() {
    if (this.layout == null) {
      return
    }
    this.menu = new ButtonGridMenu(this, this.menu, this.layout.lookAt)
    this.updateButtons()
  }

  openUseMenu() {
    if (this.layout == null) {
      return
    }
    this.menu = new ButtonGridMenu(this, this.menu, this.layout.use)
    this.updateButtons()
  }

  openGetMenu() {
    if (this.layout == null) {
      return
    }
    this.menu = new ButtonGridMenu(this, this.menu, this.layout.get)
    this.updateButtons()
  }

  openTalkMenu() {
    if (this.layout == null) {
      return
    }
    this.menu = new ButtonGridMenu(this, this.menu, this.layout.talk)
    this.updateButtons()
  }

  openItemMenu() {
    if (this.layout == null) {
      return
    }
    this.menu = new ButtonGridMenu(this, this.menu, this.layout.items)
    this.updateButtons()
  }
}
