import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/UserRoutes";
import adminRoutes from "./routes/AdminRoutes";
import profileRoutes from "./routes/ProfileRoutes";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  console.log(
    `[App] Body parsing middleware - Content-Type:`,
    req.headers["content-type"]
  );
  next();
});
app.use((req, res, next) => {
  console.log(`[App] ${req.method} ${req.url}`);
  console.log(`[App] Request body:`, req.body);
  console.log(`[App] Content-Type:`, req.headers["content-type"]);
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/users/admin", adminRoutes);
app.use("/api/profile", profileRoutes);

console.log("=== ROUTES REGISTERED ===");
console.log("User routes: /api/users");
console.log("Admin routes: /api/users/admin");
console.log("Profile routes: /api/profile");
console.log("========================");

app.get("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});
export default app;
