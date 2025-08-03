document.addEventListener('DOMContentLoaded', function() {
    // Set the end date for the countdown (August 31, 2025 23:59:59 UTC)
    const endDate = new Date('2025-08-31T23:59:59Z');
    const API_URL = 'https://huntrez-xfun.agun9wib93.workers.dev/';
    const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    // Function to show loading state
    function showLoading() {
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i> Loading leaderboard data...
                        </div>
                    </td>
                </tr>`;
        }
    }
    
    // Function to show error message
    function showError(message) {
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center error-message">
                        <i class="fas fa-exclamation-circle"></i> ${message}
                    </td>
                </tr>`;
        }
    }
    
    // Format number with commas and 2 decimal places
    function formatNumber(num) {
        // Convert to number if it's a string
        const number = typeof num === 'string' ? parseFloat(num) : num;
        // Format with 2 decimal places, add commas as thousand separators
        return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Format prize with coin image
    function formatPrize(rank, prize) {
        if (!prize || prize === 0) return '-';
        return `<span class="prize-amount">${formatNumber(prize)}</span><img src="images/xfun-coin.webp" alt="Coin" class="coin-icon">`;
    }
    
    // Format wager with coin image
    function formatWagered(amount) {
        if (!amount && amount !== 0) return '0';
        return `<span class="wagered-amount">${formatNumber(amount)}</span><img src="images/xfun-coin.webp" alt="Coin" class="coin-icon">`;
    }
    
    // Function to mask username (show only first 2 characters, mask the rest with asterisks)
    function maskUsername(username) {
        if (!username) return 'An';
        if (username.length <= 2) return username;
        // Show first 2 characters, mask the rest with asterisks based on original length
        const firstTwo = username.substring(0, 2);
        const maskedPart = '*'.repeat(Math.max(0, username.length - 2));
        return firstTwo + maskedPart;
    }
    
    // Update podium with top 3 players
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
            if (!container) return;
            
            // Update name with masking
            const nameEl = container.querySelector('.podium-name');
            if (nameEl) {
                const maskedName = maskUsername(player.name);
                console.log(`Podium Rank ${podium.rank}:`, { 
                    original: player.name, 
                    masked: maskedName,
                    element: nameEl
                });
                nameEl.textContent = maskedName;
            }
            
            // Update wagered with $ sign
            const wageredEl = container.querySelector('.podium-wagered');
            if (wageredEl) {
                wageredEl.innerHTML = formatWagered(player.wagered || 0);
            }
            
            // Update prize
            const prizeEl = container.querySelector('.podium-prize');
            if (prizeEl) {
                prizeEl.innerHTML = formatPrize(podium.rank, player.prize);
            }
            
            // Update avatar
            const img = container.querySelector('.podium-img');
            if (img) {
                img.src = player.avatar || 'images/avatar-placeholder.png';
                img.alt = player.name || `Rank ${podium.rank}`;
                img.onerror = function() {
                    this.src = 'images/avatar-placeholder.png';
                };
            }
        });
    }
    
    // Populate leaderboard table (starting from rank 4)
    function populateLeaderboard(data) {
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" class="text-center">
                    No data available yet. Be the first to join the leaderboard!
                </td>`;
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
                </td>`;
            tbody.appendChild(row);
            return;
        }
        
        tableData.forEach((player, index) => {
            const row = document.createElement('tr');
            row.className = 'animate-on-load';
            row.style.animationDelay = `${0.1 * (index % 10)}s`;
            
            const maskedName = maskUsername(player.name);
            row.innerHTML = `
                <td>#${index + 4}</td>
                <td class="player-cell">
                    <div class="player-info">
                        <img src="${player.avatar || 'images/avatar-placeholder.png'}" 
                             alt="${maskedName}" 
                             class="player-avatar" 
                             onerror="this.src='images/avatar-placeholder.png'"
                        >
                        <span class="player-name">${maskedName}</span>
                    </div>
                </td>
                <td class="text-right">
                    $${formatNumber(player.wagered || 0)}
                </td>
                <td class="text-right">${formatPrize(index + 4, player.prize)}</td>`;
            
            tbody.appendChild(row);
        });
    }
    
    // Global variables
    let leaderboardData = [];
    let currentPage = 1;
    const playersPerPage = 10;

    // Update leaderboard with pagination
    function updateLeaderboard() {
        const tbody = document.querySelector('.leaderboard-table tbody');
        const pagination = document.querySelector('.pagination');
        if (!tbody || !pagination) return;
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Calculate pagination
        const totalPages = Math.ceil((Math.max(6, leaderboardData.length) - 3) / playersPerPage);
        currentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
        
        // Get data for current page (skip top 3 for podium)
        const startIndex = 3 + (currentPage - 1) * playersPerPage;
        const endIndex = startIndex + playersPerPage;
        
        // Always show at least 6 rows on the first page
        const rowsToShow = (currentPage === 1) ? Math.max(6, playersPerPage) : playersPerPage;
        
        // Create empty data for missing players
        const emptyPlayer = {
            name: '---',
            wagered: 0,
            avatar: 'images/avatar-placeholder.png',
            prize: 0,
            bets: 0
        };
        
        // Create a padded data array with empty players if needed (only for first page)
        let paddedData = [...leaderboardData];
        if (currentPage === 1 && paddedData.length < 6) {
            const emptyPlayers = Array(6 - paddedData.length).fill().map(() => ({...emptyPlayer}));
            paddedData = [...paddedData, ...emptyPlayers];
        }
        
        // Get data for current page
        const pageData = [];
        for (let i = startIndex; i < Math.min(endIndex, paddedData.length); i++) {
            if (i < paddedData.length) {
                pageData.push(paddedData[i]);
            } else {
                pageData.push(emptyPlayer);
            }
        }
        
        // Populate table rows
        pageData.forEach((player, index) => {
            const row = document.createElement('tr');
            const rank = startIndex + index + 1; // +1 because we're 0-based in the array
            const isPlaceholder = player.name === '---';
            
            // Show prize for rank 4 even if it's a placeholder
            const showPrize = !isPlaceholder || (rank === 4);
            const prizeValue = rank === 4 ? 25 : 0; // Set prize for rank 4
            
            row.innerHTML = `
                <td>${isPlaceholder ? '---' : `#${rank}`}</td>
                <td class="player-cell">
                    <div class="player-info">
                        <img src="${player.avatar}" 
                             alt="${isPlaceholder ? 'Player' : maskUsername(player.name) || 'Player'}" 
                             class="player-avatar ${isPlaceholder ? 'placeholder' : ''}" 
                             onerror="this.src='https://via.placeholder.com/40'"
                        >
                        <span class="player-name ${isPlaceholder ? 'placeholder' : ''}">${isPlaceholder ? '---' : maskUsername(player.name) || 'An'}</span>
                    </div>
                </td>
                <td class="text-right ${isPlaceholder ? 'placeholder' : ''}">
                    ${isPlaceholder ? '---' : formatWagered(player.wagered || 0)}
                </td>
                <td class="text-right ${showPrize ? '' : 'placeholder'}">
                    ${showPrize ? formatPrize(rank, prizeValue) : '---'}
                </td>`;
            
            tbody.appendChild(row);
        });
        
        // Update pagination controls
        updatePaginationControls(totalPages);
    }
    
    // Update pagination controls
    function updatePaginationControls(totalPages) {
        const pagination = document.querySelector('.pagination');
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn' + (currentPage === 1 ? ' disabled' : '');
        prevBtn.innerHTML = '&laquo;';
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                updateLeaderboard();
            }
        };
        pagination.appendChild(prevBtn);
        
        // Page numbers
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;
        
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        // First page
        if (startPage > 1) {
            const firstPage = document.createElement('button');
            firstPage.className = 'pagination-btn' + (1 === currentPage ? ' active' : '');
            firstPage.textContent = '1';
            firstPage.onclick = () => {
                currentPage = 1;
                updateLeaderboard();
            };
            pagination.appendChild(firstPage);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
            pageBtn.textContent = i;
            pageBtn.onclick = (function(page) {
                return function() {
                    currentPage = page;
                    updateLeaderboard();
                };
            })(i);
            pagination.appendChild(pageBtn);
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
            
            const lastPage = document.createElement('button');
            lastPage.className = 'pagination-btn' + (totalPages === currentPage ? ' active' : '');
            lastPage.textContent = totalPages;
            lastPage.onclick = () => {
                currentPage = totalPages;
                updateLeaderboard();
            };
            pagination.appendChild(lastPage);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn' + (currentPage >= totalPages ? ' disabled' : '');
        nextBtn.innerHTML = '&raquo;';
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateLeaderboard();
            }
        };
        pagination.appendChild(nextBtn);
    }
    

    // Fetch leaderboard data from API
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
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Invalid content type: Expected application/json');
            }
            
            const responseData = await response.json();
            let processedData = [];
            
            try {
                // Format 1: { success: true, data: [...] }
                if (responseData && responseData.success === true && Array.isArray(responseData.data)) {
                    processedData = responseData.data.map((entry, index) => ({
                        name: entry.name || `Player ${index + 1}`,
                        wagered: parseFloat(entry.wagered) || 0,
                        avatar: entry.steam_avatar || 'images/avatar-placeholder.png',
                        prize: 0,
                        bets: 0
                    }));
                } 
                // Format 2: { error: false, data: { summarizedBets: [...] } }
                else if (responseData && responseData.error === false && responseData.data && Array.isArray(responseData.data.summarizedBets)) {
                    processedData = responseData.data.summarizedBets.map((entry, index) => {
                        const user = entry.user || {};
                        let username = user.displayName || user.username || `Player ${index + 1}`;
                        
                        // Mask username
                        if (username.length > 2) {
                            const firstTwo = username.substring(0, 2);
                            const masked = '*'.repeat(username.length - 2);
                            username = firstTwo + masked;
                        }
                        
                        return {
                            name: username,
                            wagered: (parseFloat(entry.wager) || 0) / 100,
                            avatar: user.avatar || 'images/avatar-placeholder.png',
                            prize: 0,
                            bets: entry.bets || 0
                        };
                    });
                }
                // Format tidak dikenali, coba ekstrak data langsung
                else if (responseData && responseData.data) {
                    const dataToProcess = Array.isArray(responseData.data) ? 
                        responseData.data : 
                        Object.values(responseData.data);
                    
                    if (Array.isArray(dataToProcess)) {
                        processedData = dataToProcess.map((entry, index) => ({
                            name: entry.name || entry.username || `Player ${index + 1}`,
                            wagered: parseFloat(entry.wagered || entry.wager || 0),
                            avatar: entry.steam_avatar || entry.avatar || 'images/avatar-placeholder.png',
                            prize: 0,
                            bets: entry.bets || 0
                        }));
                    }
                }

                // Jika berhasil memproses data
                if (processedData.length > 0) {
                    // Hitung hadiah berdasarkan peringkat
                    processedData = processedData.map((entry, index) => ({
                        ...entry,
                        prize: index === 0 ? 100 :  // Rank 1: 100
                               index === 1 ? 75 :   // Rank 2: 75
                               index === 2 ? 50 :   // Rank 3: 50
                               index === 3 ? 25 :   // Rank 4: 25
                               0                    // Rank 5+ : 0 (kosong)
                    }));
                    
                    // Urutkan berdasarkan jumlah taruhan (terbesar ke terkecil)
                    const sortedData = processedData.sort((a, b) => b.wagered - a.wagered);
                    
                    // Update tampilan leaderboard
                    leaderboardData = sortedData;
                    updatePodium(leaderboardData);
                    updateLeaderboard();
                    updateLastUpdated();
                    

                    return sortedData;
                }
                
                // Jika tidak ada data yang bisa diproses, lemparkan error
                throw new Error('Tidak ada data yang dapat diproses dari respons API');
                
            } catch (innerError) {
                console.error('Error processing data:', innerError);
                // Tetap tampilkan data yang tersedia meskipun format tidak sesuai
                if (responseData && responseData.data && !Array.isArray(responseData.data)) {
                    const dataArray = Object.values(responseData.data);
                    if (dataArray.length > 0) {
                        const processedData = dataArray.map((entry, index) => ({
                            name: entry.name || `Player ${index + 1}`,
                            wagered: entry.wagered || 0,
                            avatar: entry.steam_avatar || 'images/avatar-placeholder.png',
                            prize: 0,
                            bets: 0
                        }));
                        
                        const sortedData = processedData.sort((a, b) => (b.wagered || 0) - (a.wagered || 0));
                        leaderboardData = sortedData;
                        updatePodium(leaderboardData);
                        updateLeaderboard();
                        updateLastUpdated();
                        return sortedData;
                    }
                }
                
                // Jika masih gagal, lemparkan error ke pemanggil fungsi
                throw innerError;
            }
        } catch (error) {
            console.error('Error in fetchLeaderboardData:', error);
            
            let errorMessage = 'Gagal memuat data leaderboard. Silakan coba lagi nanti.';
            if (error.message.includes('Invalid content type')) {
                errorMessage = 'Format data tidak valid dari server';
            } else if (error.message.includes('HTTP error')) {
                errorMessage = 'Kesalahan server. Silakan coba lagi nanti.';
            }
            
            showError(errorMessage);
            updateLastUpdated(true);
            
            // Clear the leaderboard data
            leaderboardData = [];
            const leaderboardBody = document.getElementById('leaderboard-body');
            const podiumElement = document.getElementById('podium');
            
            if (leaderboardBody) leaderboardBody.innerHTML = '';
            if (podiumElement) podiumElement.innerHTML = '';
            
            return [];
        }
    }
    
    // Update last updated time
    function updateLastUpdated(useMockData = false) {
        const now = new Date();
        const options = { 
            timeZone: 'UTC',
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        let lastUpdatedElement = document.getElementById('last-updated');
        if (!lastUpdatedElement) {
            const leaderboardContainer = document.querySelector('.leaderboard-container');
            if (!leaderboardContainer) return;
            
            lastUpdatedElement = document.createElement('div');
            lastUpdatedElement.id = 'last-updated';
            lastUpdatedElement.className = 'last-updated';
            leaderboardContainer.appendChild(lastUpdatedElement);
        }
        
        const timeString = now.toLocaleString('en-US', options);
        const statusText = useMockData ? 'Using sample data - ' : '';
        lastUpdatedElement.textContent = `${statusText}Last updated: ${timeString} UTC`;
    }
    
    // Update countdown every second
    const countdown = setInterval(function() {
        const now = new Date();
        const distance = endDate - now;
        
        // Calculate time units
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Display the countdown
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.innerHTML = `
                <div class="countdown-item">
                    <span>${days}</span>
                    <span class="countdown-label">Days</span>
                </div>
                <span class="countdown-separator">:</span>
                <div class="countdown-item">
                    <span>${hours.toString().padStart(2, '0')}</span>
                    <span class="countdown-label">Hours</span>
                </div>
                <span class="countdown-separator">:</span>
                <div class="countdown-item">
                    <span>${minutes.toString().padStart(2, '0')}</span>
                    <span class="countdown-label">Minutes</span>
                </div>
                <span class="countdown-separator">:</span>
                <div class="countdown-item">
                    <span>${seconds.toString().padStart(2, '0')}</span>
                    <span class="countdown-label">Seconds</span>
                </div>
            `;
        }
        
        // If the countdown is finished, clear interval
        if (distance < 0) {
            clearInterval(countdown);
            if (countdownElement) {
                countdownElement.innerHTML = "<div class='countdown-ended'>Leaderboard has ended!</div>";
            }
        }
    }, 1000);
    
    
    // Initial fetch with retry logic
    const MAX_RETRIES = 2;
    let retryCount = 0;
    
    // Log environment info
    console.log('Environment Info:', {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
        apiUrl: API_URL,
        refreshInterval: REFRESH_INTERVAL
    });
    
    function fetchWithRetry() {
        fetchLeaderboardData().catch(error => {
            console.error(`Fetch error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retrying in 3 seconds... (${retryCount}/${MAX_RETRIES})`);
                setTimeout(fetchWithRetry, 3000);
            } else {
                console.log('Max retries reached');
                showError('Failed to load leaderboard after several attempts. Please try again later.');
            }
        });
    }
    
    // Start initial fetch
    fetchWithRetry();
    
    // Set up periodic refresh with error handling
    const refreshInterval = setInterval(() => {
        fetchLeaderboardData().catch(error => {
            console.error('Periodic fetch error:', error);
            // Don't show error to user on periodic refresh
        });
    }, REFRESH_INTERVAL);
    
    // Add manual refresh button handler if it exists
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            console.log('Manual refresh triggered');
            fetchWithRetry(); // Use the retry logic for manual refresh too
        });
    }
    
    // Prevent MetaMask from auto-connecting
    if (window.ethereum) {
        // Disable auto-connect
        window.ethereum.autoRefreshOnNetworkChange = false;
        
        // Remove any existing providers that might cause conflicts
        if (window.ethereum.removeAllListeners) {
            window.ethereum.removeAllListeners();
        }
        
        // Override the enable method to prevent connection prompts
        const originalEnable = window.ethereum.enable;
        if (originalEnable) {
            window.ethereum.enable = async () => {
                console.log('MetaMask connection attempt blocked');
                return [];
            };
        }
        
        console.log('Ethereum provider access has been restricted');
    }
    
    // Clean up interval when page is unloaded
    window.addEventListener('beforeunload', () => {
        clearInterval(refreshInterval);
    });
});