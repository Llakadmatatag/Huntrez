// Particle Effect for Background
class ParticleBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 100 };
        
        this.init();
    }

    init() {
        // Set canvas size and style
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '0'; // Pastikan di atas background tapi di bawah konten
        this.canvas.style.opacity = '0.7'; // Buat partikel sedikit transparan
        
        // Set canvas size
        this.resizeCanvas();
        
        // Create particles
        this.createParticles();
        
        // Event listeners
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Append canvas to body
        document.body.appendChild(this.canvas);
        
        // Start animation
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');
    }

    createParticles() {
        const particleCount = Math.floor(window.innerWidth * window.innerHeight / 10000); // Adjust density
        this.particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2 + 0.5;
            const opacity = Math.random() * 0.5 + 0.1;
            const speedX = (Math.random() - 0.5) * 0.2;
            const speedY = (Math.random() - 0.5) * 0.2;
            
            this.particles.push({
                x, y, size, opacity,
                originalX: x,
                originalY: y,
                speedX,
                speedY,
                targetX: x,
                targetY: y,
                color: `rgba(0, 239, 255, ${opacity})`,
                baseColor: `rgba(0, 239, 255, ${opacity})`,
                highlightColor: `rgba(255, 0, 184, ${opacity * 1.5})`,
                isHighlighted: false,
                highlightProgress: 0
            });
        }
    }

    handleMouseMove(event) {
        this.mouse.x = event.x;
        this.mouse.y = event.y;
    }

    connectParticles() {
        let opacity, distance;
        
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a; b < this.particles.length; b++) {
                distance = Math.sqrt(
                    Math.pow(this.particles[a].x - this.particles[b].x, 2) + 
                    Math.pow(this.particles[a].y - this.particles[b].y, 2)
                );
                
                if (distance < 100) {
                    opacity = 1 - (distance / 100);
                    this.ctx.strokeStyle = `rgba(0, 239, 255, ${opacity * 0.1})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
                    this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    updateParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Mouse interaction
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if particle is near mouse
            if (distance < this.mouse.radius * 2) {
                p.isHighlighted = true;
                
                // Push particles away from mouse
                const angle = Math.atan2(dy, dx);
                const force = (this.mouse.radius * 2 - distance) / (this.mouse.radius * 2);
                const moveX = Math.cos(angle) * force * 5;
                const moveY = Math.sin(angle) * force * 5;
                
                p.x -= moveX;
                p.y -= moveY;
                
                // Draw line to mouse
                if (distance < this.mouse.radius) {
                    this.ctx.strokeStyle = `rgba(0, 239, 255, ${0.3 * (1 - distance / this.mouse.radius)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.stroke();
                }
            } else {
                p.isHighlighted = false;
                
                // Return to original position with smooth easing
                p.x += (p.originalX - p.x) * 0.05;
                p.y += (p.originalY - p.y) * 0.05;
            }
            
            // Update highlight state
            if (p.isHighlighted && p.highlightProgress < 1) {
                p.highlightProgress += 0.05;
            } else if (!p.isHighlighted && p.highlightProgress > 0) {
                p.highlightProgress -= 0.02;
            }
            
            // Apply movement
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Bounce off edges
            if (p.x < 0 || p.x > this.canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.speedY *= -1;
            
            // Draw particle
            const currentColor = this.lerpColor(p.baseColor, p.highlightColor, p.highlightProgress);
            this.ctx.fillStyle = currentColor;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * (1 + p.highlightProgress * 0.5), 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    lerpColor(color1, color2, amount) {
        const r1 = parseInt(color1.slice(5, 8), 10);
        const g1 = parseInt(color1.slice(10, 13), 10);
        const b1 = parseInt(color1.slice(15, 18), 10);
        const a1 = parseFloat(color1.split(',')[3]);
        
        const r2 = parseInt(color2.slice(5, 8), 10);
        const g2 = parseInt(color2.slice(10, 13), 10);
        const b2 = parseInt(color2.slice(15, 18), 10);
        const a2 = parseFloat(color2.split(',')[3]);
        
        const r = Math.round(r1 + (r2 - r1) * amount);
        const g = Math.round(g1 + (g2 - g1) * amount);
        const b = Math.round(b1 + (b2 - b1) * amount);
        const a = a1 + (a2 - a1) * amount;
        
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Clear canvas with slight fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 35, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.updateParticles();
        this.connectParticles();
    }
}

// Initialize particle background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const particleBg = new ParticleBackground();
    
    // Add canvas to the body
    particleBg.canvas.style.position = 'fixed';
    particleBg.canvas.style.top = '0';
    particleBg.canvas.style.left = '0';
    particleBg.canvas.style.width = '100%';
    particleBg.canvas.style.height = '100%';
    particleBg.canvas.style.zIndex = '-1';
    particleBg.canvas.style.pointerEvents = 'none';
    
    // Insert before other content
    document.body.insertBefore(particleBg.canvas, document.body.firstChild);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        particleBg.resizeCanvas();
        particleBg.createParticles();
    });
});
