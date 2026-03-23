
export class GameStateMachine {
  scene: any;
  currentState: any;
  states: Map<string, any>;

  constructor(scene) {
    this.scene = scene;
    this.currentState = null;
    this.states = new Map();
  }

  addState(key, config) {
    this.states.set(key, config);
  }

  setState(key) {
    if (this.currentState && this.currentState.exit) {
      this.currentState.exit();
    }

    const nextState = this.states.get(key);
    if (nextState) {
      this.currentState = nextState;
      if (this.currentState.enter) {
        this.currentState.enter();
      }
    }
  }

  update(time, delta) {
    if (this.currentState && this.currentState.update) {
      this.currentState.update(time, delta);
    }
  }

  is(key) {
    return this.states.get(key) === this.currentState;
  }
}