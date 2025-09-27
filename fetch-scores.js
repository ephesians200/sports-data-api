const https = require('https');
const fs = require('fs');

const API_KEY = process.env.SPORTS_API_KEY || '123';

// Multiple league IDs for more matches
const LEAGUES = [
    { id: '4328', name: 'English Premier League' },
    { id: '4335', name: 'Spanish La Liga' },
    { id: '4331', name: 'German Bundesliga' },
    { id: '4332', name: 'Italian Serie A' },
    { id: '4334', name: 'French Ligue 1' },
    { id: '4480', name: 'UEFA Champions League' },
    { id: '4481', name: 'UEFA Europa League' },
    { id: '4346', name: 'Portuguese Liga' },
    { id: '4344', name: 'Dutch Eredivisie' },
    { id: '4351', name: 'Brazilian Serie A' },
    { id: '4356', name: 'Argentine Primera' },
    { id: '4370', name: 'Mexican Liga MX' }
];

function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

function getSampleData() {
    return [
        {
            strHomeTeam: "Liverpool", strAwayTeam: "Arsenal",
            intHomeScore: "2", intAwayScore: "1",
            strStatus: "Live", strLeague: "Premier League", strProgress: "75'"
        },
        {
            strHomeTeam: "Chelsea", strAwayTeam: "Man City", 
            intHomeScore: "0", intAwayScore: "1",
            strStatus: "Live", strLeague: "Premier League", strProgress: "45'"
        },
        {
            strHomeTeam: "Barcelona", strAwayTeam: "Real Madrid",
            intHomeScore: "1", intAwayScore: "1",
            strStatus: "Live", strLeague: "La Liga", strProgress: "60'"
        },
        {
            strHomeTeam: "Bayern Munich", strAwayTeam: "Borussia Dortmund",
            intHomeScore: "3", intAwayScore: "0", 
            strStatus: "FT", strLeague: "Bundesliga", strProgress: "90'"
        },
        {
            strHomeTeam: "PSG", strAwayTeam: "Marseille",
            intHomeScore: "2", intAwayScore: "2",
            strStatus: "Live", strLeague: "Ligue 1", strProgress: "82'"
        },
        {
            strHomeTeam: "Juventus", strAwayTeam: "AC Milan",
            intHomeScore: "1", intAwayScore: "0",
            strStatus: "Live", strLeague: "Serie A", strProgress: "67'"
        },
        {
            strHomeTeam: "Manchester United", strAwayTeam: "Tottenham",
            intHomeScore: "0", intAwayScore: "0",
            strStatus: "Live", strLeague: "Premier League", strProgress: "23'"
        },
        {
            strHomeTeam: "Atletico Madrid", strAwayTeam: "Valencia", 
            intHomeScore: "2", intAwayScore: "1",
            strStatus: "FT", strLeague: "La Liga", strProgress: "90'"
        },
        {
            strHomeTeam: "Inter Milan", strAwayTeam: "Napoli",
            intHomeScore: "1", intAwayScore: "3",
            strStatus: "FT", strLeague: "Serie A", strProgress: "90'"
        },
        {
            strHomeTeam: "Borussia Dortmund", strAwayTeam: "RB Leipzig",
            intHomeScore: "2", intAwayScore: "0",
            strStatus: "Live", strLeague: "Bundesliga", strProgress: "55'"
        },
        {
            strHomeTeam: "Ajax", strAwayTeam: "PSV",
            intHomeScore: "0", intAwayScore: "2",
            strStatus: "FT", strLeague: "Eredivisie", strProgress: "90'"
        },
        {
            strHomeTeam: "Porto", strAwayTeam: "Benfica",
            intHomeScore: "1", intAwayScore: "1",
            strStatus: "Live", strLeague: "Liga Portugal", strProgress: "78'"
        },
        {
            strHomeTeam: "Flamengo", strAwayTeam: "Palmeiras",
            intHomeScore: "0", intAwayScore: "1",
            strStatus: "Live", strLeague: "Serie A Brazil", strProgress: "35'"
        },
        {
            strHomeTeam: "Boca Juniors", strAwayTeam: "River Plate",
            intHomeScore: "2", intAwayScore: "2",
            strStatus: "FT", strLeague: "Primera Division", strProgress: "90'"
        },
        {
            strHomeTeam: "Club America", strAwayTeam: "Chivas",
            intHomeScore: "1", intAwayScore: "0",
            strStatus: "Live", strLeague: "Liga MX", strProgress: "62'"
        },
        {
            strHomeTeam: "Leicester City", strAwayTeam: "Newcastle",
            intHomeScore: "1", intAwayScore: "2",
            strStatus: "FT", strLeague: "Premier League", strProgress: "90'"
        },
        {
            strHomeTeam: "Sevilla", strAwayTeam: "Real Sociedad",
            intHomeScore: "0", intAwayScore: "0",
            strStatus: "Live", strLeague: "La Liga", strProgress: "15'"
        },
        {
            strHomeTeam: "AC Milan", strAwayTeam: "Roma",
            intHomeScore: "3", intAwayScore: "1",
            strStatus: "FT", strLeague: "Serie A", strProgress: "90'"
        },
        {
            strHomeTeam: "Eintracht Frankfurt", strAwayTeam: "Wolfsburg",
            intHomeScore: "2", intAwayScore: "1",
            strStatus: "Live", strLeague: "Bundesliga", strProgress: "85'"
        },
        {
            strHomeTeam: "Lyon", strAwayTeam: "Monaco",
            intHomeScore: "1", intAwayScore: "1",
            strStatus: "Live", strLeague: "Ligue 1", strProgress: "70'"
        }
    ];
}

