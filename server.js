const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'your-secret-key', // Store securely in .env for production
  resave: false,
  saveUninitialized: true
}));

// In-memory "user database" with updated hash for "Rovel"
const users = {
  "Owner": { password: "$2b$10$UeiFzUyOMj2EXoAvWBhP8OiiR74peSBxKrQTOOeF2RMZMMrAMJBDa", role: "admin" }, // Rovel
  "User": { password: "$2b$10$2PfqvGiD7Vs.CTzES8Bz1l9oj/z7QFg7BwZz7HkpP0ZTdbwKklYFa", role: "user" }, // 1Test1
  "User1": { password: "$2b$10$Z0HF4EuHPkWmEgTcEn7HuAlxhHqNN25FUkV09BdD5/e8Z8qT67sEC", role: "user" } // GiveMeYourThoughts
};


// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (users[username]) {
    return res.status(400).send('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users[username] = { password: hashedPassword, role: "user" };
  res.send('User created');
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users[username];
  if (!user) return res.status(404).send('User not found');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).send('Invalid credentials');

  req.session.user = username;
  req.session.role = user.role;
  res.send({ message: 'Logged in', role: user.role });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Logout failed');
    res.send('Logged out');
  });
});

// Serve static files from the project root
app.use(express.static(path.join(__dirname)));

// Default route serving home.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
