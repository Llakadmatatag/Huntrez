document.addEventListener('DOMContentLoaded', function() {
    const statusIndicator = document.querySelector('.live-status-indicator');
    const statusBadge = document.querySelector('.live-status-badge');
    const liveDot = document.querySelector('.live-dot');
    const liveText = document.querySelector('.live-text');
    const viewersCount = document.querySelector('.live-viewers');
    const KICK_USERNAME = 'huntrez';
    const API_URL = `https://kick.com/api/v2/channels/${KICK_USERNAME}`;
    const POLL_INTERVAL = 30000; // 30 detik
    const RETRY_DELAY = 5000; // 5 detik jika error

    // Tampilkan indikator setelah halaman dimuat
    setTimeout(() => {
        statusIndicator.classList.add('visible');
    }, 2000);

    // Fungsi untuk update tampilan status
    function updateStatus(isLive, viewers = 0) {
        if (isLive) {
            statusBadge.classList.remove('offline');
            liveText.textContent = 'LIVE';
            liveDot.style.animation = 'pulse 1.5s infinite';
            viewersCount.textContent = `${formatNumber(viewers)} viewers`;
            viewersCount.style.display = 'flex';
        } else {
            statusBadge.classList.add('offline');
            liveText.textContent = 'OFFLINE';
            liveDot.style.animation = 'none';
            liveDot.style.opacity = '0.7';
            viewersCount.style.display = 'none';
        }
    }

    // Format angka penonton
    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    // Fungsi untuk memeriksa status live
    async function checkLiveStatus() {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const isLive = data.livestream && data.livestream.is_live;
            const viewers = isLive ? data.livestream.viewer_count : 0;
            
            updateStatus(isLive, viewers);
            
            // Set timeout untuk pengecekan berikutnya
            setTimeout(checkLiveStatus, POLL_INTERVAL);
            
        } catch (error) {
            console.error('Error checking live status:', error);
            // Coba lagi setelah delay jika terjadi error
            setTimeout(checkLiveStatus, RETRY_DELAY);
        }
    }

    // Mulai pengecekan status
    checkLiveStatus();
});
