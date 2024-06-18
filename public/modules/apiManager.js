import {BASE_URL} from './globalVariables.js'

class BaseAPIManager {
  #baseUrl

  constructor(baseUrl) {
    this.#baseUrl = baseUrl;
  }

  async _request(endpoint, method, body = undefined) {
    const response = await fetch(this.#baseUrl + endpoint, {
      method: method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      },
      body: body,
    });

    if (response.ok === true) {
      return await response.json();
    } else {
      const error = await response.json();
      throw error;
    }
  }
}

export default class APIManager extends BaseAPIManager {
  constructor() {
    super(BASE_URL);
  }

  async createTask(name, date, time, pomodoro) {
    return await this._request(
      "/api/tasks",
      "POST",
      JSON.stringify({
        name: name,
        date: date,
        time: time,
        pomodoro: pomodoro,
        done: false,
      })
    );
  }

  async removeTask(id) {
    return await this._request(`/api/tasks/${id}`, "DELETE");
  }

  async syncTasks() {
    return await this._request("/api/tasks", "GET");
  }

  async updateTask(id, name, date, time, pomodoro, isDone) {
    return await this._request(
      "/api/tasks",
      "PUT",
      JSON.stringify({
        id: id,
        name: name,
        date: date,
        time: time,
        pomodoro: pomodoro,
        done: isDone,
      })
    );
  }

  async removeTasks() {
    return this._request("/api/tasks", "DELETE");
  }

  async syncUser() {
    return this._request("/api/users/", "GET");
  }

  async createUser(username, login, password, role) {
    return this._request(
      "/api/users/register",
      "POST",
      JSON.stringify({
        username: username,
        login: login,
        password: password,
        role: role,
      })
    );
  }

  async editUserData(username) {
    return this._request(
      "/api/users/",
      "PUT",
      JSON.stringify({
        username: username
      })
    );
  }

  async editUserLogin(login) {
    return this._request(
      "/api/users/change-login",
      "PUT",
      JSON.stringify({
        login: login
      })
    );
  }

  async editUserPassword(oldPassword, newPassword) {
    return this._request(
      "/api/users/change-password",
      "PUT",
      JSON.stringify({
        oldPassword: oldPassword,
        newPassword: newPassword
      })
    );
  }

  async loginUser(login, password) {
    return this._request(
      "/api/users/login",
      "POST",
      JSON.stringify({
        login: login,
        password: password,
      })
    );
  }

  async deleteUser() {
    return this._request("/api/users/", "DELETE");
  }

  async syncStatistics() {
    return this._request("/api/statistics/", "GET");
  }

  async sendTaskStatistic(data) {
    return this._request(
      "/api/statistics/",
      "POST",
      JSON.stringify({
        spentTime: data.spentTime,
        taskId: data.taskId,
      })
    );
  }
}