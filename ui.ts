// The ui module controls the user interface marked up in index.html. The interface provides a
// simplistic interface with four parts:
//
// 1. Narration - An area in which text information is displayed to the player, describing the
//                events occurring in the game.
// 2. Resources - An area with three colored bars indicating the player's HP, MP, and PP.
// 3. Targets   - A series of four buttons indicating targets for the player (places to go, foes
//                in a battle). When more than four targets are available, paging indicators
//                are present.
// 4. Actions   - A grid of nine buttons that allow the player to perform various actions
//                depending on what's going on at the time. An action button may open a set of
//                sub-actions. The actions grid can also operate in paging mode with paging
//                indicators and a close button in the bottom row.

// Maximum number of narration elements to show.
const NARRATION_LIMIT = 300

function getElementByIdOrThrow(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (element == null) {
    throw new Error(`HTML element with id="${ id }" was not found.`)
  }
  return element
}

function getButtons(element: HTMLElement): Array<UIButton> {
  const buttons = []
  for (const button of element.childNodes) {
    if (button instanceof HTMLButtonElement) {
      buttons.push(new UIButton(button))
    }
  }
  return buttons
}

class UINarration {
  element: HTMLElement
  trimHistoryGate: number

  constructor(which: 'narration') {
    this.element = getElementByIdOrThrow(which)
    this.trimHistoryGate = 0
    this.reset()
  }

  reset() {
    this.element.innerHTML = '<p class="spacer"></p>'
    this.element.scrollTo({
      top: this.element.scrollHeight,
    })
  }

  _trimHistory() {
    const expectTrimHistoryGate = (this.trimHistoryGate + 1) & 0xFFFFFF
    this.trimHistoryGate = expectTrimHistoryGate
    // Wait a little bit before trimming the history so the smooth scrolling can occur before
    // getting rid of the old text. Don't let history trimmings overlap since new text may
    // have been appended already and the timer should reset.
    setTimeout(() => {
      if (expectTrimHistoryGate == this.trimHistoryGate) {
        while (this.element.childNodes.length > NARRATION_LIMIT && this.element.firstElementChild != null) {
          this.element.removeChild(this.element.firstElementChild)
        }
      }
    }, 2000)
  }

  append(text: string) {
    const p = document.createElement('p')
    p.innerText = text.replace(/\r?\n/g, ' ')
    this.element.appendChild(p)
    p.scrollIntoView({
      behavior: 'smooth',
    })
    this._trimHistory()
  }
}

class UIResourceBar {
  element: HTMLElement

  constructor(which: 'hp' | 'mp' | 'pp') {
    this.element = getElementByIdOrThrow(which)
    this.reset()
  }

  reset() {
    this.element.style.width = '100%'
  }

  // Set the resource bar to some percentage defined by the current value and the maximum.
  // E.g. use the player's current HP and maximum HP for these values.
  set(current: number, maximum: number) {
    if (!Number.isFinite(current) || !Number.isFinite(maximum) || maximum <= 0) {
      throw new Error(`Invalid values: current=${ current }, maximum=${ maximum }`)
    }
    if (current < 0) {
      console.warn(`UIResourceBar::set(): Value too low, using 0: current=${ current }, maximum=${ maximum }`)
      current = 0
    } else if (current > maximum) {
      console.warn(`UIResourceBar::set(): Value too high, using maximum: current=${ current }, maximum=${ maximum }`)
      current = maximum
    }
    const percent = current / maximum * 100
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new Error(`Assertion error, percent is out of bounds: percent=${ percent }.`) 
    }
    this.element.style.width = percent + '%'
  }
}

class UIButton {
  element: HTMLButtonElement
  expectWidth: number
  expectHeight: number
  action: null | (() => void)

  constructor(element: HTMLButtonElement) {
    this.element = element
    this.expectWidth = this.element.clientWidth
    this.expectHeight = this.element.clientHeight
    this.action = null
    this.element.onclick = () => {
      if (this.action != null) {
        this.action()
      }
    }
    this.reset()
  }

  reset() {
    this.element.innerText = ''
    this.action = null
  }

  set(text: string, action: () => void) {
    this.element.innerText = text
    this.action = action
  }
}

interface UITargetBarItem {
  text: string,
  action: () => void,
}

export interface UITargetBarState {
  items: Array<UITargetBarItem>
  page: number
}

class UITargetBar {
  buttons: Array<UIButton>
  items: Array<UITargetBarItem>
  page: number

  constructor(which: 'targets') {
    this.buttons = getButtons(getElementByIdOrThrow(which))
    if (this.buttons.length < 3) {
      throw new Error(`At least 3 buttons are required in the targets bar.`)
    }
    this.items = []
    this.page = 0
    // No reset, the buttons reset themselves when they are created in getButtons().
  }

  reset() {
    this.items = []
    this.page = 0
    for (const button of this.buttons) {
      button.reset()
    }
  }

  // TODO: The user will probably be happier if there was a variant of this method which doesn't reset the paging.
  setTargets(items: Array<UITargetBarItem>) {
    this.page = 0
    this.items = [...items]
    this._updateButtons()
  }

  _calculateFirstActionIndex(page: number): number {
    if (page == 0) {
      return 0
    }
    return (this.buttons.length - 1) + (page - 1) * (this.buttons.length - 2)
  }

