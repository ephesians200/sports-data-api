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
            score: { fullTime: { home: 2, away: 1 } },
            status: "IN_PLAY",
            competition: { name: "Premier League" },
            minute: 75
        },
        {
            homeTeam: { name: "Chelsea" },
            awayTeam: { name: "Man City" },
            score: { fullTime: { home: 0, away: 1 } },
            status: "IN_PLAY",
            competition: { name: "Premier League" },
            minute: 45
        },
        {
            homeTeam: { name: "Barcelona" },
            awayTeam: { name: "Real Madrid" },
            score: { fullTime: { home: 1, away: 1 } },
            status: "IN_PLAY",
            competition: { name: "La Liga" },
            minute: 60
        },
        {
            homeTeam: { name: "Bayern Munich" },
            awayTeam: { name: "Borussia Dortmund" },
            score: { fullTime: { home: 3, away: 0 } },
            status: "FINISHED",
            competition: { name: "Bundesliga" },
            minute: 90
        },
        {
            homeTeam: { name: "PSG" },
            awayTeam: { name: "Marseille" },
            score: { fullTime: { home: 2, away: 2 } },
            status: "IN_PLAY",
            competition: { name: "Ligue 1" },
            minute: 82
        },
        {
            homeTeam: { name: "Juventus" },
            awayTeam: { name: "AC Milan" },
            score: { fullTime: { home: 1, away: 0 } },
            status: "IN_PLAY",
            competition: { name: "Serie A" },
            minute: 67
        },
        {
            homeTeam: { name: "Manchester United" },
            awayTeam: { name: "Tottenham" },
            score: { fullTime: { home: 0, away: 0 } },
            status: "SCHEDULED",
            competition: { name: "Premier League" },
            utcDate: "2025-09-27T15:00:00Z"
        },
        {
            homeTeam: { name: "Atletico Madrid" },
            awayTeam: { name: "Valencia" },
            score: { fullTime: { home: 2, away: 1 } },
            status: "FINISHED",
            competition: { name: "La Liga" },
            minute: 90
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

function getMatchTime(match) {
    if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
        return match.minute ? `${match.minute}'` : 'Live';
    } else if (match.status === 'FINISHED') {
        return '90\'';
    } else if (match.status === 'SCHEDULED' || match.status === 'TIMED') {
        if (match.utcDate) {
            const matchTime = new Date(match.utcDate);
            return matchTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        }
        return 'TBD';
    }
    return 'TBD';
}

async function fetchTodaysMatches() {
    const today = new Date().toISOString().split('T')[0];
    const allMatches = [];
    
    try {
        console.log(`Fetching today's matches (${today}) from Football-Data.org...`);
        
        // Get all of today's matches (live, upcoming, finished)
        const todayUrl = `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`;
        const response = await fetchData(todayUrl);
        
        console.log(`Received ${response.matches?.length || 0} matches from API`);
        
        if (response.matches && response.matches.length > 0) {
            response.matches.forEach(match => {
                if (match.homeTeam && match.awayTeam) {
                    allMatches.push(match);
                }
            });
            
            console.log(`Processing ${allMatches.length} valid matches`);
            
            // Log match statuses for debugging
            const statusCounts = {};
            allMatches.forEach(match => {
                statusCounts[match.status] = (statusCounts[match.status] || 0) + 1;
            });
            console.log('Match statuses:', statusCounts);
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
            // Fetch today's matches (includes live, upcoming, and finished)
            const todaysMatches = await fetchTodaysMatches();
            allMatches = todaysMatches;
            
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
            homeTeam: match.homeTeam?.name || match.homeTeam?.shortName || 'Team A',
            awayTeam: match.awayTeam?.name || match.awayTeam?.shortName || 'Team B',
            homeScore: match.score?.fullTime?.home ?? match.score?.home ?? 0,
            awayScore: match.score?.fullTime?.away ?? match.score?.away ?? 0,
            status: getStatus(match.status),
            league: match.competition?.name || 'Football',
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
                homeScore: match.score.fullTime.home,
                awayScore: match.score.fullTime.away,
                status: getStatus(match.status),
                league: match.competition.name,
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
