module.exports = {
  // App Settings
  MONGO_URI: 'mongodb://' + (process.env.MONGO_URI || 'localhost') + '/snail',
  TOKEN_SECRET: process.env.TOKEN_SECRET || 'YOUR_UNIQUE_JWT_TOKEN_SECRET',
  FACEBOOK_SECRET: process.env.FACEBOOK_SECRET || 'e38ce723519a097e6f3c92e844a5f9d3',
};