  _getItem(buttonIndex: number): UITargetBarItem | null | 'left' | 'right' {
    const first = this._calculateFirstActionIndex(this.page)
    const remainingActions = this.items.length - first
    const getItemSimple = (buttonIndex: number, noButtons: number) : UITargetBarItem | null | 'right' => {
      const showRightScroll = remainingActions > noButtons
      if (showRightScroll && buttonIndex == noButtons - 1) {
        return 'right'
      }
      const index = first + buttonIndex
      return index < this.items.length ? this.items[index] : null
    }
    if (this.page == 0) {
      return getItemSimple(buttonIndex, this.buttons.length)
    } else if (buttonIndex == 0) {
      return 'left'
    }
    return getItemSimple(buttonIndex - 1, this.buttons.length - 1) 
  }

  _updateButtons() {
    for (let i = 0; i < this.buttons.length; ++i) {
      const button = this.buttons[i]
      const item = this._getItem(i)
      if (item == null) {
        button.reset()
      } else if (item == 'left') {
        button.set('...', () => {
          this.page -= 1
          this._updateButtons()
        })
      } else if (item == 'right') {
        button.set('...', () => {
          this.page += 1
          this._updateButtons()
        })
      } else {
        button.set(item.text, item.action)
      }
    }
  }

  save(): UITargetBarState {
    return {
      items: this.items,
      page: this.page,
    }
  }

  restore(state: UITargetBarState) {
    Object.assign(this, state)
    this._updateButtons()
  }
}

interface UIActionGridItem {
  text: string,
  action: () => void,
}

export interface UIActionGridState {
  items: Array<UIActionGridItem>
  mode: 'actions' | 'list'
  page: number
  // TODO rename closeState to reflect that it can also be an action function.
  closeState: null | UIActionGridState | (() => void)
}

class UIActionGrid {
  buttons: Array<UIButton>
  items: Array<UIActionGridItem>
  mode: 'actions' | 'list'
  page: number
  // TODO rename closeState to reflect that it can also be an action function.
  closeState: null | UIActionGridState | (() => void)

  constructor(which: 'actions') {
    this.buttons = getButtons(getElementByIdOrThrow(which))
    if (this.buttons.length != 9) {
      throw new Error(`Actions grid requires 9 items. Found ${ this.buttons.length }.`)
    }
    this.items = []
    this.mode = 'actions'
    this.page = 0
    this.closeState = null
    // No reset, the buttons reset themselves when they are created in getButtons().
  }

  reset() {
    this.items = []
    this.mode = 'actions'
    this.page = 0
    this.closeState = null
    for (const button of this.buttons) {
      button.reset()
    }
  }

  save(): UIActionGridState {
    return {
      items: this.items,
      mode: this.mode,
      page: this.page,
      closeState: this.closeState,
    }
  }

  restore(state: UIActionGridState) {
    Object.assign(this, state)
    this._updateButtons()
  }

  _getItem(buttonIndex: number): UIActionGridItem | null | 'left' | 'close' | 'right' {
    if (this.mode == 'actions') {
      return buttonIndex < this.items.length ? this.items[buttonIndex] : null
    } else if (this.mode == 'list') {
      // 0 1 2
      // 3 4 5
      // 6 7 8 <-- 6 left, 7 close, 8 right
      if (buttonIndex == 6) {
        return this.page > 0 ? 'left' : null
      } else if (buttonIndex == 7) {
        return 'close'
      } else if (buttonIndex == 8) {
        return (this.page + 1) * 6 < this.items.length ? 'right' : null
      }
      const actionIndex = this.page * 6 + buttonIndex
      return actionIndex < this.items.length ? this.items[actionIndex] : null
    } else {
      throw new Error(`Unhandled mode="${ this.mode }".`)
    }
  }

  _updateButtons() {
    for (let i = 0; i < this.buttons.length; ++i) {
      const button = this.buttons[i]
      const item = this._getItem(i)
      if (item == null) {
        button.reset()
      } else if (item == 'left') {
        button.set('<', () => {
          this.page -= 1
          this._updateButtons()
        })
      } else if (item == 'close') {
        if (this.closeState == null) {
          throw new Error(`Assertion error, no close state found.`)
        }
        const closeState = this.closeState
        button.set('X', () => {
          if (typeof closeState === 'function') {
            closeState()
          } else {
            this.restore(closeState)
          }
        })
      } else if (item == 'right') {
        button.set('>', () => {
          this.page += 1
          this._updateButtons()
        })
      } else {
        button.set(item.text, item.action)
      }
    }
  }

  setActions(items: Array<UIActionGridItem>) {
    if (items.length > this.buttons.length) {
      throw new Error(`Action items cannot exceed ${ this.buttons.length } items.`)
    }
    this.mode = 'actions'
    this.items = [...items]
    this.page = 0
    this.closeState = null
    this._updateButtons()
  }

  setList(items: Array<UIActionGridItem>, closeState: UIActionGridState | (() => void)) {
    this.mode = 'list'
    this.items = [...items]
    this.page = 0
    this.closeState = closeState
    this._updateButtons()
  }
}

export class UI {
  narration: UINarration
  hp: UIResourceBar
  mp: UIResourceBar
  pp: UIResourceBar
  targets: UITargetBar
  actions: UIActionGrid

  constructor() {
    this.narration = new UINarration('narration')
    this.hp = new UIResourceBar('hp')
    this.mp = new UIResourceBar('mp')
    this.pp = new UIResourceBar('pp')
    this.targets = new UITargetBar('targets')
    this.actions = new UIActionGrid('actions')
  }

  reset() {
    this.narration.reset()
    this.hp.reset()
    this.mp.reset()
    this.pp.reset()
    this.targets.reset()
    this.actions.reset()
  }
}
