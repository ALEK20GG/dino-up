export default class Input {

  constructor() {

    this.keys = {}
    this.keysPressed = {}

    this.prevMoveDir = { h: 0, v: 0 }
    this.prevCamDir = { h: 0, v: 0 }

    this.deadzone = 0.2

    this.binds = {

      // Movimento personaggio → WASD + left stick
      moveUp:    ["KeyW"],
      moveDown:  ["KeyS"],
      moveLeft:  ["KeyA"],
      moveRight: ["KeyD"],

      // Movimento telecamera → Arrow keys + right stick
      camUp:    ["ArrowUp"],
      camDown:  ["ArrowDown"],
      camLeft:  ["ArrowLeft"],
      camRight: ["ArrowRight"],

      jump:    ["Space"],

      confirm: ["Enter", "KeyJ"],
      cancel:  ["Escape", "KeyK"]

    }

    this.input = {

      // Direzione movimento personaggio (WASD / left stick)
      moveDir: { h: 0, v: 0, hPressed: false, vPressed: false },

      // Direzione telecamera (Arrow keys / right stick)
      camDir: { h: 0, v: 0, hPressed: false, vPressed: false },

      jump: false,
      jumpPressed: false,

      confirm: false,
      cancel: false

    }

    this.setupKeyboard()
    this.setupFocusGuard()
  }
 
  setupFocusGuard() {
    const clear = () => {
      this.keys = {}
      this.keysPressed = {}
    }
    window.addEventListener("blur", clear)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear()
    })
  }

  setupKeyboard() {

    window.addEventListener("keydown", e => {

      if (!this.keys[e.code]) {
        this.keysPressed[e.code] = true
      }

      this.keys[e.code] = true

    })

    window.addEventListener("keyup", e => {

      this.keys[e.code] = false

    })

  }

  checkKeyboard(arr) {

    return arr.some(k => this.keys[k])

  }

  checkKeyboardPressed(arr) {

    return arr.some(k => this.keysPressed[k])

  }

  getGamepad() {

    const pads = navigator.getGamepads()

    for (let p of pads) {

      if (p) return p

    }

    return null

  }

  axis(val) {

    if (Math.abs(val) < this.deadzone) return 0

    return Math.sign(val)

  }

  // Direzione movimento personaggio: WASD + left stick (axes 0/1)
  inputMoveDir() {

    let h = 0
    let v = 0

    const pad = this.getGamepad()

    if (pad) {
      h += this.axis(pad.axes[0])
      v += this.axis(pad.axes[1])
    }

    if (this.checkKeyboard(this.binds.moveLeft))  h--
    if (this.checkKeyboard(this.binds.moveRight)) h++
    if (this.checkKeyboard(this.binds.moveUp))    v--
    if (this.checkKeyboard(this.binds.moveDown))  v++

    h = Math.sign(h)
    v = Math.sign(v)

    const result = {
      h,
      v,
      hPressed: this.prevMoveDir.h !== h && h !== 0,
      vPressed: this.prevMoveDir.v !== v && v !== 0
    }

    this.prevMoveDir = { h, v }

    return result

  }

  // Direzione telecamera: Arrow keys + right stick (axes 2/3)
  inputCamDir() {

    let h = 0
    let v = 0

    const pad = this.getGamepad()

    if (pad) {
      h += this.axis(pad.axes[2])
      v += this.axis(pad.axes[3])
    }

    if (this.checkKeyboard(this.binds.camLeft))  h--
    if (this.checkKeyboard(this.binds.camRight)) h++
    if (this.checkKeyboard(this.binds.camUp))    v--
    if (this.checkKeyboard(this.binds.camDown))  v++

    h = Math.sign(h)
    v = Math.sign(v)

    const result = {
      h,
      v,
      hPressed: this.prevCamDir.h !== h && h !== 0,
      vPressed: this.prevCamDir.v !== v && v !== 0
    }

    this.prevCamDir = { h, v }

    return result

  }

  actionHeld(bind) {

    const pad = this.getGamepad()

    if (pad) {

      if (bind === "jump")    return pad.buttons[0].pressed
      if (bind === "confirm") return pad.buttons[0].pressed
      if (bind === "cancel")  return pad.buttons[1].pressed

    }

    return this.checkKeyboard(this.binds[bind])

  }

  actionPressed(bind) {

    return this.checkKeyboardPressed(this.binds[bind])

  }

  update() {

    this.input.moveDir = this.inputMoveDir()
    this.input.camDir  = this.inputCamDir()

    this.input.jump        = this.actionHeld("jump")
    this.input.jumpPressed = this.actionPressed("jump")

    this.input.confirm = this.actionPressed("confirm")
    this.input.cancel  = this.actionPressed("cancel")

    this.keysPressed = {}

  }

}