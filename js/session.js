document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("mangaViewUser");
  const role = localStorage.getItem("mangaViewRole");
  const justLoggedIn = localStorage.getItem("justLoggedIn") === "true";
  const currentPage = window.location.pathname.split("/").pop();
  const publicPages = ["home.html", "browse.html", "latest.html"];

  // If logged in and trying to access login, redirect
  if (user && role === "admin" && justLoggedIn && publicPages.includes(currentPage)) {
    localStorage.setItem("justLoggedIn", "false");
    window.location.href = "admin.html";
    return;
  }

  if (currentPage === "login.html") return;

  // Update navigation for logout option if logged in
  const navItems = document.querySelectorAll(".site-nav li");
  navItems.forEach(item => {
    const link = item.querySelector("a");
    if (link && link.textContent.trim().toLowerCase() === "login" && user) {
      const logoutLi = document.createElement("li");
      const logoutLink = document.createElement("a");
      logoutLink.href = "#";
      logoutLink.textContent = "Logout";
      logoutLink.addEventListener("click", e => {
        e.preventDefault();
        localStorage.removeItem("mangaViewUser");
        localStorage.removeItem("mangaViewRole");
        localStorage.removeItem("justLoggedIn");
        window.location.href = "login.html";
      });
      logoutLi.appendChild(logoutLink);
      item.replaceWith(logoutLi);
    }
  });
});
