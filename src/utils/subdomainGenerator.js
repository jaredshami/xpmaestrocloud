/**
 * Generate random subdomain identifiers
 */
const generateCustomerId = () => {
  // Generate random 6-digit customer ID
  return Math.floor(Math.random() * 900000) + 100000;
};

const generateInstanceId = () => {
  // Generate random 6-digit instance ID
  return Math.floor(Math.random() * 900000) + 100000;
};

const generateSubdomain = (customerId, instanceId, environment = 'prod') => {
  return `c${customerId}-i${instanceId}-${environment}.${process.env.MAIN_DOMAIN}`;
};

const generateFolderPath = (customerId, instanceId, environment = 'prod') => {
  return `client-${customerId}/${environment}-${instanceId}`;
};

module.exports = {
  generateCustomerId,
  generateInstanceId,
  generateSubdomain,
  generateFolderPath,
};
