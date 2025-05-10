(function () {
  const user = JSON.parse(localStorage.getItem("mangaViewUser"));
  const onLoginPage = window.location.pathname.includes("login.html");

  // Protect all pages except login
  if (!user && !onLoginPage) {
    window.location.href = "login.html";
    return;
  }

  // Optional: Redirect non-admin users from admin-only pages
  if (user?.role !== "admin" && window.location.pathname.includes("admin.html")) {
    window.location.href = "home.html";
    return;
  }

  // Logout link functionality
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("mangaViewUser");
      localStorage.removeItem("mangaViewRole");
      localStorage.removeItem("justLoggedIn");
      window.location.href = "login.html";
    });
  }

  // Optional: Show logged-in user info (for debugging or UI purposes)
  // console.log(`Logged in as: ${user.username} (${user.role})`);
})();
