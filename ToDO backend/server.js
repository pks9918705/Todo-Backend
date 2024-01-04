const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const secretKey = 'pk2103'; // Replace with your actual secret key
const port = 3000;

const app = express();
app.use(express.json());

// Dummy user for authentication (replace with your actual user data)
const users = [
    { id: 1, username: 'john_doe', password: 'password123' }
];

mongoose.connect('mongodb://localhost:27017/notesdb', { useNewUrlParser: true, useUnifiedTopology: true });

// Define the schema for a note in MongoDB
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create a model based on the schema
const Note = mongoose.model('Note', noteSchema);

// Middleware for JWT Verification
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Protected Route: Requires a valid JWT for access
app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route!', user: req.user });
});

// API Endpoints with Authentication

// Endpoint for user login and generating a JWT
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if user credentials are valid by finding a user in the 'users' array
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate a JWT with user information and send it as a response upon successful authentication
  const token = jwt.sign({ userId: user.id, username: user.username }, secretKey);
  res.json({ token });
});

// Protected CRUD Endpoints

// Endpoint for creating a new note
app.post('/notes', verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNote = new Note({ title, content });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint for retrieving all notes
app.get('/notes', verifyToken, async (req, res) => {
  try {
    const notes = await Note.find();
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for retrieving a specific note by ID
app.get('/notes/:id', verifyToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
    } else {
      res.status(200).json(note);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for updating a note by ID
app.put('/notes/:id', verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedNote) {
      res.status(404).json({ error: 'Note not found' });
    } else {
      res.status(200).json(updatedNote);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint for deleting a note by ID
app.delete('/notes/:id', verifyToken, async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) {
      res.status(404).json({ error: 'Note not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
