require('dotenv').config();
const keys = require('./config/keys');
const app = require('./app');

app.listen(keys.PORT, () => {
  console.log('Listening on port ', keys.PORT);
});

module.exports = app;
