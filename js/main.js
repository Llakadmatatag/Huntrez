// Main JavaScript for Huntrez Rewards

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjust for fixed header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Function to add animation classes with delay
    function animateElements() {
        // Hero section elements
        const heroElements = document.querySelectorAll('.logo-container, .hero p, .featured-leaderboard, .cta-buttons');
        heroElements.forEach((element, index) => {
            element.classList.add('animate-on-load');
            element.style.animationDelay = `${index * 0.2}s`;
        });

        // Footer elements
        const footerElements = document.querySelectorAll('.footer-section, .footer-bottom');
        footerElements.forEach((element, index) => {
            element.classList.add('animate-on-load');
            element.style.animationDelay = `${0.5 + (index * 0.15)}s`;
        });

        // Other elements with scroll animation
        const scrollElements = document.querySelectorAll('.leaderboard-card, .bonus-card, .section-title');
        scrollElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            element.style.transitionDelay = `${0.3 + (index * 0.1)}s`;
        });
    }

    // Add animation on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.leaderboard-card, .bonus-card, .section-title, .promo-card, .section-header, .exclusive-bonuses');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                
                // Add special animation for promo cards
                if (element.classList.contains('promo-card')) {
                    element.style.transition = 'all 0.6s cubic-bezier(0.5, 0, 0, 1) ' + (element.dataset.delay || '0') + 's';
                }
            }
        });
    };

    // Initialize animations
    setTimeout(animateElements, 300); // Small delay to ensure DOM is fully loaded
    
    // Add staggered delay for promo cards
    document.querySelectorAll('.promo-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.98)';
        card.style.transition = 'all 0.6s cubic-bezier(0.5, 0, 0, 1)';
        card.dataset.delay = index * 0.15; // Staggered delay
    });
    
    // Initialize section header
    const sectionHeader = document.querySelector('.section-header');
    if (sectionHeader) {
        sectionHeader.style.opacity = '0';
        sectionHeader.style.transform = 'translateY(20px)';
        sectionHeader.style.transition = 'all 0.8s ease-out';
    }
    
    // Initial check for elements in viewport
    window.addEventListener('load', () => {
        animateOnScroll();
        window.addEventListener('scroll', animateOnScroll);
        
        // Initialize modal functionality
        initBonusInfoModal();
    });
    
    // Bonus Info Modal Functionality
    function initBonusInfoModal() {
        const modal = document.getElementById('bonusInfoModal');
        const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
        const infoLinks = document.querySelectorAll('.show-bonus-info');
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        // Show modal when info link is clicked
        infoLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const site = link.getAttribute('data-site');
                openModal(site);
            });
        });
        
        // Close modal when close button is clicked
        closeBtns.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Close modal when clicking outside the content
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
        
        function openModal(site) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Switch to the correct tab based on which link was clicked
            if (site) {
                switchTab(site);
            }
        }
        
        function closeModal() {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
        
        function switchTab(tabId) {
            // Update active tab button
            tabBtns.forEach(btn => {
                if (btn.getAttribute('data-tab') === tabId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Show active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        }
    }
    
    window.addEventListener('scroll', animateOnScroll);
});
