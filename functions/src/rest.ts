//tsconfig.json needs to be commonJS to use imports and not 'require'
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const fs = require('fs');
import bodyParser, { json } from "body-parser";
import cors from 'cors';
import express from 'express'
// const Critter = require('./Critter');
import Critter from './Critter';
const app = express();
const port = 8888;

const secretManHero = require('../json/pokedex-party-firebase-adminsdk-thuun-700fa423bc.json');

const firebaseApp = admin.initializeApp
({
    credential: admin.credential.cert(secretManHero),
    databaseURL: "https://pokedex-party.firebaseio.com"
})
const database = firebaseApp.database();

//Used when working locally
// const fishes:Critter[] = JSON.parse(fs.readFileSync('fishes.json','utf8'));
// const bugs:Critter[] = JSON.parse(fs.readFileSync('bugs.json', 'utf8'));
// const critters = [...fishes,...bugs];
const bugs:any={};
const fishes:any={};
const critters:any={};  

enum CritterType { Critter = "critter", Fish = "fish", Bug = "bug" }





///



app.use(cors());
app.use(bodyParser.json());
console.log('#################')
console.log('API Initialized');

async function getCritterTypeInDatabase(critterType: CritterType)
{
    if (critterType===CritterType.Critter)
    {
        const snapshot = await database.ref(`critters`).once('value');
            const critterObject = snapshot.val();
            const critters = [...critterObject.fishes,...critterObject.bugs]
            return critters;
    }
    else
    {
        const pluralCritter = critterType == CritterType.Fish ? "fishes" : "bugs";
        console.log(pluralCritter);
        
        const snapshot = await database.ref(`critters/${pluralCritter}`).once('value');
        return snapshot.val();
    }
    
}



// Only when running on a local machine, when using firebase, its not needed
// app.listen(port, () => {
//     console.log(`Server has started on port: ${port}`);

// });

app.get('/ping', (request, response) => {
    console.log('Ping!');
    response.status(200).send('Pong!')

});

app.get(`/critters`,async (request,response)=>
{
    try
    {
        const critters = await getCritterTypeInDatabase(CritterType.Critter);
        response.status(200).send(critters);
    }catch(error)
    {
        response.status(500).send('Error on your critters request')
    }
});

app.get(`/bugs`, async (request, response) => {
    try 
    {
        const bugs = await getCritterTypeInDatabase(CritterType.Bug);
        response.status(200).send(bugs);
    } catch (error) {
        response.status(500).send('Error on your bugs request')
    }
});

app.get(`/fishes`, async (request, response) => {
    try
    {
        const fishes:Critter[] = await getCritterTypeInDatabase(CritterType.Fish);

        response.status(200).send(fishes);
    } catch (error) {
        response.status(500).send('Error on your fishes request')
    }
});

const critterIDRegex = '^/:critterType(critter|fish|bug)/:id([0-9]+)$' //  /fish/bitterling, /fish/common butterfly =>ok
app.get(critterIDRegex, async (request, response) => 
{
    try
    {
        
        const params = request.params;
        const critterType = <CritterType>params[ 'critterType' ];
        let critters:Critter[] = await getCritterTypeInDatabase(critterType);
        const id = Number.parseInt(params['id'])-1; //Minus 1 because ids start on 1, yet array in 0

        
        response.status(200).send(critters[ id ]);
    }catch(error)
    {
        response.status(500).send('Server error');
    }
});

//Common Butterfly
const critterNameRegex = '^/:critterType(critter|fish|bug)/:name([a-zA-Z%20]+)$' //  /fish/bitterling, /fish/common butterfly =>ok
app.get(critterNameRegex, async (request, response) =>
{
    console.log('passed');
    
    try 
    {
        const params = request.params;
        console.log(params);
        const critterType = <CritterType>params[ 'critterType' ];
        const critters = await getCritterTypeInDatabase(critterType);
        const name = params['name'].toLowerCase();
        let critter = critters.find(currentCritter => currentCritter.name.toLowerCase() === name);
        response.status(200).send(critter);
    } catch (error) 
    {
        response.status(500).send('Server error');
    }
});


///critter/month/march
const crittersByMonth = '^/:critterType(critter|fish|bug)/:hemisphere(northern|southern)/:month(\\w+)$' //  
app.get(crittersByMonth, async (request, response) => {
    //request.query.limit, as used in &limit=10
    
    
    try
    {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        const critterType = <CritterType>request.params['critterType'];
        const requestedHemisphere = request.params['hemisphere'];
        const requestedMonth = getMonthNumber(request.params['month'].toLowerCase());
        console.log('Filter by month',requestedMonth,requestedHemisphere);
        
        function getMonthNumber(month:string): number 
        {
            for (let index = 0; index < months.length; index++) {
                const currentMonth = months[index].toLowerCase();
                if (currentMonth === month) return index + 1;

            }
            return -1;
        }
        
        let critters:Critter[] = await getCritterTypeInDatabase(critterType);
        critters = critters.filter(currentCritter => 
        {
            try
            {
                console.assert(currentCritter.seasons,'No seasons');
                console.assert(currentCritter.seasons.northern,'no northern');
                console.assert(currentCritter.seasons.southern,'no southern');
                //Go to every selected season and map;
                //every season will
                return currentCritter.seasons[requestedHemisphere].some(season=>season.some(currentMonth => currentMonth === requestedMonth));
            }
            catch(error)
            {
                return false;
            }
        })
        console.log('Completed filtering...');
        const limit  = request.query.limit;
        if(limit)critters=critters.slice(0,limit);
        response.status(200).send(critters);
    }catch(error)
    {
        response.status(500).send(`Error filtering critters `);
    }
    

});






//################################404###########################

app.use((req, res, next) => {
    res.status(404).send("Animal Crossing Resource not found")
})






console.log('API Ready to Work!');

//Expose the Express API to firebase
exports.animalCrossingAPI = functions.https.onRequest(app);


