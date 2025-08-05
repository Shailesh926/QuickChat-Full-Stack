import express from "express";
import { addContact, addGroup, checkAuth, login, signup, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);
userRouter.post("/add-contact", protectRoute, addContact); 
userRouter.post("/create-group", protectRoute, addGroup);

export default userRouter;