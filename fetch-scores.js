const https = require('https');
const fs = require('fs');

const API_KEY = process.env.SPORTS_API_KEY || '7dec5142ebffbe2f8b64d5071bb2a5da';

function fetchData(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'v3.football.api-sports.io',
                'User-Agent': 'SureWinSports/1.0',
                ...headers
            }
        };

        https.get(url, options, (res) => {
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
            teams: { home: { name: "Liverpool" }, away: { name: "Arsenal" } },
            goals: { home: 2, away: 1 },
            fixture: { status: { short: "2H" } },
            league: { name: "Premier League" },
            fixture_status_elapsed: 75
        },
        {
            teams: { home: { name: "Chelsea" }, away: { name: "Man City" } },
            goals: { home: 0, away: 1 },
            fixture: { status: { short: "HT" } },
            league: { name: "Premier League" },
            fixture_status_elapsed: 45
        },
        {
            teams: { home: { name: "Barcelona" }, away: { name: "Real Madrid" } },
            goals: { home: 1, away: 1 },
            fixture: { status: { short: "2H" } },
            league: { name: "La Liga" },
            fixture_status_elapsed: 60
        },
        {
            teams: { home: { name: "Bayern Munich" }, away: { name: "Borussia Dortmund" } },
            goals: { home: 3, away: 0 },
            fixture: { status: { short: "FT" } },
            league: { name: "Bundesliga" },
            fixture_status_elapsed: 90
        },
        {
            teams: { home: { name: "PSG" }, away: { name: "Marseille" } },
            goals: { home: 2, away: 2 },
            fixture: { status: { short: "2H" } },
            league: { name: "Ligue 1" },
            fixture_status_elapsed: 82
        },
        {
            teams: { home: { name: "Juventus" }, away: { name: "AC Milan" } },
            goals: { home: 1, away: 0 },
            fixture: { status: { short: "2H" } },
            league: { name: "Serie A" },
            fixture_status_elapsed: 67
        },
        {
            teams: { home: { name: "Manchester United" }, away: { name: "Tottenham" } },
            goals: { home: null, away: null },
            fixture: { status: { short: "NS" } },
            league: { name: "Premier League" },
            fixture_date: "15:00"
        },
        {
            teams: { home: { name: "Atletico Madrid" }, away: { name: "Valencia" } },
            goals: { home: 2, away: 1 },
            fixture: { status: { short: "FT" } },
            league: { name: "La Liga" },
            fixture_status_elapsed: 90
        }
    ];
}

function getStatus(statusShort) {
    switch(statusShort) {
        case '1H':
        case '2H':
        case 'HT':
        case 'ET':
        case 'BT':
        case 'P':
            return 'Live';
        case 'FT':
        case 'AET':
        case 'PEN':
            return 'FT';
        case 'NS':
        case 'TBD':
        case 'SUSP':
        case 'PST':
        case 'CANC':
            return 'Not Started';
        default:
            return statusShort;
    }
}

function getMatchTime(match) {
    const status = match.fixture?.status?.short;
    const elapsed = match.fixture?.status?.elapsed;
    
    if (status === '1H' || status === '2H' || status === 'ET') {
        return elapsed ? `${elapsed}'` : 'Live';
    } else if (status === 'HT') {
        return 'HT';
    } else if (status === 'FT' || status === 'AET' || status === 'PEN') {
        return '90\'';
    } else if (status === 'NS' || status === 'TBD') {
        if (match.fixture?.date) {
            const matchTime = new Date(match.fixture.date);
            return matchTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        }
        return 'TBD';
    }
    return status || 'TBD';
}

