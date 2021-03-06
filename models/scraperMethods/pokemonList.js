let cheerio = require('cheerio');
let request = require('request');
let requestUrl = require('./helpers/requestUrl');
let randTimer = require('./helpers/randTimer');
let sleepFor = require('./helpers/sleep');
let getArrayCharacteristics = require('./helpers/getArrayCharacteristics');
let writeFile = require('./helpers/writeFile');
let fs = require('fs');
let EventEmitter = require('events');
require('events').EventEmitter.defaultMaxListeners = Infinity;


function getPokemonList(baseUrl, callback) {
	
	let requestPokedex = requestUrl(baseUrl + "/pokedex/all");
	let pokedex = [];

	requestPokedex.then( body => {
		
		let $ = cheerio.load(body);
		let pokemonRow = $('#pokedex').children('tbody').children('tr');

		$(pokemonRow).map( (i, element) => {

			let td = $(element).children('td');
			const base = 900;
			if(i >= base && i < base + 50) {
				eachPokemonInList(td, baseUrl).then( pokemon => {
					pokedex.push(pokemon);
					return pokedex;
				}).then( pokedex => {
					callback(pokedex);
				});
			}
			// eachPokemonInList(td, baseUrl).then( pokemon => {
			// 	pokedex.push(pokemon);
			// 	return pokedex;
			// }).then( pokedex => {
			// 	callback(pokedex);
			// });
		});

	}).catch( err => {
		console.log(err)
	});
}

function eachPokemonInList(td, baseUrl) {
	return new Promise ( (resolve, reject) => {
		let pokemon = {
			id: parseInt(td.eq(0).text()),
			unique_id: td.eq(0).children('i').attr('data-sprite').split(' ')[1],
			name: td.eq(1).children('a').eq(0).text().replace(/\\/g, '') ,
			form: td.eq(1).find('.aside').text().toLowerCase(),
			profileUrl: td.eq(1).children('a').attr('href')
		};
		resolve(pokemon);
		// if(pokemon.name.toLowerCase() == 'caterpie') {
		// if(pokemon.name.toLowerCase() == 'deoxys') {
		// if(pokemon.name.toLowerCase() == 'wormadam') {
		// if(pokemon.name.toLowerCase() == 'charizard') {
		// if(pokemon.unique_id == 'n482') {
			enterPokemonProfile(baseUrl + pokemon.profileUrl, pokemon.form, pokemon.name + pokemon.form).then( profile => {
				writeFile.json(`./json/${pokemon.unique_id}.json`, profile);
			});
		// }  // if end
	});
}

function enterPokemonProfile(url, form, pokemonName) {
	sleepFor(randTimer);
	return requestUrl(url).then( body => {
		console.log("now scraping ", pokemonName);

		let $ = cheerio.load(body);
		let pokemonProfile;
		let summaryTabs = $('.tabset-basics .svtabs-tab-list').children('.svtabs-tab'),
			main = $('article');

		if(form === "") {
			let tabContainer = summaryTabs.children('a').eq(0).attr('href');
			pokemonProfile = scrapeProfileSections($, tabContainer, main, pokemonName);
		} else {
			pokemonProfile = multipleForms($, form, summaryTabs, main, pokemonName);
		}		
	
		return  pokemonProfile;

	}).catch( err => {

		return "ERROR: " + err;
	})	
}

function multipleForms($, form, summaryTabs, main, pokemonName) {
	let pokemonProfile;
	$(summaryTabs).map( (formTabIndex, element) => {

		if(form == $(element).text().toLowerCase()) {

			let summaryTab = $(element).children('a').attr('href');
			pokemonProfile = scrapeProfileSections($, summaryTab, main, pokemonName, formTabIndex);
		}
	})
	return pokemonProfile;
}

function scrapeProfileSections($, summaryTab,  main, pokemonName, formTabIndex) {
	const summaryTable = $(summaryTab).find('h2:contains("Pokédex data")').next();
	const trainingTable = $(summaryTab).find('h2:contains("Training")').next();
	const breedingTable = $(summaryTab).find('h2:contains("Breeding")').next();
	const statTable = $(summaryTab).find(`h2:contains("Base stats")`).next();
	const entryTable = $(main).find(`h2:contains("Pokédex entries")`).next(); 
	const movesSection = $(main).find(`h2:contains("Moves learned by")`).next().next().remove('.hidden');	
	const locationTable = $(main).find(`h2:contains("Where to find")`).next(); 
	const imageUrl = $(summaryTab).find('.figure').find('img').attr('src');

	let pokemonProfile = {
		summary: scrapeSummaryTable($, summaryTable),
		training: scrapeTrainingTable($, trainingTable),
		breeding: scrapeBreedingTable($, breedingTable),
		stats: scrapeStatTable($, statTable),
		entry: scrapeEntryTable($, entryTable),
		moves: scrapeMovesSection($, movesSection, formTabIndex),
		location: scrapeLocationTable($, locationTable),
		imageUrl: imageUrl
	}
	return pokemonProfile;
}

