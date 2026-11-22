const required = (name) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const requiredInt = (name) => {
  const value = Number(required(name));
  if (!Number.isInteger(value)) throw new Error(`Environment variable ${name} must be an integer`);
  return value;
};

// Getters so each value is validated when read, with no fallbacks.
module.exports = {
  get port() { return requiredInt('PORT'); },
  db: {
    get host() { return required('DB_HOST'); },
    get port() { return requiredInt('DB_PORT'); },
    get user() { return required('DB_USER'); },
    get password() { return required('DB_PASSWORD'); },
    get database() { return required('DB_NAME'); },
  },
  get jwtSecret() { return required('JWT_SECRET'); },
  get dbConnectRetries() { return requiredInt('DB_CONNECT_RETRIES'); },
  get dbConnectDelayMs() { return requiredInt('DB_CONNECT_DELAY_MS'); },
  seedUsers: {
    get adminUsername() { return required('SEED_ADMIN_USERNAME'); },
    get adminPassword() { return required('SEED_ADMIN_PASSWORD'); },
    get traineeUsername() { return required('SEED_TRAINEE_USERNAME'); },
    get traineePassword() { return required('SEED_TRAINEE_PASSWORD'); },
  },
};
