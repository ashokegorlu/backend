const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require('cors')

const dbPath = path.join(__dirname, "database.db");
const app = express();
app.use(cors())
app.use(express.json())

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
      
    });
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

app.get("/",authenticateToken, async (request, response) => {
  const getusersQuery = `
    SELECT
      *
    FROM
      users`;
  const usersArray = await db.all(getBooksQuery);
  response.send(usersArray);
});

app.post("/users/",authenticateToken, async (request, response) => {
  const {
    name,email,password
  } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE name = '${name}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        users ( name, password,email) 
      VALUES 
        ( 
          '${name}',
          '${hashedPassword}', 
          '${email}',
        )`;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send(`Created new user with ${newUserId}`);
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});


app.post("/login",authenticateToken, async (request, response) => {
  const { name, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE name = '${name}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        name: name,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

app.put("/updatauser",authenticateToken, async (request, response) => {
  const { bookId } = request.params;
  const bookDetails = request.body;
  const {
    name,email,password
  } = bookDetails;
  const updateBookQuery = `
    UPDATE
      users
    SET
      name='${name}',
      email=${email},
      password=${password},
    WHERE
      id = ${id};`;
  await db.run(updateBookQuery);
  response.send("Book Updated Successfully");
});

app.delete("/deleteuser",authenticateToken, async (request, response) => {
  const { id } = request.params;
  const deleteBookQuery = `
    DELETE FROM
      users
    WHERE
      id = ${id};`;
  await db.run(deleteBookQuery);
  response.send("Book Deleted Successfully");
});