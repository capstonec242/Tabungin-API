import {
    getSavings,
    addSavings,
    reduceSavings,
    getCategory,
    updateTransaction,
    deleteTransaction,
    registerUser,
    loginUser,
    getUser,
    updateUser,
    deleteUser,
    addGoal,
    getGoals,
    updateGoal,
    deleteGoal,
} from "./handler.js";
import express from "express";
import { authenticate } from "../middleware/auth.js";

const routes = express.Router();

routes.post("/auth/register", registerUser);
routes.post("/auth/login", loginUser);
routes.put("/users/:userId", authenticate, updateUser);
routes.get("/users/:userId", authenticate, getUser);
routes.delete("/users/:userId", authenticate, deleteUser);

routes.get("/savings/:userId", authenticate, getSavings);
routes.get("/savings/:userId/:savingId/category", authenticate, getCategory)
routes.put("/savings/:userId/add", authenticate, addSavings)
routes.put("/savings/:userId/reduce", authenticate, reduceSavings)
routes.put("/savings/:userId/:savingId/:transactionId", authenticate, updateTransaction);
routes.delete("/savings/:userId/:savingId/:transactionId", authenticate, deleteTransaction);

routes.post("/goals/:userId/:savingId", authenticate, addGoal);
routes.get("/goals/:userId/:savingId", authenticate, getGoals);
routes.put("/goals/:userId/:savingId/:goalId", authenticate, updateGoal);
routes.delete("/goals/:userId/:savingId/:goalId", authenticate, deleteGoal);

export default routes;
