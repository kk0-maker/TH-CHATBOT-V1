const express = require('express');
const path = require('path');
const assistant = require('./api/assistant');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to handle assistant messages
app.post('/send_message', assistant.handleMessage);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});