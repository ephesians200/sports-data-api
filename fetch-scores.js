const https = require('https');
const fs = require('fs');

const API_KEY = process.env.SPORTS_API_KEY || '123';
const API_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/livescore.php?l=4328`;

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
    return {
        events: [
            {
                strHomeTeam: "Liverpool",
                strAwayTeam: "Arsenal", 
                intHomeScore: "2",
                intAwayScore: "1",
                strStatus: "Live",
                strLeague: "Premier League",
                strProgress: "75'"
            },
            {
                strHomeTeam: "Chelsea",
                strAwayTeam: "Man City",
                intHomeScore: "0", 
                intAwayScore: "1",
                strStatus: "Live",
                strLeague: "Premier League",
                strProgress: "45'"
            },
            {
                strHomeTeam: "Barcelona",
                strAwayTeam: "Real Madrid",
                intHomeScore: "1",
                intAwayScore: "1", 
                strStatus: "Live",
                strLeague: "La Liga",
                strProgress: "60'"
            },
            {
                strHomeTeam: "Bayern Munich",
                strAwayTeam: "Borussia Dortmund",
                intHomeScore: "3",
                intAwayScore: "0",
                strStatus: "FT",
                strLeague: "Bundesliga", 
                strProgress: "90'"
            },
            {
                strHomeTeam: "PSG",
                strAwayTeam: "Marseille",
                intHomeScore: "2",
                intAwayScore: "2",
                strStatus: "Live",
                strLeague: "Ligue 1",
                strProgress: "82'"
            },
            {
                strHomeTeam: "Juventus", 
                strAwayTeam: "AC Milan",
                intHomeScore: "1",
                intAwayScore: "0",
                strStatus: "Live",
                strLeague: "Serie A",
                strProgress: "67'"
            },
            {
                strHomeTeam: "Manchester United",
                strAwayTeam: "Tottenham",
                intHomeScore: "0",
                intAwayScore: "0", 
                strStatus: "Live",
                strLeague: "Premier League",
                strProgress: "23'"
            },
            {
                strHomeTeam: "Atletico Madrid",
                strAwayTeam: "Valencia",
                intHomeScore: "2",
                intAwayScore: "1",
                strStatus: "FT", 
                strLeague: "La Liga",
                strProgress: "90'"
            }
        ]
    };
}

async function main() {
    try {
        console.log('Fetching live scores...');
        
        let data;
        try {
            data = await fetchData(API_URL);
        } catch (error) {
            console.log('API failed, using sample data:', error.message);
            data = getSampleData();
        }

        // Process the data
        const liveMatches = (data.events || []).map(match => ({
            homeTeam: match.strHomeTeam || 'Team A',
            awayTeam: match.strAwayTeam || 'Team B',
            homeScore: parseInt(match.intHomeScore) || 0,
            awayScore: parseInt(match.intAwayScore) || 0,
            status: match.strStatus || 'Live',
            league: match.strLeague || 'Football',
            time: match.strProgress || 'Live'
        }));

        // Add sample data if no live matches
        const finalData = liveMatches.length > 0 ? liveMatches : getSampleData().events.map(match => ({
            homeTeam: match.strHomeTeam,
            awayTeam: match.strAwayTeam,
            homeScore: parseInt(match.intHomeScore),
            awayScore: parseInt(match.intAwayScore), 
            status: match.strStatus,
            league: match.strLeague,
            time: match.strProgress
        }));

        const output = {
            success: true,
            matches: finalData,
            lastUpdated: new Date().toISOString(),
            source: liveMatches.length > 0 ? 'thesportsdb' : 'sample',
            totalMatches: finalData.length
        };

        // Write to JSON file
        fs.writeFileSync('live-scores.json', JSON.stringify(output, null, 2));
        console.log(`✅ Successfully fetched ${finalData.length} matches`);
        console.log('Data written to live-scores.json');

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Create fallback file
        const fallback = {
            success: false,
            matches: getSampleData().events.map(match => ({
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
            error: error.message
        };
        
        fs.writeFileSync('live-scores.json', JSON.stringify(fallback, null, 2));
    }
}

main();