
// import * as admin from 'firebase-admin';
const admin = require('firebase-admin')
const secretManHero = require('../json/pokedex-party-firebase-adminsdk-thuun-700fa423bc.json');

const firebaseApp = admin.initializeApp
({
    credential: admin.credential.cert(secretManHero),
    databaseURL: "https://pokedex-party.firebaseio.com"
})
const database = firebaseApp.database();

////14,24,34,45
async function translateIDs(zukanID)
{
	const oldFossils = await (await database.ref(`/fossils/pieceList`).once('value')).val();
	const newFossils = await (await database.ref(`/newFossils/pieceList`).once('value')).val();
	const userPath = `/pokedexes/${zukanID}/pokemon/completion`;
	
	const userCompletion = await (await database.ref(userPath).once('value')).val();
	const ids = userCompletion.map((value,index)=>
	{
		if(value)return index;
		else return null;
	}).filter(id=>id!==undefined||id!==null)
	
	let newIDS = ids.map(userFossilID=>
	{
		if(userFossilID)
		{		
			var oldFossil = oldFossils.find(oldFossil=>oldFossil.id===userFossilID);
			let newFossil = newFossils.find(newFossil=>newFossil.name===oldFossil.name);
			if(newFossil)
			{
				// console.log(newFossil);
				
				return newFossil.id;
			}
			else
			{			
				//Old: skull,neck,torso
				//New: body, skull,tail
	
				
				if(oldFossil.name==='Megalo Left Side')return newFossils.find(newFossil=>newFossil.name==='Left megalo side').id;	
				else if(oldFossil.name==="Megalo Right Side") return newFossils.find(newFossil=>newFossil.name==='Right megalo side').id;
				else if(oldFossil.name==="Plesio Neck") return newFossils.find(newFossil=>newFossil.name==='Plesio Skull').id;
				else if(oldFossil.name==="Plesio Torso") return newFossils.find(newFossil=>newFossil.name==='Plesio Body').id;
				else if(oldFossil.name=='Sabertooth Torso') return newFossils.find(newFossil=>newFossil.name==='Sabertooth Tail').id;
				else return null;
			} 
		}
		
	}).filter(id=>id!==null)
	const completion = {};
	newIDS.forEach(id=>completion[id]=true);
	console.log(completion);
	await database.ref(userPath).set(completion);
	
}


async function execute()
{
	await translateIDs('ivy-fossils');
	console.log('END');
}


execute()

