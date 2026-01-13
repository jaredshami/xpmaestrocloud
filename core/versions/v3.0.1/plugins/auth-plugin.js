// Authentication plugin v2.0
class AuthPlugin {
  authenticate(creds) { return true; }
  logout() { return true; }
}
module.exports = AuthPlugin;
