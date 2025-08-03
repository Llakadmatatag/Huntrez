document.addEventListener('DOMContentLoaded', function() {
    // Set the end date for the countdown (August 31, 2025 23:59:59 UTC)
    const endDate = new Date('2025-08-31T23:59:59Z');
    const API_URL = 'https://huntrez-csbattle.agun9wib93.workers.dev/';
    const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    // Update countdown every second
    const countdown = setInterval(function() {
        const now = new Date().getTime();
        const distance = endDate - now;
        
        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Display the result
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        
        // If the countdown is finished, clear interval
        if (distance < 0) {
            clearInterval(countdown);
            document.getElementById('countdown').innerHTML = "<div class='countdown-ended'>Leaderboard has ended!</div>";
        }
    }, 1000);
    
    // Function to show loading state
    function showLoading() {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i> Loading leaderboard data...
                    </div>
                </td>
            </tr>`;
    }
    
    // Function to show error message
    function showError(message) {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center error-message">
                    <i class="fas fa-exclamation-circle"></i> ${message}
                </td>
            </tr>`;
    }
    
    // Function to fetch leaderboard data
    async function fetchLeaderboardData() {
        try {
            showLoading();
            
            // Create a unique timestamp to prevent caching
            const timestamp = new Date().getTime();
            const url = new URL(API_URL);
            url.searchParams.append('_', timestamp);
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                mode: 'cors',
                cache: 'no-store' // Use cache control via fetch API instead of header
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid content type. Expected JSON.');
            }
            
            const responseData = await response.json();
            
            // Process the users array from the response
            if (responseData && Array.isArray(responseData.users)) {
                const processedData = responseData.users.map(user => ({
                    name: user.username || 'Anonymous',
                    wagered: parseFloat(user.wager) || 0,
                    avatar: user.avatar,
                    rank: user.rank
                }));
                
                // The data is already sorted by the API, but we'll sort again to be safe
                const sortedData = processedData.sort((a, b) => b.wagered - a.wagered);
                
                // Update the leaderboard with the processed data
                populateLeaderboard(sortedData);
                updateLastUpdated();
            } else {
                throw new Error('Invalid data format: Expected users array');
            }
        } catch (error) {
            let errorMessage = 'Failed to load leaderboard data';
            
            // More specific error messages
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            } else if (error.message.includes('Invalid content type')) {
                errorMessage = 'Server returned invalid data format';
            } else if (error.message.includes('HTTP error')) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            showError(errorMessage);
        }
    }
    
    // Function to update the last updated time in UTC
    function updateLastUpdated() {
        const now = new Date();
        const options = { 
            timeZone: 'UTC',
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZoneName: 'short'
        };
        
        let lastUpdatedElement = document.getElementById('last-updated');
        if (!lastUpdatedElement) {
            const leaderboardContainer = document.querySelector('.leaderboard-container');
            lastUpdatedElement = document.createElement('div');
            lastUpdatedElement.id = 'last-updated';
            lastUpdatedElement.className = 'last-updated';
            leaderboardContainer.appendChild(lastUpdatedElement);
        }
        
        // Remove the automatic timezone string and add our own
        const timeString = now.toLocaleString('en-US', { ...options, timeZoneName: undefined });
        lastUpdatedElement.textContent = `Last updated: ${timeString} UTC`;
    }
    
    // Function to update podium with top 3 players
    function updatePodium(players) {
        if (!players || players.length === 0) return;
        
        const podiumPlayers = [
            { rank: 1, element: document.querySelector('.first-place') },
            { rank: 2, element: document.querySelector('.second-place') },
            { rank: 3, element: document.querySelector('.third-place') }
        ];
        
        podiumPlayers.forEach(podium => {
            const player = players[podium.rank - 1];
            if (!player) return;
            
            const container = podium.element;
            container.querySelector('.podium-name').textContent = player.name || 'Anonymous';
            container.querySelector('.podium-wagered').innerHTML = 
                `${formatNumber(player.wagered || 0)}<img src="images/csbattle-coin.svg" alt="CSBATTLE COIN" class="coin-icon">`;
            container.querySelector('.podium-prize').innerHTML = formatPrize(podium.rank);
            
            const img = container.querySelector('.podium-img');
            img.src = player.avatar || 'https://via.placeholder.com/100';
            img.alt = player.name || `Rank ${podium.rank}`;
            img.onerror = function() {
                this.src = 'https://via.placeholder.com/100';
            };
        });
    }
    
    // Function to populate leaderboard (starting from rank 4)
    function populateLeaderboard(data) {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" class="text-center">
                    No data available yet. Be the first to join the leaderboard!
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        // Update podium with top 3 players
        updatePodium(data);
        
        // Start table from 4th place
        const tableData = data.slice(3);
        
        if (tableData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" class="text-center">
                    More players needed to fill the leaderboard!
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        tableData.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${index + 4}</td>
                <td class="player-cell">
                    <div class="player-info">
                        <img src="${player.avatar || 'https://via.placeholder.com/40'}" 
                             alt="${player.name || 'Player'}" 
                             class="player-avatar" 
                             onerror="this.src='https://via.placeholder.com/40'"
                        >
                        <span class="player-name">${player.name || 'Anonymous'}</span>
                    </div>
                </td>
                <td class="text-right">
                    ${formatNumber(player.wagered || 0)}
                    <img src="images/csbattle-coin.svg" alt="CSBATTLE COIN" class="coin-icon" style="margin-left: 6px;">
                </td>
                <td class="text-right">${index + 4 <= 7 ? formatPrize(index + 4) : '-'}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Calculate prize based on rank
    function formatPrize(rank) {
        const prizes = [
            { amount: '250', icon: 'images/csbattle-coin.svg' },
            { amount: '150', icon: 'images/csbattle-coin.svg' },
            { amount: '75', icon: 'images/csbattle-coin.svg' },
            { amount: '25', icon: 'images/csbattle-coin.svg' },
        ];
        
        if (rank > prizes.length) return '-';
        
        const prize = prizes[rank - 1];
        return `${prize.amount}<img src="${prize.icon}" alt="CSBATTLE COIN" class="coin-icon">`;
    }
    
    // Initial fetch
    fetchLeaderboardData();
    
    // Set up interval to refresh data every 15 minutes
    setInterval(fetchLeaderboardData, REFRESH_INTERVAL);
});
