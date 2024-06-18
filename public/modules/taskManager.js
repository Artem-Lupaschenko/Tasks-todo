class Task {
  #id;
  #name;
  #date;
  #time;
  #pomodoro;
  #isDone;
  #isGoing;

  constructor(id, name, date, time, pomodoro) {
    this.#id = id;
    this.#name = name;
    this.#date = date;
    this.#time = time;
    this.#pomodoro = pomodoro;
    this.#isDone = false;
    this.#isGoing = false;
  }

  get name() {
    return this.#name;
  }

  get date() {
    return this.#date;
  }

  get time() {
    return this.#time;
  }

  get pomodoro() {
    return this.#pomodoro;
  }

  get id() {
    return this.#id;
  }

  set id(value) {
    if (!this.#id) this.#id = value;
  }

  get isDone() {
    return this.#isDone;
  }

  get isGoing() {
    return this.#isGoing;
  }

  enable() {
    this.#isDone = false;
  }

  disable() {
    this.#isDone = true;
  }

  start() {
    this.#isGoing = true;
  }

  stop() {
    this.#isGoing = false;
  }

  change(name, date, time, pomodoro) {
    this.#name = name;
    this.#date = date;
    this.#time = time;
    this.#pomodoro = pomodoro;
  }

  clone() {
    const task = new Task(this.id, this.name, this.date, this.time, this.pomodoro);
    this.isDone ? task.disable() : task.enable();
    this.isGoing ? task.start() : task.stop();
    return task;
  }
}

export default class TaskManager {
  #tasks;
  #currentTaskId;
  #apiManager

  constructor(apiManager) {
    this.#tasks = [];
    this.#apiManager = apiManager;
  }

  getTasks() {
    return this.#tasks.map((task) => task.clone());
  }

  getTask(id) {
    return this.#tasks.find((task) => task.id === id)?.clone();
  }

  #getRealTask(id) {
    return this.#tasks.find((task) => task.id === id);
  }

  setCurrentTask(id) {
    this.#currentTaskId = id;
  }
  
  unsetCurrentTask() {
    this.#currentTaskId = undefined;
  }

  getCurrentTask() {
    return this.getTask(this.#currentTaskId);
  }

  startCurrentTask() {
    this.beginTask(this.#currentTaskId);
  }

  stopCurrentTask() {
    this.finishTask(this.#currentTaskId);
  }

  beginTask(id) {
    const task = this.#getRealTask(id);
    if (!task || task.isDone) return;

    this.#changeTasks("stop", ...this.#tasks);
    this.#changeTasks("start", task);
  }

  finishTask(id) {
    const task = this.#getRealTask(id);
    if (!task) return;

    this.#changeTasks("stop", task);
  }

  async editTask(id, name, date, time, pomodoro) {
    let task = this.#getRealTask(id);
    if (!task) return;

    try {
      const taskData = await this.#updateTask(id, name, date, time, pomodoro, task.isDone);
      task.change(taskData.name, taskData.date, taskData.time, taskData.pomodoro);
      } catch (error) {
      console.log(error.message);
    }
  }

  async toggleTaskAsDone(id) {
    let task = this.#getRealTask(id);
    if (!task) return;
    let action = !task.isDone ? "disable" : "enable";

    try {
      await this.#updateTask(id, task.name, task.date, task.time, task.pomodoro, !task.isDone);
      this.#changeTasks(action, task);
    } catch (error) {
      console.log(error.message);
    }
  }

  #changeTasks(action, ...tasks) {
    if (!tasks) return;

    tasks.forEach((task) => task[action]());
  }

  async createTask(name, date, time, pomodoro) {
    const taskData = await this.#apiManager.createTask(name, date, time, pomodoro);
    let task = new Task(taskData.id, taskData.name, taskData.date, taskData.time, taskData.pomodoro);
    this.#tasks.push(task);
    return task.id
  }

  async syncTasks() {
    let tasksData = await this.#apiManager.syncTasks();

    this.#tasks = [];

    for (const taskData of tasksData) {
      const task = new Task(taskData.id, taskData.name, taskData.date, taskData.time, taskData.pomodoro);
      this.#tasks.push(task);

      if (taskData.done) this.#changeTasks("disable", task);
    }
  }

  async #updateTask(id, name, date, time, pomodoro, isDone) {
    const taskData = await this.#apiManager.updateTask(id, name, date, time, pomodoro, isDone);
    return taskData;
  }

  async removeTask(id) {
    const taskData = await this.#apiManager.removeTask(id);
    this.#tasks.splice(
      this.#tasks.findIndex((task) => task.id === taskData.id),
      1
    );
  }

  async removeTasks() {
    this.#tasks = await this.#apiManager.removeTasks();
  }
}