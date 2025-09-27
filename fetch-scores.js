const https = require('https');
const fs = require('fs');

function fetchData(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
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
            homeTeam: { name: "Liverpool" },
            awayTeam: { name: "Arsenal" },
            score: { home: 2, away: 1 },
            status: "IN_PLAY",
            competition: { name: "Premier League" },
            minute: 75
        },
        {
            homeTeam: { name: "Chelsea" },
            awayTeam: { name: "Man City" },
            score: { home: 0, away: 1 },
            status: "IN_PLAY",
            competition: { name: "Premier League" },
            minute: 45
        },
        {
            homeTeam: { name: "Barcelona" },
            awayTeam: { name: "Real Madrid" },
            score: { home: 1, away: 1 },
            status: "IN_PLAY",
            competition: { name: "La Liga" },
            minute: 60
        },
        {
            homeTeam: { name: "Bayern Munich" },
            awayTeam: { name: "Borussia Dortmund" },
            score: { home: 3, away: 0 },
            status: "FINISHED",
            competition: { name: "Bundesliga" },
            minute: 90
        },
        {
            homeTeam: { name: "PSG" },
            awayTeam: { name: "Marseille" },
            score: { home: 2, away: 2 },
            status: "IN_PLAY",
            competition: { name: "Ligue 1" },
            minute: 82
        },
        {
            homeTeam: { name: "Juventus" },
            awayTeam: { name: "AC Milan" },
            score: { home: 1, away: 0 },
            status: "IN_PLAY",
            competition: { name: "Serie A" },
            minute: 67
        },
        {
            homeTeam: { name: "Manchester United" },
            awayTeam: { name: "Tottenham" },
            score: { home: 0, away: 0 },
            status: "IN_PLAY",
            competition: { name: "Premier League" },
            minute: 23
        },
        {
            homeTeam: { name: "Atletico Madrid" },
            awayTeam: { name: "Valencia" },
            score: { home: 2, away: 1 },
            status: "FINISHED",
            competition: { name: "La Liga" },
            minute: 90
        },
        {
            homeTeam: { name: "Inter Milan" },
            awayTeam: { name: "Napoli" },
            score: { home: 1, away: 3 },
            status: "FINISHED",
            competition: { name: "Serie A" },
            minute: 90
        },
        {
            homeTeam: { name: "Eintracht Frankfurt" },
            awayTeam: { name: "Wolfsburg" },
            score: { home: 2, away: 1 },
            status: "IN_PLAY",
            competition: { name: "Bundesliga" },
            minute: 85
        }
    ];
}

function getStatus(status) {
    switch(status) {
        case 'IN_PLAY':
        case 'PAUSED':
            return 'Live';
        case 'FINISHED':
            return 'FT';
        case 'SCHEDULED':
        case 'TIMED':
            return 'Not Started';
        default:
            return status;
    }
}

function getMatchTime(status, minute) {
    if (status === 'IN_PLAY' || status === 'PAUSED') {
        return minute ? `${minute}'` : 'Live';
    } else if (status === 'FINISHED') {
        return '90\'';
    } else {
        return 'TBD';
    }
}

async function fetchFootballData() {
    const allMatches = [];
    
    try {
        console.log('Fetching live matches from Football-Data.org...');
        
        // Fetch today's matches (includes live and finished)
        const todayUrl = 'https://api.football-data.org/v4/matches';
        const response = await fetchData(todayUrl);
        
        console.log(`Received ${response.matches?.length || 0} matches from API`);
        
        if (response.matches && response.matches.length > 0) {
            // Process all matches
            response.matches.forEach(match => {
                if (match.homeTeam && match.awayTeam) {
                    allMatches.push(match);
                }
            });
        }
        
    } catch (error) {
        console.log(`Failed to fetch from Football-Data.org: ${error.message}`);
    }
    
    return allMatches;
}

async function main() {
    try {
        console.log('Fetching football data...');
        
        let allMatches = [];
        
        try {
            // Fetch from Football-Data.org
            const footballDataMatches = await fetchFootballData();
            allMatches = footballDataMatches;
            
        } catch (error) {
            console.log('All APIs failed, using sample data:', error.message);
            allMatches = getSampleData();
        }

        // If no matches, use sample data
        if (allMatches.length === 0) {
            console.log('No matches found from API, using sample data');
            allMatches = getSampleData();
        }

        // Process and format the data
        const processedMatches = allMatches.map(match => ({
            homeTeam: match.homeTeam?.name || match.homeTeam?.shortName || 'Team A',
            awayTeam: match.awayTeam?.name || match.awayTeam?.shortName || 'Team B',
            homeScore: match.score?.fullTime?.home || match.score?.home || 0,
            awayScore: match.score?.fullTime?.away || match.score?.away || 0,
            status: getStatus(match.status),
            league: match.competition?.name || 'Football',
            time: getMatchTime(match.status, match.minute)
        }));

        // Remove duplicates and limit to 40 matches
        const uniqueMatches = processedMatches.filter((match, index, self) => 
            index === self.findIndex(m => 
                m.homeTeam === match.homeTeam && 
                m.awayTeam === match.awayTeam
            )
        ).slice(0, 40);

        const output = {
            success: true,
            matches: uniqueMatches,
            lastUpdated: new Date().toISOString(),
            source: allMatches === getSampleData() ? 'sample' : 'football-data',
            totalMatches: uniqueMatches.length,
            liveMatches: uniqueMatches.filter(m => m.status === 'Live').length,
            finishedMatches: uniqueMatches.filter(m => m.status === 'FT').length,
            upcomingMatches: uniqueMatches.filter(m => m.status === 'Not Started').length
        };

        // Write to JSON file
        fs.writeFileSync('live-scores.json', JSON.stringify(output, null, 2));
        console.log(`Successfully fetched ${uniqueMatches.length} matches`);
        console.log(`Live: ${output.liveMatches}, Finished: ${output.finishedMatches}, Upcoming: ${output.upcomingMatches}`);
        console.log(`Source: ${output.source}`);

    } catch (error) {
        console.error('Error:', error.message);
        
        // Create fallback file with sample data
        const sampleMatches = getSampleData();
        const fallback = {
            success: false,
            matches: sampleMatches.map(match => ({
                homeTeam: match.homeTeam.name,
                awayTeam: match.awayTeam.name,
                homeScore: match.score.home,
                awayScore: match.score.away,
                status: getStatus(match.status),
                league: match.competition.name,
                time: getMatchTime(match.status, match.minute)
            })),
            lastUpdated: new Date().toISOString(),
            source: 'fallback',
            totalMatches: 10,
            error: error.message
        };
        
        fs.writeFileSync('live-scores.json', JSON.stringify(fallback, null, 2));
    }
}

main();
