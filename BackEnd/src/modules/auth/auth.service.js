const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const environmentConfig = require('../../config/env');
const AppError = require('../../shared/errors/AppError');
const authRepository = require('./auth.repository');

function buildAuthenticationResponse(userRecord) {
  return {
    id: userRecord.id,
    role: userRecord.rol,
    hospitalId: userRecord.hospital_id,
    insuranceCompanyId: userRecord.aseguradora_id,
    username: userRecord.username,
    email: userRecord.email,
    fullName: userRecord.nombre_completo,
    status: userRecord.estado
  };
}

async function loginUser(usernameOrEmail, password) {
  const userRecord = await authRepository.findUserByUsernameOrEmail(usernameOrEmail);

  if (!userRecord) {
    throw new AppError('Invalid credentials', 401);
  }

  if (userRecord.estado !== 'activo') {
    throw new AppError('User is not active', 403);
  }

  const passwordMatches = await bcrypt.compare(password, userRecord.password_hash);

  if (!passwordMatches) {
    throw new AppError('Invalid credentials', 401);
  }

  await authRepository.updateLastAccessAt(userRecord.id);

  const authenticationToken = jwt.sign(
    {
      role: userRecord.rol,
      hospitalId: userRecord.hospital_id,
      insuranceCompanyId: userRecord.aseguradora_id
    },
    environmentConfig.jwtSecret,
    {
      subject: userRecord.id,
      expiresIn: environmentConfig.jwtExpiresIn
    }
  );

  return {
    token: authenticationToken,
    user: buildAuthenticationResponse(userRecord)
  };
}

async function getAuthenticatedUserProfile(userId) {
  const userRecord = await authRepository.findUserById(userId);

  if (!userRecord) {
    throw new AppError('Authenticated user not found', 404);
  }

  return buildAuthenticationResponse(userRecord);
}

module.exports = {
  loginUser,
  getAuthenticatedUserProfile
};