async function fetchFromMultipleLeagues() {
    const allMatches = [];
    
    for (const league of LEAGUES) {
        try {
            console.log(`Fetching from ${league.name}...`);
            
            // Fetch live scores
            const liveUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/livescore.php?l=${league.id}`;
            const liveData = await fetchData(liveUrl);
            
            if (liveData.events) {
                liveData.events.forEach(match => {
                    allMatches.push({
                        ...match,
                        strLeague: league.name
                    });
                });
            }
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.log(`Failed to fetch from ${league.name}: ${error.message}`);
        }
    }
    
    return allMatches;
}

async function fetchTodaysFixtures() {
    const todaysMatches = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Sample of major leagues for today's fixtures
    const majorLeagues = LEAGUES.slice(0, 6); // First 6 leagues
    
    for (const league of majorLeagues) {
        try {
            console.log(`Fetching today's fixtures from ${league.name}...`);
            
            const fixturesUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsday.php?d=${today}&l=${league.id}`;
            const fixturesData = await fetchData(fixturesUrl);
            
            if (fixturesData.events) {
                // Add upcoming matches for today
                fixturesData.events.forEach(match => {
                    todaysMatches.push({
                        strHomeTeam: match.strHomeTeam,
                        strAwayTeam: match.strAwayTeam,
                        intHomeScore: null,
                        intAwayScore: null,
                        strStatus: "Not Started",
                        strLeague: league.name,
                        strProgress: match.strTime || "TBD"
                    });
                });
            }
            
            // Add delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.log(`Failed to fetch fixtures from ${league.name}: ${error.message}`);
        }
    }
    
    return todaysMatches.slice(0, 20); // Limit to 20 upcoming matches
}

async function main() {
    try {
        console.log('Fetching live scores from multiple leagues...');
        
        let allMatches = [];
        
        try {
            // Fetch live matches from multiple leagues
            const liveMatches = await fetchFromMultipleLeagues();
            allMatches = allMatches.concat(liveMatches);
            
            // Fetch today's fixtures if we need more matches
            if (allMatches.length < 30) {
                console.log('Adding today\'s fixtures...');
                const todaysFixtures = await fetchTodaysFixtures();
                allMatches = allMatches.concat(todaysFixtures);
            }
            
        } catch (error) {
            console.log('API failed, using sample data:', error.message);
            allMatches = getSampleData();
        }

        // If still no matches, use sample data
        if (allMatches.length === 0) {
            console.log('No matches found, using sample data');
            allMatches = getSampleData();
        }

        // Process and format the data
        const processedMatches = allMatches.map(match => ({
            homeTeam: match.strHomeTeam || 'Team A',
            awayTeam: match.strAwayTeam || 'Team B',
            homeScore: parseInt(match.intHomeScore) || 0,
            awayScore: parseInt(match.intAwayScore) || 0,
            status: match.strStatus || 'Live',
            league: match.strLeague || 'Football',
            time: match.strProgress || match.strTime || 'TBD'
        }));

        // Remove duplicates and limit to 50 matches
        const uniqueMatches = processedMatches.filter((match, index, self) => 
            index === self.findIndex(m => 
                m.homeTeam === match.homeTeam && 
                m.awayTeam === match.awayTeam && 
                m.league === match.league
            )
        ).slice(0, 50);

        const output = {
            success: true,
            matches: uniqueMatches,
            lastUpdated: new Date().toISOString(),
            source: allMatches.length > getSampleData().length ? 'thesportsdb' : 'sample',
            totalMatches: uniqueMatches.length,
            liveMatches: uniqueMatches.filter(m => m.status.toLowerCase().includes('live')).length,
            finishedMatches: uniqueMatches.filter(m => m.status === 'FT').length,
            upcomingMatches: uniqueMatches.filter(m => m.status === 'Not Started').length
        };

        // Write to JSON file
        fs.writeFileSync('live-scores.json', JSON.stringify(output, null, 2));
        console.log(`✅ Successfully fetched ${uniqueMatches.length} matches`);
        console.log(`Live: ${output.liveMatches}, Finished: ${output.finishedMatches}, Upcoming: ${output.upcomingMatches}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Create fallback file with sample data
        const fallback = {
            success: false,
            matches: getSampleData().map(match => ({
                homeTeam: match.strHomeTeam,
                awayTeam: match.strAwayTeam,
                homeScore: parseInt(match.intHomeScore),
                awayScore: parseInt(match.intAwayScore),
                status: match.strStatus,
                league: match.strLeague,
                time: match.strProgress
            })),
            lastUpdated: new Date().toISOString(),
            source: 'fallback',
            totalMatches: 20,
            error: error.message
        };
        
        fs.writeFileSync('live-scores.json', JSON.stringify(fallback, null, 2));
    }
}

main();
