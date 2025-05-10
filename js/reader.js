
let isScrollMode = true;
let isDark = false;
let currentPage = 1;
const totalPages = 2;

function toggleMode() {
  isScrollMode = !isScrollMode;
  document.getElementById("scroll-mode").style.display = isScrollMode ? "block" : "none";
  document.getElementById("page-mode").style.display = isScrollMode ? "none" : "block";
}

function toggleTheme() {
  isDark = !isDark;
  document.body.className = isDark ? "dark-mode" : "light-mode";
}

function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    updatePage();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    updatePage();
  }
}

function updatePage() {
  document.getElementById("paged-img").src = `https://via.placeholder.com/800x1200?text=Page+${currentPage}`;
}
