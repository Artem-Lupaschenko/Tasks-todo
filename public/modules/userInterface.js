import {DEFAULT_TASK, LOCALE} from "./globalVariables.js";

export default class UserInterface {
  #sidebar;
  #showSidebarButton;
  #tasksBoard;
  #addTaskButton;
  #popupContainer;
  #closePopupButton;
  #popupContentContainer;
  #popupAlert;
  #currentTaskPanel;
  #clock;
  #clockHand;
  #clockStartButton;
  #clockPauseButton;
  #clockStopButton;
  #overallHours;
  #overallMinutes;
  #statisticsBoard;
  #userName;
  #userButton;
  #userMenu;
  #userMenuList;

  static #POPUP_CONTENT = {
    ADD_TASK: Symbol("addTask"),
    EDIT_TASK: Symbol("editTask"),
    REGISTER_USER: Symbol("registerUser"),
    LOGIN_USER: Symbol("loginUser"),
    EDIT_USER: Symbol("editUser"),
    DELETE_USER: Symbol("deleteUser"),
  };

  constructor() {
    this.#sidebar = document.querySelector(".sidebar");
    this.#showSidebarButton = document.getElementById("show-sidebar-btn");
    this.#tasksBoard = document.getElementById("tasks-board");
    this.#addTaskButton = document.getElementById("add-task-btn");
    this.#popupContainer = document.querySelector(".popup-container");
    this.#closePopupButton = document.querySelector(".close-popup-btn");
    this.#popupContentContainer = document.querySelector(
      ".popup-content-container"
    );
    this.#popupAlert = document.querySelector(".popup-alert");
    this.#currentTaskPanel = document.querySelector(".current-task-panel");
    this.#clock = document.getElementById("clock");
    this.#clockHand = document.getElementById("clock-hand");
    this.#clockStartButton = document.querySelector(".start-btn.clock-btn");
    this.#clockPauseButton = document.querySelector(".pause-btn.clock-btn");
    this.#clockStopButton = document.querySelector(".stop-btn.clock-btn");
    this.#overallHours = document.querySelector(".overall-hours");
    this.#overallMinutes = document.querySelector(".overall-minutes");
    this.#statisticsBoard = document.getElementById("statistics-board");
    this.#userName = document.querySelector(".user-name");
    this.#userButton = document.querySelector(".user-btn");
    this.#userMenu = document.querySelector(".user-menu");
    this.#userMenuList = document.querySelector(".user-menu-list");

    this.#showSidebarButton.onclick = () => {
      this.changeSidebarVisibility();
    };

    this.#closePopupButton.onclick = () => {
      this.#popupContainer.style.display = "none";
    };
  }

  showElement(element, displayValue = "initial") {
    element.style.display = displayValue;
  }

  hideElement(element) {
    element.style.display = "none";
  }

  static getPopupContent() {
    return UserInterface.#POPUP_CONTENT;
  }

  #setPopupSubmitEvent(formName, callback) {
    const form = this.getPopupForm(formName);
    form.onsubmit = async (event) => {
      event.preventDefault();
      try {
        await callback(form.elements);
        this.hidePopup();
      } catch (error) {
        this.showPopupAlert(error.message);
      }
    };
  }

  #setConfirmPopupSubmitEvent(formName, callback) {
    const form = this.getPopupForm(formName);
    form.onsubmit = (event) => {
      event.preventDefault();

      if (event.submitter.dataset.confirmed === "yes") {
        callback();
      }

      this.hidePopup();
    };
  }

  #addTasksBoardEvent(elementClass, callback) {
    this.#tasksBoard.addEventListener("click", (event) => {
      if (!event.target.classList.contains(elementClass)) return;
      const taskId = Number(event.target.closest("li").id);
      callback(taskId);
    });
  }

  #addUserMenuEvent(elementClass, callback) {
    this.#userMenu.addEventListener("click", (event) => {
      if (!event.target.classList.contains(elementClass)) return;
      callback();
    });
  }

  setTaskStartButtonEvent(callback) {
    this.#addTasksBoardEvent("start-btn", callback);
  }

  setTaskDoneButtonEvent(callback) {
    this.#addTasksBoardEvent("checkbox", callback);
  }

  setAddTaskButtonEvent(callback) {
    this.#addTaskButton.onclick = () => {
      callback();
    };
  }

  setTaskRemoveButtonEvent(callback) {
    this.#addTasksBoardEvent("remove-btn", callback);
  }

  setEditTaskButtonEvent(callback) {
    this.#addTasksBoardEvent("edit-btn", (taskId) => {
      callback(taskId);
    });
  }

  setUserButtonEvent(callback) {
    document.addEventListener("click", (event) => {
      if (event.target === this.#userButton) {
        callback();
      } else {
        this.hideUserMenu();
      }
    });
  }

  setUserRegisterButtonEvent(callback) {
    this.#addUserMenuEvent("register-user-btn", () => {
      callback();
    });
  }

  setUserLoginButtonEvent(callback) {
    this.#addUserMenuEvent("login-user-btn", () => {
      callback();
    });
  }

  setUserEditButtonEvent(callback) {
    this.#addUserMenuEvent("edit-user-btn", () => {
      callback();
    });
  }

  setUserSignOutButtonEvent(callback) {
    this.#addUserMenuEvent("sign-out-user-btn", () => {
      callback();
    });
  }

  setUserDeleteButtonEvent(callback) {
    this.#addUserMenuEvent("delete-user-btn", () => {
      callback();
    });
  }

  setClockStartButtonEvent(callback) {
    this.#clockStartButton.onclick = () => {
      callback();
    };
  }

  setClockPauseButtonEvent(callback) {
    this.#clockPauseButton.onclick = () => {
      callback();
    };
  }

  setClockStopButtonEvent(callback) {
    this.#clockStopButton.onclick = () => {
      callback();
    };
  }

  showUserMenu() {
    this.showElement(this.#userMenu);
  }

  hideUserMenu() {
    this.hideElement(this.#userMenu);
  }

  showUserName() {
    this.#userName.textContent = localStorage.getItem("userName");
  }

  showAddTaskButton() {
    this.showElement(this.#addTaskButton);
  }

  hideAddTaskButton() {
    this.hideElement(this.#addTaskButton);
  }

  showPopup(popup) {
    this.showElement(popup, "block");
  }

  hidePopup() {
    this.hideElement(this.#popupContainer);
  }

  changeSidebarVisibility() {
    this.#sidebar.classList.toggle("hidden-sidebar");

    function changeButtonArrow() {
      this.#showSidebarButton.textContent = !this.#sidebar.classList.contains(
        "hidden-sidebar"
      )
        ? ">"
        : "<";
      this.#sidebar.removeEventListener(
        "transitionend",
        boundChangeButtonArrow
      );
    }

    const boundChangeButtonArrow = changeButtonArrow.bind(this);
    this.#sidebar.addEventListener("transitionend", boundChangeButtonArrow);
  }

  showPopupAlert(message) {
    this.#popupAlert.textContent = message;
    this.showElement(this.#popupAlert, "block");
  }

  hidePopupAlert() {
    this.hideElement(this.#popupAlert);
  }

  showTaskPopup(taskId, popupSubmitCallback) {
    this.hidePopupAlert();
    this.showPopup(this.#popupContainer);

    this.#setPopupSubmitEvent("task-form", async (elements) => {
      await popupSubmitCallback({
        taskId: taskId,
        taskName: elements["task-name"]?.value,
        taskDate: elements["task-date"]?.value,
        taskTime: elements["task-time"]?.value,
        taskPomodoro: elements["task-pomodoro"]?.value,
      });
    });
  }

  showRegisterUserPopup(popupSubmitCallback) {
    this.hidePopupAlert();
    this.showPopup(this.#popupContainer);

    this.#setPopupSubmitEvent("register-user-form", async (elements) => {
      await popupSubmitCallback({
        userName: elements["user-name"]?.value,
        userLogin: elements["user-login"]?.value,
        userPassword: elements["user-password"]?.value,
      });
    });
  }

  showLoginUserPopup(popupSubmitCallback) {
    this.hidePopupAlert();
    this.showPopup(this.#popupContainer);

    this.#setPopupSubmitEvent("login-user-form", async (elements) => {
      await popupSubmitCallback({
        userLogin: elements["user-login"]?.value,
        userPassword: elements["user-password"]?.value,
      });
    });
  }

  showEditUserPopup(
    editUserDataSubmitCallback,
    editUserLoginSubmitCallback,
    editUserPasswordSubmitCallback
  ) {
    this.hidePopupAlert();
    this.showPopup(this.#popupContainer);

    this.#setPopupSubmitEvent("edit-user-data-form", async (elements) => {
      await editUserDataSubmitCallback({
        userName: elements["user-name"]?.value,
      });
    });

    this.#setPopupSubmitEvent("edit-user-login-form", async (elements) => {
      await editUserLoginSubmitCallback({
        userLogin: elements["user-login"]?.value,
      });
    });

    this.#setPopupSubmitEvent("edit-user-password-form", async (elements) => {
      await editUserPasswordSubmitCallback({
        userOldPassword: elements["user-old-password"]?.value,
        userNewPassword: elements["user-new-password"]?.value,
      });
    });
  }

  showDeleteUserPopup(popupSubmitCallback) {
    this.hidePopupAlert();
    this.showPopup(this.#popupContainer);

    this.#setConfirmPopupSubmitEvent("delete-user-form", async () => {
      await popupSubmitCallback();
    });
  }

  #createDOMElement(description) {
    const element = document.createElement(description.tagName);
    element.className = description.className ?? "";
    element.textContent = description.textContent ?? "";
    
    if (description.id) element.id = description.id;
    if (description.innerHTML) element.innerHTML = description.innerHTML;

    if (description.eventListener) {
      element.addEventListener(
        description.eventListener.type,
        description.eventListener.callback
      );
    }

    if (description.subElements) {
      for (let subElement of description.subElements) {
        element.append(this.#createDOMElement(subElement));
      }
    }

    return element;
  }

  addUserMenuItem(description) {
    const item = this.#createDOMElement({
      tagName: "li",
      className: "user-menu-item",
      subElements: [
        {
          tagName: "button",
          className: description.className,
          textContent: description.textContent,
        },
      ],
    });

    this.#userMenuList.append(item);
  }

  setUnsignedUserMenuItems() {
    this.addUserMenuItem({
      className: "login-user-btn btn",
      textContent: "Увійти",
    });
    this.addUserMenuItem({
      className: "register-user-btn btn",
      textContent: "Зареєструватися",
    });
  }

  setLoginedUserMenuItems() {
    this.addUserMenuItem({
      className: "edit-user-btn btn",
      textContent: "Змінити дані",
    });
    this.addUserMenuItem({
      className: "delete-user-btn btn",
      textContent: "Видалити профіль",
    });
    this.addUserMenuItem({
      className: "sign-out-user-btn btn",
      textContent: "Вийти",
    });
  }

  setPopupContent(type) {
    let content;

    switch (type) {
      case UserInterface.getPopupContent().ADD_TASK:
        content = `<h2>Створити задачу</h2>
                  <form name="task-form">
                    <label>
                      Назва задачі
                      <input type="text" name="task-name">
                    </label>
                    <label>
                      Кількість помодоро
                      <input type="number" name="task-pomodoro" min="0">
                    </label>
                    <label>
                      Дата виконання
                      <input type="date" name="task-date" min="${new Date(
                        Date.now()
                      ).toLocaleDateString("en-CA")}">
                    </label>
                    <label>
                      Час виконання
                      <input type="time" name="task-time">
                    </label>
                    <button class="task-popup-btn popup-btn btn">Створити</button>
                  </form>`;
        break;
      case UserInterface.getPopupContent().EDIT_TASK:
        content = `<h2>Змінити задачу</h2>
                  <form name="task-form">
                    <label>
                      Нова назва задачі
                      <input type="text" name="task-name">
                    </label>
                    <label>
                      Нова кількість помодоро
                      <input type="number" name="task-pomodoro" min="0">
                    </label>
                    <label>
                      Нова дата виконання
                      <input type="date" name="task-date" min="${new Date(
                        Date.now()
                      ).toLocaleDateString("en-CA")}">
                    </label>
                    <label>
                      Новий час виконання
                      <input type="time" name="task-time">
                    </label>
                    <button class="task-popup-btn popup-btn btn">Змінити</button>
                  </form>`;
        break;
      case UserInterface.getPopupContent().REGISTER_USER:
        content = `<h2>Зареєструватись</h2>
                  <form name="register-user-form" autocomplete="off">
                    <label>
                      Ім'я
                      <input type="text" name="user-name" onfocus="this.removeAttribute('readonly');" readonly>
                    </label>
                    <label>
                      Логін
                      <input type="email" name="user-login" onfocus="this.removeAttribute('readonly');" readonly>
                    </label>
                    <label>
                      Пароль
                      <input type="password" name="user-password" onfocus="this.removeAttribute('readonly');" readonly>
                    </label>
                    <button class="user-popup-btn popup-btn btn">Зареєструватися</button>
                  </form>`;
        break;
      case UserInterface.getPopupContent().LOGIN_USER:
        content = `<h2>Увійти</h2>
                  <form name="login-user-form">
                    <label>
                      Логін
                      <input type="email" name="user-login">
                    </label>
                    <label>
                      Пароль
                      <input type="password" id="user-password">
                    </label>
                    <button class="user-popup-btn popup-btn btn">Увійти</button>
                  </form>`;
        break;
      case UserInterface.getPopupContent().EDIT_USER:
        content = `<h2>Змінити дані користувача</h2>
                    <form name="edit-user-data-form" autocomplete="off">
                      <label>
                          Ім'я
                          <input type="text" name="user-name">
                      </label>
                      <button class="user-popup-btn popup-btn btn">Змінити дані</button>
                    </form>
                    <form name="edit-user-login-form" autocomplete="off">
                      <label>
                        Логін
                        <input type="email" name="user-login">
                      </label>
                      <button class="user-popup-btn popup-btn btn">Змінити логін</button>
                    </form>
                    <form name="edit-user-password-form" autocomplete="off">
                      <label>
                        Старий пароль
                        <input type="password" name="user-old-password" autocomplete="off" required>
                      </label>
                      <label>
                        Новий пароль
                        <input type="password" name="user-new-password" autocomplete="new-password">
                      </label>
                      <button class="user-popup-btn popup-btn btn">Змінити пароль</button>
                    </form>`;
        break;
      case UserInterface.getPopupContent().DELETE_USER:
        content = `<h2>Видалити профіль?</h2>
                  <form name="delete-user-form">
                    <button class="user-popup-btn popup-btn btn" data-confirmed="no">Ні</button>
                    <button class="user-popup-btn popup-btn btn" data-confirmed="yes">Так</button>
                  </form>`;
        break;
    }
    this.#popupContentContainer.innerHTML = content;
  }

  getPopupForm(formName) {
    return document.forms[formName];
  }

  fillTaskPopupInputs(taskName, taskPomodoro, taskDate, taskTime) {
    const elements = this.getPopupForm("task-form").elements;

    elements["task-name"].value = taskName;
    elements["task-pomodoro"].value = taskPomodoro;
    elements["task-date"].value = taskDate;
    elements["task-time"].value = taskTime;
  }

  changeVisibleButtons(data) {
    this[data.isPaused || data.isStopped ? "showElement" : "hideElement"](
      this.#clockStartButton
    );
    this[data.isGoing ? "showElement" : "hideElement"](this.#clockPauseButton);
    this[data.isPaused ? "showElement" : "hideElement"](this.#clockStopButton);
  }

  moveClockHand(angle) {
    this.#clockHand.style.transform = `rotate(${angle}deg)`;
  }

  updateClock(data) {
    this.#clock.setAttribute("datetime", data.date);
    this.moveClockHand(data.clockHandAngle);
  }

  updateOverallTime(overallMinutes) {
    const time = this.getComputedTime(overallMinutes);

    this.#overallHours.textContent = time.hours;
    this.#overallMinutes.textContent = time.minutes;
  }

  clearCurrentTask() {
    this.#currentTaskPanel.querySelector(".current-task")?.remove();
  }

  setCurrentTask(task) {
    this.clearCurrentTask();
    let element = this.#createDOMElement({
      tagName: "div",
      className: "current-task task",
      subElements: [
        {
          tagName: "div",
          className: "control-panel",
          innerHTML: `<label class="checkbox sidebar-btn btn" for="done-btn-${task.id}"></label>`
        },
        {
          tagName: "div",
          className: "task-info",
          subElements: [
            {
              tagName: "span",
              className: "task-name",
              textContent: task.name
            },
            {
              tagName: "div",
              className: "task-pomodoro",
              subElements: [
                {
                  tagName: "span",
                  className: "setted-pomodoro"
                }
              ]
            }
          ]
        }
      ]
    })

    this.#currentTaskPanel.prepend(element);
  }

  startTask(task) {
    this.#currentTaskPanel.querySelector(".task-pomodoro")?.classList.add("going-pomodoro");
    this.updateTask(task);
  }

  stopTask(task) {
    this.#currentTaskPanel.querySelector(".task-pomodoro")?.classList.remove("going-pomodoro");
    this.updateTask(task);
  }

  updateTask(task) {
    if (!task) return;

    const element = document.getElementById(task.id);

    element
      .querySelector(".start-btn")
      [task.isDone ? "removeAttribute" : "setAttribute"](
        "for",
        "clock-start-btn"
      );
    element.querySelector(".task-name").textContent = task.name;
    element.querySelector(".task-date").textContent = this.getFormattedDate(
      task.date,
      task.time
    );

    element.querySelector(".setted-pomodoro").textContent = task.pomodoro;
    element.classList[task.isDone ? "add" : "remove"]("done");
    element.classList[task.isGoing ? "add" : "remove"]("going");

    if (task.isDone) this.#tasksBoard.append(element);
  }

  updateTasks(...tasks) {
    if (!tasks) return;
    const mapTaskToDOM = tasks.reduce(
      (accumulator, current) => ({
        ...accumulator,
        [current.id]: [current, document.getElementById(current.id)],
      }),
      {}
    );

    const changeTasksList = ({ element, selectorAction, isDone, isGoing }) => {
      element.classList[isDone ? "add" : "remove"]("done");
      element.classList[isGoing ? "add" : "remove"]("going");
    };

    for (const [task, element] of Object.values(mapTaskToDOM)) {
      changeTasksList({
        element,
        isDone: task.isDone,
        isGoing: task.isGoing,
      });

      if (task.isDone) this.#tasksBoard.append(element);
    }
  }

  createTaskElement(task) {
    let element = this.#createDOMElement({
      tagName: "li",
      id: task.id,
      className: "task",
      subElements: [
        {
          tagName: "div",
          className: "control-panel",
          subElements: [
            {
              tagName: "button",
              id: `done-btn-${task.id}`,
              className: "checkbox sidebar-btn btn",
            },
            {
              tagName: "button",
              className: "start-btn sidebar-btn btn",
            },
          ],
        },
        {
          tagName: "div",
          className: "task-info",
          subElements: [
            {
              tagName: "span",
              className: "task-name",
              textContent: task.name,
            },
            {
              tagName: "div",
              className: "task-pomodoro",
              innerHTML: `<span class="spent-pomodoro">0</span>/<span class="setted-pomodoro">${task.pomodoro}</span>`
            },
            {
              tagName: "span",
              className: "task-date",
              textContent: this.getFormattedDate(task.date, task.time),
            },
          ],
        },
        {
          tagName: "div",
          className: "edit-panel",
          subElements: [
            {
              tagName: "button",
              className: "edit-btn sidebar-btn btn",
            },
            {
              tagName: "button",
              className: "remove-btn sidebar-btn btn",
            },
          ],
        },
      ],
    });

    return element;
  }

  removeTaskElement(task) {
    const element = document.getElementById(task.id);
    element.remove();
  }

  updateTasksSpentPomodoro(...statistics) {
    for (const statistic of statistics) {
      if (!statistic.taskId) continue;
      
      const element = document.getElementById(statistic.taskId);
      const spentPomodoroElement = element.querySelector(".spent-pomodoro");
      const settedPomodoroElement = element.querySelector(".setted-pomodoro");
      const taskPomodoroElement = settedPomodoroElement.closest(".task-pomodoro");

      if(statistic.spentPomodoro >= Number(settedPomodoroElement.textContent)) {
        taskPomodoroElement.classList.add("done-pomodoro");
      } else {
        taskPomodoroElement.classList.remove("done-pomodoro");
      }

      spentPomodoroElement.textContent = `${statistic.spentPomodoro}`
    }
  }

  getFormattedDate(dateString, timeString) {
    const date = new Date(Date.parse(`${dateString}T${timeString}:00`));
    const formatter = new Intl.DateTimeFormat(LOCALE, {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return formatter.format(date);
  }

  getComputedTime(spentTime) {
    let hours = 0;
    let minutes = spentTime;

    if (minutes >= 60) {
      hours += Math.floor(minutes / 60);
      minutes = minutes % 60;
    }

    return { hours, minutes };
  }

  updateTaskStatistic(data) {
    const element = document.getElementById(`statistic-${data.taskId}`);
    const taskName = element.querySelector(".task-name");
    const hoursElement = element.querySelector(".overall-hours");
    const minutesElement = element.querySelector(".overall-minutes");

    const time = this.getComputedTime(data.spentTime);
    
    taskName.textContent = data.taskName;
    hoursElement.textContent = time.hours;
    minutesElement.textContent = time.minutes;
  }

  createStatisticElement(data) {
    const time = this.getComputedTime(data.spentTime);

    let element = this.#createDOMElement({
      tagName: "li",
      id: `statistic-${data.taskId}`,
      className: "task",
      subElements: [
        {
          tagName: "div",
          className: "task-info",
          subElements: [
            {
              tagName: "span",
              className: "task-name",
              textContent: data.taskName,
            }
          ],
        },
        {
          tagName: "div",
          className: "task-time",
          innerHTML: `<span class="overall-hours">${time.hours}</span>г 
                      <span class="overall-minutes">${time.minutes}</span>хв`
        },
      ],
    })

    return element;
  }

  removeStatisticElement(task) {
    const element = document.getElementById(`statistic-${task.id}`);
    element.remove();
  }

  addStatisticsToBoard(...statistics) {
    for (const statistic of statistics) {
      this.#statisticsBoard.prepend(this.createStatisticElement(statistic));
    }
  }

  addTasksToBoard(...tasks) {
    for (const task of tasks) {
      this.#tasksBoard.prepend(this.createTaskElement(task));
    }
  }
}
