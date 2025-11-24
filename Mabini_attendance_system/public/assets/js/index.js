// Carousel functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.dot');
let autoPlayInterval;

function goToSlide(index) {
    // Remove active class from current slide and dot
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    // Update current slide
    currentSlide = index;
    
    // Add active class to new slide and dot
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    
    // Reset autoplay timer
    resetAutoPlay();
}

function nextSlide() {
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next);
}

function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

// Start autoplay when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    resetAutoPlay();
    
    // Pause autoplay on hover
    const brandingSide = document.querySelector('.branding-side');
    if (brandingSide) {
        brandingSide.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });
        brandingSide.addEventListener('mouseleave', () => {
            resetAutoPlay();
        });
    }
});
