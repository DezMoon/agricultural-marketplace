const express = require('express');
const app = express();
const port = 3000;
const produceRoutes = require('./routes/produce');
const cors = require('cors'); // Import the cors middleware

// Middleware to enable CORS (for local development)
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

app.use('/api/produce', produceRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
