const app = require('./app');

const port = process.env.API_PORT || 3333;

console.log(`Server running: ${port}`);

app.listen(port);