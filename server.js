// server.js
const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;
const staticDir = path.join(__dirname);

// 1) Serve every existing file under your project root
app.use(express.static(staticDir));

// 2) If nothing matched above, just return index.html
app.use((req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ MangaView running at http://localhost:${PORT}`);
});
