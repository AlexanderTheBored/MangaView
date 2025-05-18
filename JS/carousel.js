document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById("carousel-track");
  const maxCovers = 10;
  const basePath = "assets/test_cover_";
  const extension = ".jpg";
  let autoPlayInterval;
  let slideWidth = 0;
  let currentPosition = 0;
  let maxPosition = 0;
  let isAnimating = false;

  // Animation style
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.5s forwards;
    }
    #carousel-track {
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }
  `;
  document.head.appendChild(style);

  // Load covers with animation
  function loadCovers() {
    track.innerHTML = "";
    
    for (let i = 1; i <= maxCovers; i++) {
      const card = document.createElement('div');
      card.className = 'snap-center flex-shrink-0 w-48 h-72 md:w-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-fadeIn';
      card.style.animationDelay = `${i * 0.1}s`;
      
      const img = new Image();
      img.src = `${basePath}${i}${extension}`;
      img.className = "w-full h-full object-cover transition-transform duration-500 hover:scale-105";
      img.alt = `Manga Cover ${i}`;
      img.onerror = function() {
        console.error(`Failed to load image: ${this.src}`);
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" fill="%23e5e7eb"><rect width="100" height="150"/><text x="50" y="75" font-family="Arial" font-size="12" text-anchor="middle" fill="%239ca3af">Cover ${i}</text></svg>';
      };
      
      card.appendChild(img);
      track.appendChild(card);
    }
    
    initializeCarousel();
  }

  function initializeCarousel() {
    const slides = Array.from(track.children);
    if (slides.length === 0) return;

    slideWidth = slides[0].offsetWidth + 24; // 24px gap
    currentPosition = -slideWidth; // Start at first real slide
    maxPosition = -((slides.length) * slideWidth);

    // Clone first and last slides for infinite effect
    const cloneFirst = slides[0].cloneNode(true);
    const cloneLast = slides[slides.length - 1].cloneNode(true);
    
    // Add unique identifiers to prevent confusion
    cloneFirst.classList.add('clone-first');
    cloneLast.classList.add('clone-last');
    
    track.prepend(cloneLast);
    track.appendChild(cloneFirst);

    // Set initial position
    track.style.transform = `translateX(${currentPosition}px)`;

    // Handle transition end for infinite looping
    track.addEventListener('transitionend', handleTransitionEnd);

    // Button controls
    document.querySelector('.next-button').addEventListener('click', () => {
      if (!isAnimating) nextSlide();
    });

    document.querySelector('.prev-button').addEventListener('click', () => {
      if (!isAnimating) prevSlide();
    });

    // Auto-play with pause on hover
    function resetAutoPlay() {
      clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(() => {
        if (!isAnimating) nextSlide();
      }, 3000);
    }

    track.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    track.addEventListener('mouseleave', resetAutoPlay);
    resetAutoPlay();

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      slideWidth = track.children[0].offsetWidth + 24;
      maxPosition = -((track.children.length - 2) * slideWidth);
      track.style.transition = 'none';
      track.style.transform = `translateX(${currentPosition}px)`;
      setTimeout(() => {
        track.style.transition = '';
      }, 50);
    });
    resizeObserver.observe(track);
  }

  function handleTransitionEnd() {
    isAnimating = false;
    
    // Check if we need to jump to the opposite end
    if (currentPosition > 0) {
      jumpToPosition(-((track.children.length - 2) * slideWidth), false);
    } else if (currentPosition < -((track.children.length - 1) * slideWidth)) {
      jumpToPosition(-slideWidth, false);
    }
  }

  function jumpToPosition(position, smooth = true) {
    isAnimating = smooth;
    track.style.transition = smooth ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
    track.style.transform = `translateX(${position}px)`;
    currentPosition = position;
  }

  function nextSlide() {
    if (isAnimating) return;
    isAnimating = true;
    
    const newPosition = currentPosition - slideWidth;
    if (newPosition < -((track.children.length - 1) * slideWidth)) {
      jumpToPosition(-slideWidth, false);
      setTimeout(() => {
        jumpToPosition(-2 * slideWidth);
      }, 20);
    } else {
      jumpToPosition(newPosition);
    }
    
    resetAutoPlay();
  }

  function prevSlide() {
    if (isAnimating) return;
    isAnimating = true;
    
    const newPosition = currentPosition + slideWidth;
    if (newPosition > 0) {
      jumpToPosition(-((track.children.length - 2) * slideWidth), false);
      setTimeout(() => {
        jumpToPosition(-((track.children.length - 3) * slideWidth));
      }, 20);
    } else {
      jumpToPosition(newPosition);
    }
    
    resetAutoPlay();
  }

  // Initialize the carousel
  loadCovers();
});