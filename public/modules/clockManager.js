import {POMODORO_MINUTES} from './globalVariables.js'

class Clock {
  #time;
  #state;
  constructor() {
    this.#time = new Date();
    this.#time.setMinutes(0, 0, 0);
  }

  getTime() {
    return this.#time;
  }

  setTime(time) {
    this.#time.setMinutes(time.minutes, time.seconds, time.milliseconds);
  }

  start() {
    this.#state = "ongoing";
  }

  pause() {
    this.#state = "paused";
  }

  stop() {
    this.#state = "stopped";
  }

  isGoing() {
    return this.#state === "ongoing";
  }

  isPaused() {
    return this.#state === "paused";
  }

  isStopped() {
    return this.#state === "stopped";
  }

  isFinished() {
    return (
      !this.#time.getMinutes() &&
      !this.#time.getSeconds() &&
      !this.#time.getMilliseconds()
    );
  }

  decreaseTime() {
    this.#time.setSeconds(this.#time.getSeconds() - 1);
  }
}

class ClockHand {
  #angle;

  constructor() {
    this.#angle = 0;
  }

  getAngle() {
    return this.#angle;
  }

  setAngle(data) {
    this.#angle =
      360 - (data.minutes * 360 + data.seconds * 6) / data.pomodoroMinutes;
  }
}

class ClockManager {
  #timer;
  #clock;
  #clockHand;
  #pomodoroMinutes;

  constructor(clock, clockHand) {
    this.#timer = null;
    this.#clock = clock;
    this.#clockHand = clockHand;
    this.#pomodoroMinutes = POMODORO_MINUTES;

    this.#clock.setTime({
      minutes: this.#pomodoroMinutes,
      seconds: 0,
      milliseconds: 0,
    });
    this.#clockHand.setAngle({
      minutes: 0,
      seconds: 0,
      pomodoroMinutes: this.#pomodoroMinutes,
    });
  }

  get pomodoro() {
    return this.#pomodoroMinutes;
  }

  set pomodoro(minutes) {
    this.#pomodoroMinutes = minutes;
  }

  getClockInfo() {
    return {
      date: new Date(this.#clock.getTime()),
      clockHandAngle: this.#clockHand.getAngle(),
      isGoing: this.#clock.isGoing(),
      isPaused: this.#clock.isPaused(),
      isStopped: this.#clock.isStopped(),
    };
  }

  getSpentTime() {
    return this.#pomodoroMinutes - this.getClockInfo().date.getMinutes();
  }

  tick() {
    this.#clock.decreaseTime();
    const date = this.#clock.getTime();
    this.#clockHand.setAngle({
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
      pomodoroMinutes: this.#pomodoroMinutes,
    });
  }

  startTimer(func) {
    this.#clock.start();
    this.#timer = setInterval(() => func(), 10);
  }

  pauseTimer() {
    this.#clock.pause();
    clearInterval(this.#timer);
  }

  clearTimer() {
    this.#clock.stop();
    this.#clock.setTime({
      minutes: this.#pomodoroMinutes,
      seconds: 0,
      milliseconds: 0,
    });
    this.#clockHand.setAngle({
      minutes: 0,
      seconds: 0,
      pomodoroMinutes: this.#pomodoroMinutes,
    });
    clearInterval(this.#timer);
  }

  isTimerFinished() {
    const time = this.#clock.getTime();
    return !time.getMinutes() && !time.getSeconds() && !time.getMilliseconds();
  }
}

export {Clock, ClockHand, ClockManager}