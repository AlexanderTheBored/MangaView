// auth.js

(function () {
    const user = JSON.parse(localStorage.getItem("mangaViewUser"));
    const onLoginPage = window.location.pathname.includes("login.html");
  
    if (!user && !onLoginPage) {
      window.location.href = "login.html";
      return;
    }
  
    // Optional: Redirect non-admin users from admin-only pages
    if (user?.role !== "admin" && window.location.pathname.includes("admin.html")) {
      window.location.href = "home.html";
      return;
    }
  
    // Handle logout link
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
      logoutLink.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("mangaViewUser");
        window.location.href = "login.html";
      });
    }
  
    // Optional: Show logged-in user in console or UI
    // console.log(`Logged in as: ${user.username} (${user.role})`);
  })();
  