async function fetchApiFootballData() {
    const allMatches = [];
    const today = new Date().toISOString().split('T')[0];
    
    try {
        console.log('Fetching live fixtures from API-Football...');
        
        // Get live fixtures
        const liveUrl = 'https://v3.football.api-sports.io/fixtures?live=all';
        const liveResponse = await fetchData(liveUrl);
        
        console.log(`Received ${liveResponse.response?.length || 0} live matches`);
        
        if (liveResponse.response && liveResponse.response.length > 0) {
            allMatches.push(...liveResponse.response);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get today's fixtures if we need more matches
        if (allMatches.length < 20) {
            console.log(`Fetching today's fixtures (${today})...`);
            
            const todayUrl = `https://v3.football.api-sports.io/fixtures?date=${today}`;
            const todayResponse = await fetchData(todayUrl);
            
            console.log(`Received ${todayResponse.response?.length || 0} today's matches`);
            
            if (todayResponse.response && todayResponse.response.length > 0) {
                // Add today's fixtures that aren't already included
                todayResponse.response.forEach(match => {
                    const exists = allMatches.find(existing => 
                        existing.fixture?.id === match.fixture?.id
                    );
                    if (!exists) {
                        allMatches.push(match);
                    }
                });
            }
        }
        
    } catch (error) {
        console.log(`Failed to fetch from API-Football: ${error.message}`);
        throw error;
    }
    
    return allMatches;
}

async function main() {
    try {
        console.log('Fetching football data...');
        
        let allMatches = [];
        
        try {
            // Fetch from API-Football
            const apiFootballMatches = await fetchApiFootballData();
            allMatches = apiFootballMatches;
            
        } catch (error) {
            console.log('API failed, using sample data:', error.message);
            allMatches = getSampleData();
        }

        // If no matches, use sample data
        if (allMatches.length === 0) {
            console.log('No matches found from API, using sample data');
            allMatches = getSampleData();
        }

        // Process and format the data
        const processedMatches = allMatches.map(match => ({
            homeTeam: match.teams?.home?.name || 'Team A',
            awayTeam: match.teams?.away?.name || 'Team B',
            homeScore: match.goals?.home ?? 0,
            awayScore: match.goals?.away ?? 0,
            status: getStatus(match.fixture?.status?.short),
            league: match.league?.name || 'Football',
            time: getMatchTime(match)
        }));

        // Remove duplicates and limit to 50 matches
        const uniqueMatches = processedMatches.filter((match, index, self) => 
            index === self.findIndex(m => 
                m.homeTeam === match.homeTeam && 
                m.awayTeam === match.awayTeam
            )
        ).slice(0, 50);

        const output = {
            success: true,
            matches: uniqueMatches,
            lastUpdated: new Date().toISOString(),
            source: allMatches === getSampleData() ? 'sample' : 'api-football',
            totalMatches: uniqueMatches.length,
            liveMatches: uniqueMatches.filter(m => m.status === 'Live').length,
            finishedMatches: uniqueMatches.filter(m => m.status === 'FT').length,
            upcomingMatches: uniqueMatches.filter(m => m.status === 'Not Started').length,
            apiCalls: allMatches === getSampleData() ? 0 : (uniqueMatches.length > 20 ? 2 : 1)
        };

        // Write to JSON file
        fs.writeFileSync('live-scores.json', JSON.stringify(output, null, 2));
        console.log(`Successfully fetched ${uniqueMatches.length} matches`);
        console.log(`Live: ${output.liveMatches}, Finished: ${output.finishedMatches}, Upcoming: ${output.upcomingMatches}`);
        console.log(`Source: ${output.source}, API calls used: ${output.apiCalls}`);

    } catch (error) {
        console.error('Error:', error.message);
        
        // Create fallback file with sample data
        const sampleMatches = getSampleData();
        const fallback = {
            success: false,
            matches: sampleMatches.map(match => ({
                homeTeam: match.teams.home.name,
                awayTeam: match.teams.away.name,
                homeScore: match.goals.home ?? 0,
                awayScore: match.goals.away ?? 0,
                status: getStatus(match.fixture.status.short),
                league: match.league.name,
                time: getMatchTime(match)
            })),
            lastUpdated: new Date().toISOString(),
            source: 'fallback',
            totalMatches: 8,
            error: error.message
        };
        
        fs.writeFileSync('live-scores.json', JSON.stringify(fallback, null, 2));
    }
}

main();
