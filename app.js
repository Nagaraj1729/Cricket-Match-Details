const express = require("express")
const {open} = require("sqlite")
const sqlite3 = require("sqlite3")
const path = require("path")
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());


let db = null;
const initializeDBAndServer = async ()=> {
    try{
        db = await open({
            filename : dbPath,
            driver : sqlite3.Database
        });

        app.listen(3000, ()=> {
            console.log("Server is running at http://localhost:3000/");
        });
    }catch(e){
        console.log(`DB Error - ${e.message}`);
        process.exit(1);
    };
};

initializeDBAndServer();

const convertPlayerDataToCamelCase = (playerObj)=>{
    return {
        playerId : playerObj.player_id,
        playerName : playerObj.player_name
    };
};

const convertMatchDetailsToCamelCase = (matchObj)=>{
    return {
        matchId : matchObj.match_id,
        match : matchObj.match,
        year : matchObj.year
    };
};


// Get Players data API
app.get("/players/", async (request, response)=>{
    const getAllPlayersDataQuery = 
        `
            SELECT
                *
            FROM
                player_details
        `
    const dbResponse = await db.all(getAllPlayersDataQuery);
    const playersData = dbResponse.map(player => convertPlayerDataToCamelCase(player));
    response.send(playersData);
});


// Get Players data API
app.get("/players/:playerId/", async (request, response)=>{
    const {playerId} = request.params;    
    const getPlayerDataByIdQuery = 
        `
            SELECT
                *
            FROM
                player_details
            WHERE
                player_id = ${playerId}
        `
    const dbResponse = await db.get(getPlayerDataByIdQuery);
    const playerDetails = convertPlayerDataToCamelCase(dbResponse);
    response.send(playerDetails);
});

// Update Player details API
app.put("/players/:playerId/", async (request, response)=>{
    const {playerId} = request.params; 
    const {playerName} = request.body   
    const updatePlayerDetailsQuery = 
        `
            UPDATE
                player_details
            SET
                player_name = '${playerName}'
            WHERE
                player_id = ${playerId}
        `
    await db.run(updatePlayerDetailsQuery);
    response.send("Player Details Updated");
});

//Get Match details by matchId API
app.get("/matches/:matchId/", async (request, response)=> {
    const {matchId} = request.params;
    const getMatchDetailsQuery = 
        `
            SELECT
                *
            FROM
                match_details
            WHERE
                match_id = ${matchId}          
        `
    const dbResponse = await db.get(getMatchDetailsQuery);
    const matchDetails = convertMatchDetailsToCamelCase(dbResponse);
    response.send(matchDetails);
});

//Get all matches by a Player API
app.get("/players/:playerId/matches/", async (request, response)=> {
    const {playerId} = request.params;
    const getMatchesByPlayerQuery = 
        `
            SELECT
                match_id  as matchId,
                match,
                year
            FROM
                match_details NATURAL JOIN player_match_score
            WHERE
                player_id = ${playerId}
        `
    const matches = await db.all(getMatchesByPlayerQuery);
    response.send(matches);
});

//Get all Players in a match API
app.get("/matches/:matchId/players/", async (request, response)=> {
    const {matchId} = request.params;
    const getPlayersInMatchQuery = 
        `
            SELECT
                player_id as playerId,
                player_name as playerName
            FROM
                player_details NATURAL JOIN player_match_score
            WHERE
                match_id = ${matchId}
        `
    const players = await db.all(getPlayersInMatchQuery);
    response.send(players);
});

//Get Player's score details
app.get("/players/:playerId/playerScores", async (request, response) => {
    const { playerId } = request.params;
    const getPlayerScoreDetailsQuery = 
        `
            SELECT
                player_id as playerId,
                player_name as playerName,            
                SUM(score) as totalScore,
                SUM(fours) as totalFours,
                SUM(sixes) as totalSixes
            FROM
                player_details NATURAL JOIN player_match_score
            WHERE
                player_id = ${playerId}                
        `    
    const playerScoresDetails = await db.get(getPlayerScoreDetailsQuery);
    response.send(playerScoresDetails);
});

module.exports = app;