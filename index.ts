import express from "express";
import cors from "cors";
import "dotenv/config";

import auth from "./src/routes/auth.js";
import restaurants from "./src/routes/restaurants.js";
import items from "./src/routes/items.js";
import orders from "./src/routes/orders.js";
import reviews from "./src/routes/reviews.js";
import analytics from "./src/routes/analytics.js";
import registers from "./src/routes/registers.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, name: "Edécio Delivery API" }));

app.use("/auth", auth);
app.use("/restaurants", restaurants);
app.use("/items", items);
app.use("/orders", orders);
app.use("/reviews", reviews);
app.use("/analytics", analytics);
app.use("/registers", registers);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("API on http://localhost:" + port));
