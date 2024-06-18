import {DEFAULT_TASK, POMODORO_MINUTES} from './globalVariables.js'

class Statistic {
  #taskId;
  #taskName;
  #spentTime;
  #spentPomodoro;

  constructor(taskId, taskName, spentTime) {
    this.#taskId = taskId ?? undefined;
    this.#taskName = taskName ?? "Задача не вказана";
    this.#spentTime = spentTime;
    this.#spentPomodoro = (spentTime/POMODORO_MINUTES).toFixed(1);
  }

  get taskId() {
    return this.#taskId;
  }

  get taskName() {
    return this.#taskName;
  }

  get spentTime() {
    return this.#spentTime;
  }

  get spentPomodoro() {
    return this.#spentPomodoro;
  }

  clone() {
    return new Statistic(this.taskId, this.taskName, this.spentTime);
  }
}

export default class StatisticManager {
  #statistics;
  #overallMinutes;
  #apiManager;

  constructor(apiManager) {
    this.#statistics = new Map();
    this.#overallMinutes = 0;
    this.#apiManager = apiManager;
  }

  getStatistics() {
    return new Map(this.#statistics.entries());
  }

  getTaskStatistic(taskId) {
    return this.#statistics.get(taskId ?? DEFAULT_TASK);
  }

  getOverallMinutes() {
    return this.#overallMinutes;
  }

  refreshOverallMinutes() {
    this.#overallMinutes = 0;

    for (const taskId of this.#statistics.keys()) {
      this.#overallMinutes += this.#statistics.get(taskId).spentTime;
    }
  }

  async syncStatistics() {
    const statisticData = await this.#apiManager.syncStatistics();
    this.#statistics.clear();

    for (const statistic of statisticData) {
      this.#statistics.set(
        statistic.task_id ?? DEFAULT_TASK,
        new Statistic(
          statistic.task_id,
          statistic.task_name,
          statistic.spent_time
        )
      );
    }

    this.refreshOverallMinutes();
  }

  async sendTaskStatistic(data) {
    const statisticData = await this.#apiManager.sendTaskStatistic(data);
    const statistic = new Statistic(
      statisticData.task_id,
      statisticData.task_name,
      statisticData.spent_time
    );

    this.#statistics.set(data.taskId ?? DEFAULT_TASK, statistic);
    this.refreshOverallMinutes();
  }
}