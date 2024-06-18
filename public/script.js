import {LOCALE} from './modules/globalVariables.js'
import {Clock, ClockHand, ClockManager} from './modules/clockManager.js'
import TaskManager from './modules/taskManager.js'
import UserManager from './modules/userManager.js'
import StatisticManager from './modules/statisticManager.js'
import UserInterface from './modules/userInterface.js'
import APIManager from './modules/apiManager.js'

class TimeFormatted extends HTMLElement {
  render() {
    let date = new Date(this.getAttribute("datetime") || new Date(0));

    this.innerHTML = new Intl.DateTimeFormat(LOCALE, {
      hour: this.getAttribute("hour") || undefined,
      minute: this.getAttribute("minute") || undefined,
      second: this.getAttribute("second") || undefined,
    }).format(date);
  }

  connectedCallback() {
    if (!this.rendered) {
      this.render();
      this.rendered = true;
    }
  }

  static get observedAttributes() {
    return ["datetime", "hour", "minute", "second"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.render();
  }
}

class ClockApp {
  #clockManager;
  #taskManager;
  #userManager;
  #statisticManager;
  #userInterface;

  constructor(
    clockManager,
    userManager,
    taskManager,
    statisticManager,
    userInterface
  ) {
    this.#clockManager = clockManager;
    this.#taskManager = taskManager;
    this.#userManager = userManager;
    this.#statisticManager = statisticManager;
    this.#userInterface = userInterface;

    this.#userInterface.setTaskStartButtonEvent(async (taskId) => {
      if (this.#taskManager.getTask(taskId).isDone) return;
      
      await this.stopClock();
      
      this.setCurrentTask(taskId);
      this.startClock();
    });

