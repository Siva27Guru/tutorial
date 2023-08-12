const express = require("express");
const app = express(); //Creating Express server instance
const { open } = require("sqlite"); //db connection method from sqlite package
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "cricketTeam.db"); //to get the path of db
app.use(express.json()); //to get json object from request body (e.g.,POST, PUT)

let db = null;

const intializeDbAndServer = async () => {
  try {
    //Db intialize
    db = await open({
      filename: dbPath, //path __dirname lookup for the complete file path
      driver: sqlite3.Database, //gives db connection object(driver from sqlite3 package)
    }); //promise object (db conn obj) by open method

    //Server Intialize: The app starts a server and listens on port 3000 for connections
    app.listen(3000, () => {
      console.log("Server Is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1); //to stop the process after error
  }
};

intializeDbAndServer();

// return a list of all the players from the team
// API 1

const convertDbObject = (objectItem) => {
  return {
    playerId: objectItem.player_id, //col name in db is in snake_case(Qn ref)
    playerName: objectItem.player_name,
    jerseyNumber: objectItem.jersey_number,
    role: objectItem.role, //response object for APIs should be in Camel case
  };
};

app.get("/players/", async (request, response) => {
  const playerDetails = `SELECT * FROM cricket_team`;
  const getPlayersQueryResponse = await db.all(playerDetails);
  response.send(
    getPlayersQueryResponse.map((eachPlayer) => convertDbObject(eachPlayer))
  );
}); //get playerDetails in camel case using convertObject

//returns add a player to the existing list
//API 2

app.post("/players/", async (request, response) => {
  const playerDetail = request.body;
  const { playerName, jerseyNumber, role } = playerDetail;
  const addPlayerQuery = `INSERT INTO 
  cricket_team(player_name, jersey_number, role)
  VALUES
  (
      "${playerName}", "${jerseyNumber}", "${role}"
  );
  `;
  const createdPlayerResponse = await db.run(addPlayerQuery);
  response.send("Player Added to Team");
});

//Returns a player based on a player ID
//API3

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT * FROM cricket_team WHERE
    player_id = "${playerId}";`;
  const playerIdResponse = await db.get(playerQuery);
  response.send(convertDbObject(playerIdResponse));
});

//Updates the details of a player in the team (database) based on the player ID
//API 4

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName, jerseyNumber, role } = request.body;
  const updatePlayerDetailsQuery = `
  UPDATE cricket_team 
  SET
  player_name = '${playerName}' , jersey_number = ${jerseyNumber} , role = '${role}'
  WHERE player_id = ${playerId};`;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//Deletes a player from the team (database) based on the player ID
//API 5

app.delete("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const deletePlayerQuery = `
  DELETE FROM
    cricket_team
  WHERE
    player_id = ${playerId};`;
  await db.run(deletePlayerQuery);
  response.send("Player Removed");
});