function scrapeSummaryTable($, table) {

	let tbody = table.find('tbody');

	let summary = {
		types: getArrayCharacteristics($, tbody.find('th:contains("Type")').next().children('a')),
		species: tbody.find('th:contains("Species")').next().text(),
		height: tbody.find('th:contains("Height")').next().text(),
		weight: tbody.find('th:contains("Weight")').next().text(),
		abilities: getArrayCharacteristics($, tbody.find('th:contains("Abilities")').next().find('a'))
	}
	return summary;
}

function scrapeTrainingTable($, table) {
	let tr = table.find('tbody').children('tr');
	let training = {};

	$(tr).map( (i, element) => {
		
		let category = $(element).find('th').text();
		training[category] = $(element).find('td').text().replace(/\t|\n/g, '');
	})

	return training;
}

function scrapeBreedingTable($, table) {

	let tr = table.find('tbody').children('tr');
	let breeding = {};

	$(tr).map( (i, element) => {
		
		let category = $(element).find('th').text();
		breeding[category] = $(element).find('td').text().replace(/\t|\n/g, '');
	})

	return breeding;
}

function scrapeStatTable($, table) {
	
	let tr = table.find('tbody').children('tr');
	let stats = {};
	
	$(tr).map( (i, element) => {
		
		let statName = $(element).find('th').text();

		if(statName != '') {

			stats[statName] = {
				base: $(element).find('td').eq(0).text(),
				min: $(element).find('td').eq(2).text(),
				max: $(element).find('td').eq(3).text(),
			};	
		}			
	})
	return stats;
}

function scrapeEntryTable($, table) {

	let tr = $(table).find('tbody').children('tr');
	let entries = {};

	$(tr).map( (i, element) => {

		let version = $(element).find('th').text();
		entries[version] = $(element).find('td').text();
	});

	return entries;
}

function scrapeMovesSection($, section, tabIndex) {
	let movesByLevelUpTable = $(section).find('h3:contains("Moves learnt by level up")').first().next().next(),
		movesbyEggTable = $(section).find('h3:contains("Egg moves")').first().next().next(),
		movesByTutorTable = $(section).find('h3:contains("Move Tutor moves")').first().next().next(),
		movesByTMTable = $(section).find('h3:contains("Moves learnt by TM")').first().next().next();

	let levelUpTabs = $(movesByLevelUpTable).children('ul.svtabs-tab-list');
	if(levelUpTabs.length > 0) movesByLevelUpTable = getFormTab($, levelUpTabs, tabIndex); 

	let tmTabs = $(movesByTMTable).children('ul.svtabs-tab-list');
	if(tmTabs.length > 0) movesByTMTable = getFormTab($, tmTabs, tabIndex); 

	let moves = {
		'byLevelUp': [],
		'byEgg': [],
		'byTutor': [],
		'byTM': []
	};
	let movesByLevelUp = [];

	$(movesByLevelUpTable).find('tbody').children('tr').map( (i, element) => {
		moves['byLevelUp'].push(getFormattedMovesWithLevels($, $(element).find('td')));
	});
	
	$(movesbyEggTable).find('tbody').children('tr').map( (i, element) => {
		moves['byEgg'].push(getFormattedMovesNoLevels($, $(element).find('td')));
	});

	$(movesByTutorTable).find('tbody').children('tr').map( (i, element) => {
		moves['byTutor'].push(getFormattedMovesNoLevels($, $(element).find('td')));
	});

	$(movesByTMTable).find('tbody').children('tr').map( (i, element) => {
		moves['byTM'].push(getFormattedMovesWithLevels($, $(element).find('td')));
	});

	return moves;
}
function getFormTab($, tabs, index) {
	return $(tabs).children('li').eq(index).find('a').attr('href'); 
}

function getFormattedMovesWithLevels($, nodeContainer) {
	
	let moveDetails = {};
	
	$(nodeContainer).map( (i, element) => {
		if(i === 0) {
			moveDetails['Level'] = $(element).text();
 		} else if (i === 1) {
 			moveDetails['Name'] = $(element).text();
 		} else if (i === 2) {
 			moveDetails['Type'] = $(element).text();
 		} else if (i === 3) {
 			moveDetails['Category'] = $(element).attr('data-filter-val');
 		} else if (i === 4) {
 			moveDetails['Power'] = $(element).text();
 		} else if (i === 5) {
 			moveDetails['Accuracy'] = $(element).text();
 		}
	});

	return moveDetails;
}

function getFormattedMovesNoLevels($, nodeContainer) {
	
	let moveDetails = {};
	
	$(nodeContainer).map( (i, element) => {
		if(i === 0) {
 			moveDetails['Name'] = $(element).text();
 		} else if (i === 1) {
 			moveDetails['Type'] = $(element).text();
 		} else if (i === 2) {
 			moveDetails['Category'] = $(element).attr('data-filter-val');
 		} else if (i === 3) {
 			moveDetails['Power'] = $(element).text();
 		} else if (i === 4) {
 			moveDetails['Accuracy'] = $(element).text();
 		}
	});

	return moveDetails;
}

function scrapeLocationTable($, table) {
	let tr = $(table).find('tbody').children('tr');
	let locations = {};

	$(tr).each( (i, element) => {

		const version = $(element).find('th').text();

		locations[version] = getArrayCharacteristics($, $(element).find('td'));
	});

	return locations;
}


module.exports = {
	get: getPokemonList,
	enterProfile: enterPokemonProfile
}