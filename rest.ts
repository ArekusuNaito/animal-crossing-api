import fs from 'fs';
import bodyParser, { json } from "body-parser";
import cors from 'cors';
import express from 'express'
import Critter from './Critter';
const app = express();
const port = 8888;

const fishes:Critter[] = JSON.parse(fs.readFileSync('fishes.json','utf8'));
const bugs:Critter[] = JSON.parse(fs.readFileSync('bugs.json', 'utf8'));
const critters = [...fishes,...bugs];

enum CrytterType { Critter = "critter", Fish = "fish", Bug = "bug" }



app.use(cors());
app.use(bodyParser.json());


app.listen(port, () => {
    console.log(`Server has started on port: ${port}`);

});

app.get('/ping', (request, response) => {
    console.log('Ping!');
    response.status(200).send('Pong!')

});

app.get(`/critters`,async (request,response)=>
{
    try
    {
        response.status(200).send(critters);
    }catch(error)
    {
        response.status(500).send('Error on your critters request')
    }
});

app.get(`/bugs`, async (request, response) => {
    try {
        response.status(200).send(bugs);
    } catch (error) {
        response.status(500).send('Error on your bugs request')
    }
});

app.get(`/fishes`, async (request, response) => {
    try {
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
        const critterType = params['critterType'];
        const id = Number.parseInt(params['id'])-1;
        let critter:any;
        
        if(critterType==='critter')
        {
            critter = critters[id]
        }
        else if (critterType === 'fish') 
        {
            critter = fishes[id];
        }
        else if(critterType==='bug')
        {
            critter = bugs[id];
        }
        response.status(200).send(critter);
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
        
        const critterType = params['critterType'];
        const name = params['name'].toLowerCase();
        let critter: any;
        if (critterType === 'critter') 
        {
            // critter = critters[id]
            critter = critters.find(currentCritter => currentCritter.name.toLowerCase()===name);
        }
        else if (critterType === 'fish') 
        {
            console.log(name);
            
            critter = fishes.find(currentCritter=>currentCritter.name.toLowerCase() === name);
        }
        else if (critterType === 'bug') 
        {
            critter = bugs.find(currentCritter => currentCritter.name.toLowerCase() === name);
        }
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
        const critterType = request.params['critterType'];
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
        
        
        let critterSetToFilter: Critter[];
        switch (critterType) 
        {
            case CrytterType.Critter:
            {
                critterSetToFilter = [...critters]
                break;
            }
            case CrytterType.Fish:
                {
                    critterSetToFilter = [...fishes];
                    break;
                }
            case CrytterType.Bug:
                {
                    critterSetToFilter = [...bugs]
                    break;
                }
        }
        //    
        critterSetToFilter = critterSetToFilter.filter(currentCritter => 
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
        console.log(limit);
        
        if(limit)critterSetToFilter=critterSetToFilter.slice(0,limit);
        response.status(200).send(critterSetToFilter);
    }catch(error)
    {
        response.status(500).send(`Error filtering critters `);
    }
    

});






//################################404###########################

app.use((req, res, next) => {
    res.status(404).send("Animal Crossing Resource not found")
})