    this.#userInterface.setTaskDoneButtonEvent(async (taskId) => {
      await this.unsetTaskIfCurrent(taskId);
      await this.toggleTaskAsDone(taskId);
    });

    this.#userInterface.setAddTaskButtonEvent(() => {
      this.#userInterface.setPopupContent(UserInterface.getPopupContent().ADD_TASK);

      this.#userInterface.fillTaskPopupInputs("", 
                                0, 
                                new Date(Date.now()).toLocaleDateString('en-CA'), 
                                "");

      this.#userInterface.showTaskPopup(
        undefined,
        async (data) => {
          await this.addTask(data);
        });
    });

    this.#userInterface.setEditTaskButtonEvent((taskId) => {
      const task = this.#taskManager.getTask(taskId);

      this.#userInterface.setPopupContent(UserInterface.getPopupContent().EDIT_TASK);
      this.#userInterface.fillTaskPopupInputs(task.name, 
                                              task.pomodoro, 
                                              task.date, 
                                              task.time);

      this.#userInterface.showTaskPopup(
        taskId,
        async (data) => {
          await this.editTask(data);
          if (this.isCurrentTask(data.taskId)) this.setCurrentTask(data.taskId);
          await this.updateTaskStatistic(data.taskId);
        });
    });

    this.#userInterface.setTaskRemoveButtonEvent(async (taskId) => {
      await this.unsetTaskIfCurrent(taskId);
      await this.removeTask(taskId);
      await this.updateOverallTime();
    });

    this.#userInterface.setUserButtonEvent(() => {
      this.#userInterface.showUserMenu();
    });

    this.#userInterface.setUserRegisterButtonEvent(() => {
      this.#userInterface.setPopupContent(UserInterface.getPopupContent().REGISTER_USER);
      this.#userInterface.showRegisterUserPopup(
        async (data) => {
          await this.createUser(data);
        });
    });

    this.#userInterface.setUserLoginButtonEvent(() => {
      this.#userInterface.setPopupContent(UserInterface.getPopupContent().LOGIN_USER);
      this.#userInterface.showLoginUserPopup(
        async (data) => {
          await this.loginUser(data);
        });
    });

    this.#userInterface.setUserEditButtonEvent(() => {
      this.#userInterface.setPopupContent(UserInterface.getPopupContent().EDIT_USER);
      this.#userInterface.showEditUserPopup(
        async (data) => {
          await this.#userManager.editUserData(
            data.userName
          );
          location.reload();
        },
        async (data) => {
          await this.#userManager.editUserLogin(
            data.userLogin
          );
          location.reload();
        },
        async (data) => {
          await this.#userManager.editUserPassword(
            data.userOldPassword,
            data.userNewPassword
          );
          location.reload();
        });
    });

    this.#userInterface.setUserSignOutButtonEvent(() => this.signOutUser());
    
    this.#userInterface.setUserDeleteButtonEvent(() => {
      this.#userInterface.setPopupContent(UserInterface.getPopupContent().DELETE_USER);
      this.#userInterface.showDeleteUserPopup(
        async () => {
          await this.deleteUser();
        });
        
    });

    this.#userInterface.setClockStartButtonEvent(() => {
      this.startClock();
    });

    this.#userInterface.setClockPauseButtonEvent(() => {
      this.pauseClock();
    });

    this.#userInterface.setClockStopButtonEvent(async () => {
      await this.stopClock();
      this.stopCurrentTask();
    });

    window.addEventListener("beforeunload", async () => {
      const clockInfo = this.#clockManager.getClockInfo()
      if (clockInfo.isGoing || clockInfo.isPaused) {
        await this.stopClock();
      };
    })  
  }

  isCurrentTask(taskId) {
    return this.#taskManager.getCurrentTask()?.id === taskId;
  }

  setCurrentTask(taskId) {
    this.#taskManager.setCurrentTask(taskId);
    this.#userInterface.setCurrentTask(this.#taskManager.getCurrentTask());
  }

  unsetCurrentTask() {
    this.#taskManager.unsetCurrentTask();
    this.#userInterface.clearCurrentTask();
  }

  startCurrentTask() {
    this.#taskManager.startCurrentTask();
    this.#userInterface.startTask(this.#taskManager.getCurrentTask());
  }

  stopCurrentTask() {
    this.#taskManager.stopCurrentTask();
    this.#userInterface.stopTask(this.#taskManager.getCurrentTask());
  }

  async unsetTaskIfCurrent(taskId) {
    if (this.isCurrentTask(taskId)) {
      await this.stopClock();
      this.unsetCurrentTask();
    }
  }

  async toggleTaskAsDone(taskId) {
    await this.#taskManager.toggleTaskAsDone(taskId);
    this.#userInterface.updateTask(this.#taskManager.getTask(taskId));
  }

  async addTask(taskData) {
    const taskId = await this.#taskManager.createTask(
      taskData.taskName,
      taskData.taskDate,
      taskData.taskTime, 
      taskData.taskPomodoro
    );
    this.#userInterface.addTasksToBoard(this.#taskManager.getTask(taskId));
  }

  async editTask(taskData) {
    await this.#taskManager.editTask(
      taskData.taskId,
      taskData.taskName,
      taskData.taskDate,
      taskData.taskTime,
      taskData.taskPomodoro
    );
    this.#userInterface.updateTask(this.#taskManager.getTask(taskData.taskId));
  }

  async removeTask(taskId) {
    const task = this.#taskManager.getTask(taskId);
    
    await this.#taskManager.removeTask(taskId);
    this.#userInterface.removeTaskElement(task);
    if (this.#statisticManager.getTaskStatistic(taskId)) this.#userInterface.removeStatisticElement(task);
  }

  async setTaskStatistic() {
    const spentTime = this.#clockManager.getSpentTime();
    if (!spentTime) return;

    const currentTaskId = this.#taskManager.getCurrentTask()?.id;
    const oldStatistic = this.#statisticManager.getTaskStatistic(currentTaskId);

    await this.#statisticManager.sendTaskStatistic({
      spentTime: spentTime,
      taskId: currentTaskId,
    });

    const newStatistic = this.#statisticManager.getTaskStatistic(currentTaskId);

    this.#userInterface.updateTasksSpentPomodoro(newStatistic);
    this.#userInterface[
      oldStatistic ? "updateTaskStatistic" : "addStatisticsToBoard"
    ](newStatistic);

    this.#userInterface.updateOverallTime(
      this.#statisticManager.getOverallMinutes()
    );
  }

  async updateTaskStatistic(taskId) {
    await this.#statisticManager.syncStatistics();

    const taskStatistic = this.#statisticManager.getTaskStatistic(taskId)
    if (!taskStatistic) return;

    this.#userInterface.updateTasksSpentPomodoro(taskStatistic);
    this.#userInterface.updateTaskStatistic(taskStatistic);
  }

  async updateOverallTime() {
    await this.#statisticManager.syncStatistics();
    this.#userInterface.updateOverallTime(
      this.#statisticManager.getOverallMinutes()
    );
  }

  async loginUser(userData) {
    await this.#userManager.loginUser(
      userData.userLogin,
      userData.userPassword
    )
    location.reload();
  }

  async createUser(userData) {
    await this.#userManager.createUser(
      userData.userName,
      userData.userLogin,
      userData.userPassword
    )

    await this.loginUser(userData);
  }

  signOutUser() {
    this.#userManager.signOutUser();

    location.reload();
  }

  async deleteUser() {
    await this.#userManager.deleteUser();
    
    this.signOutUser();
  }

  startTimer() {
    this.#clockManager.startTimer(async () => {
      this.#clockManager.tick();

      if (this.#clockManager.isTimerFinished()) {
        await this.stopClock();
        this.stopCurrentTask();
      }

      this.#userInterface.updateClock(this.#clockManager.getClockInfo());
    });

    this.#userInterface.changeVisibleButtons(this.#clockManager.getClockInfo());
  }

  pauseTimer() {
    this.#clockManager.pauseTimer();

    this.#userInterface.changeVisibleButtons(this.#clockManager.getClockInfo());
  }

  resetTimer() {
    this.#clockManager.clearTimer();
    const clockData = this.#clockManager.getClockInfo();
    this.#userInterface.updateClock(clockData);

    this.#userInterface.changeVisibleButtons(clockData);
  }

  startClock() {
    this.startCurrentTask();
    this.startTimer();
  }

  pauseClock() {
    this.pauseTimer();
  }

  async stopClock() {
    await this.setTaskStatistic();
    this.resetTimer();
    this.stopCurrentTask();
  }

  async init() {
    if (localStorage.getItem("userToken")) {
      await this.#userManager.syncUser();
      this.#userInterface.showUserName();
      this.#userInterface.setLoginedUserMenuItems();
    } else {
      this.#userInterface.hideAddTaskButton();
      this.#userInterface.setUnsignedUserMenuItems();
    }

    await this.#taskManager.syncTasks();
    await this.#statisticManager.syncStatistics();

    const tasks = this.#taskManager.getTasks();
    const clockData = this.#clockManager.getClockInfo();
    const overallMinutes = this.#statisticManager.getOverallMinutes();
    const statistics = this.#statisticManager.getStatistics();

    this.#userInterface.addTasksToBoard(...tasks);
    this.#userInterface.updateTasks(...tasks);
    this.#userInterface.updateClock(clockData);
    this.#userInterface.updateOverallTime(overallMinutes);
    this.#userInterface.updateTasksSpentPomodoro(...statistics.values());
    this.#userInterface.addStatisticsToBoard(...statistics.values());
  }
}

customElements.define("time-formatted", TimeFormatted);
var clock = new Clock();
var clockHand = new ClockHand();
var clockManager = new ClockManager(clock, clockHand);
var apiManager = new APIManager();
var taskManager = new TaskManager(apiManager);
var userManager = new UserManager(apiManager);
var statisticManager = new StatisticManager(apiManager);
var userInterface = new UserInterface();

(async () => {
  var clockApp = new ClockApp(
    clockManager,
    userManager,
    taskManager,
    statisticManager,
    userInterface
  );

  // let response = await userManager.loginUser("sdfsds", "fdsf");
  // let response = await userManager.loginUser("sdfsd", "fdsf");
  // await taskManager.createTask("jfsdfs", "10-10-2010", "10:10");
  // await taskManager.createTask("566575", "10-10-2010", "10:10");

  // await userManager.createUser("needless", "sdfsds", "fdsf");
  // await userManager.createUser("needless1", "sdfsd", "fdsf");
  // userManager.deleteUser()
  // await clockApp.addStatistics(30, 3)
  // await clockApp.addStatistics(30, 3)
  // await clockApp.getStatistics()
  // await clockApp.getOverallTime()
  // await clockApp.removeTask(2)

  await clockApp.init();

})();
