const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Routes
const app = express();
const sessionRoutes = require("./routes/session");

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/session", sessionRoutes);

const PORT = process.env.PORT || 5000;

mongoose.set({ strictQuery: true });
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.log(err));
