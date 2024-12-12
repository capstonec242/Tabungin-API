import {
    getSavings,
    addSavings,
    reduceSavings,
    getCategory,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    registerUser,
    loginUser,
    getUser,
    updatePhoto,
    updateUser,
    deleteUser,
    addGoal,
    addGoalAmount,
    updateGoal,
    deleteGoal,
} from "./handler.js";
import express from "express";
import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const routes = express.Router();

routes.post("/auth/register", registerUser);
routes.post("/auth/login", loginUser);
routes.put("/users/:userId", authenticate, updateUser);
routes.put("/users/:userId/photo", authenticate, upload.single("photo"), updatePhoto);
routes.get("/users/:userId", authenticate, getUser);
routes.delete("/users/:userId", authenticate, deleteUser);

routes.get("/savings/:userId", authenticate, getSavings);
routes.get("/savings/:userId/:savingId/:category", authenticate, getCategory)
routes.put("/savings/:userId/add", authenticate, addSavings)
routes.put("/savings/:userId/reduce", authenticate, reduceSavings)
routes.put("/savings/:userId/:savingId/:transactionId", authenticate, updateTransaction);
routes.delete("/savings/:userId/:savingId/:transactionId", authenticate, deleteTransaction);

routes.post("/savings/:userId/:savingId/budget", authenticate, addBudget);
routes.put("/savings/:userId/:savingId/budget/:budgetId", authenticate, updateBudget);
routes.delete("/savings/:userId/:savingId/budget/:budgetId", authenticate, deleteBudget);

routes.post("/goals/:userId/:savingId", authenticate, addGoal);
routes.post("/goals/:userId/:savingId/:goalId", authenticate, addGoalAmount);
routes.put("/goals/:userId/:savingId/:goalId", authenticate, updateGoal);
routes.delete("/goals/:userId/:savingId/:goalId", authenticate, deleteGoal);

export default routes;
