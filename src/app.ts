import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from "./routes/UserRoutes";
import adminRoutes from "./routes/AdminRoutes";

const app = express();

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use('/api/users', userRoutes);
app.use("/api/users/admin", adminRoutes);
export default app;