
const express = require("express");
const path = require("path");
const app = express();
const PORT = require("../config.json").port;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/api/chatgpt", (req, res) => {
    const { message } = req.body;
    const { exec } = require("child_process");
    exec(`php backend/api/chatgpt.php "${message}"`, (error, stdout) => {
        if (error) {
            res.status(500).json({ error: error.message });
        } else {
            res.json({ reply: stdout.trim() });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
