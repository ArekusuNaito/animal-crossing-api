export default class Critter 
{
	id: number;
	name: string;
	sellPrice: string;
	location: string;
	shadow: string;
	time: string;
	seasons: {
		northern?: number[][];
		southern?: number[][];
	};
	iconURL: string;
	stringSeason: string;
	constructor() {
		this.seasons = {};
	}
		
}