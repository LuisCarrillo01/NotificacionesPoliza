const authService = require('./auth.service');

async function login(request, response) {
  const { usernameOrEmail, password } = request.body;
  const authenticationResult = await authService.loginUser(usernameOrEmail, password);

  response.status(200).json(authenticationResult);
}

async function getAuthenticatedUser(request, response) {
  const authenticatedUserProfile = await authService.getAuthenticatedUserProfile(
    request.authenticatedUser.id
  );

  response.status(200).json(authenticatedUserProfile);
}

module.exports = {
  login,
  getAuthenticatedUser
};
