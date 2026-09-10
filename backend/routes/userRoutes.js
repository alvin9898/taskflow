import { Router } from "express";

import {
  listUsers,
  getUser,
  updateUser,
  deleteUser
} from "../controllers/userController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

const router =
  Router();


/* =========================================
   ALL USER ROUTES REQUIRE LOGIN
   ========================================= */

router.use(protect);


/* =========================================
   LIST USERS
   Manager + Admin
   ========================================= */

router.get(
  "/",
  authorize(
    "Manager",
    "Admin"
  ),
  listUsers
);


/* =========================================
   GET USER
   ========================================= */

router.get(
  "/:id",
  getUser
);


/* =========================================
   UPDATE USER
   ========================================= */

router.put(
  "/:id",
  authorize(
    "Admin",
    "Manager",
    "Team Member"
  ),
  updateUser
);


/* =========================================
   DELETE USER
   ========================================= */

router.delete(
  "/:id",
  authorize("Admin"),
  deleteUser
);


export default router;