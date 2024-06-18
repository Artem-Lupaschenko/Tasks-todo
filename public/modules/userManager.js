export default class UserManager {
  #apiManager;

  constructor(apiManager) {
    this.#apiManager = apiManager;
  }

  async syncUser() {
    const userData = await this.#apiManager.syncUser();
    localStorage.setItem("userName", userData.username);
  }

  async createUser(username, login, password, role = "user") {
    const userData = await this.#apiManager.createUser(
      username,
      login,
      password,
      role
    );
    return userData;
  }

  async editUserData(username) {
    const userData = await this.#apiManager.editUserData(
      username
    );
    return userData;
  }

  async editUserLogin(login) {
    const userData = await this.#apiManager.editUserLogin(
      login
    );
    return userData;
  }

  async editUserPassword(oldPassword, newPassword) {
    const userData = await this.#apiManager.editUserPassword(
      oldPassword,
      newPassword
    );
    return userData;
  }


  async loginUser(login, password) {
    const userData = await this.#apiManager.loginUser(login, password);
    localStorage.setItem("userToken", userData.access_token);
    return userData;
  }

  signOutUser() {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
  }

  async deleteUser() {
    const userData = await this.#apiManager.deleteUser();
    return userData;
  }
}