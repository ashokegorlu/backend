const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "database.db");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = 3000;

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}`);
    });
    await db
      .run(
        `
      CREATE TABLE IF NOT EXISTS USER (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(250) NOT NULL,
        email VARCHAR(250) NOT NULL,
        password VARCHAR(200) NOT NULL
    )`
      )
      .then(() => console.log("connected to db"))
      .catch((error) => console.log("error creating table"));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `INSERT INTO USER (username, email, password) 
    VALUES (?, ?, ?)`;
  const values = [username, email, hashedPassword];

  const selectedUser = `SELECT * FROM USER WHERE username = ?`;
  const isExists = await db.get(selectedUser, [username]);

  if (isExists?.username === username) {
    res.status(409).json({ message: "User already exists" });
  } else {
    try {
      const response = await db.run(userQuery, values);
      const token = jwt.sign(username, "SECRET");
      res.status(201).json({ message: "User created", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating user" });
    }
  }
});

app.get("/users", async (req, res) => {
  const query = `select * from user`;
  const response = await db.all(query);
  res.json(response);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const loginQuery = `SELECT * FROM user WHERE email = ?`;
  const response = await db.get(loginQuery, [email]);

  if (response && response.email === email) {
    const isMatched = await bcrypt.compare(password, response.password);
    if (isMatched) {
      const token = jwt.sign({ email }, "SECRET");
      res.status(200).json({ message: "Login Successful", token });
    } else {
      res.status(400).json({ message: "Invalid Password" });
    }
  } else {
    res.status(404).json({ message: "No User Found" });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "server running" });
});
