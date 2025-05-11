const track = document.getElementById("carousel-track");
const maxCovers = 10; // Limit to 10 covers
const basePath = "assets/test_cover_";
const extension = ".jpg";

let loadedCount = 0;
let failedAttempts = 0;
const maxFailures = 5;

function tryLoadCovers(startFrom) {
  // Clear previous images
  track.innerHTML = "";

  for (let i = startFrom; i > 0 && loadedCount < maxCovers && failedAttempts < maxFailures; i--) {
    const img = new Image();
    const fileName = `${basePath}${i}${extension}`;
    img.src = fileName;

    img.onload = () => {
      const card = document.createElement('div');
      card.className = 'manga-card';
      card.appendChild(img);
      track.appendChild(card);
      loadedCount++;
    };

    img.onerror = () => {
      failedAttempts++;
    }
  }

  // Delay to allow DOM update
  setTimeout(initializeCarousel, 500);
}

function initializeCarousel() {
  const slides = Array.from(track.children);
  const prevBtn = document.querySelector('.prev-button');
  const nextBtn = document.querySelector('.next-button');
  const slideGap = 20;
  let currentIndex = 0;

  const slideWidth = slides[0].offsetWidth + slideGap;

  // Clone the first slide to enable looping
  const firstClone = slides[0].cloneNode(true);
  track.appendChild(firstClone);

  const totalSlides = slides.length + 1;

  function goToSlide(index) {
    track.style.transition = 'transform 0.6s ease-in-out';
    track.style.transform = `translateX(-${index * slideWidth}px)`;
    currentIndex = index;
  }

  function moveToNextSlide() {
    if (currentIndex >= totalSlides - 1) {
      currentIndex = 0;
      track.style.transition = 'none';
      track.style.transform = `translateX(0px)`;
      setTimeout(() => {
        track.style.transition = 'transform 0.6s ease-in-out';
        goToSlide(currentIndex + 1);
      }, 20);
    } else {
      goToSlide(currentIndex + 1);
    }
  }

  function moveToPreviousSlide() {
    if (currentIndex === 0) {
      currentIndex = totalSlides - 2;
      track.style.transition = 'none';
      track.style.transform = `translateX(-${(totalSlides - 2) * slideWidth}px)`;
      setTimeout(() => {
        track.style.transition = 'transform 0.6s ease-in-out';
        goToSlide(currentIndex - 1);
      }, 20);
    } else {
      goToSlide(currentIndex - 1);
    }
  }

  nextBtn.addEventListener('click', moveToNextSlide);
  prevBtn.addEventListener('click', moveToPreviousSlide);

  setInterval(moveToNextSlide, 2000); // Autoplay
}

tryLoadCovers(50); // Try loading from the latest cover number
