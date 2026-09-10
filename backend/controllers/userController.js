import bcrypt from "bcryptjs";

import User from "../models/User.js";


/* =========================================
   LIST USERS
   ========================================= */

export async function listUsers(req, res) {

  const users =
    await User.find()
      .select(
        "-password -resetToken -resetTokenExpires"
      )
      .sort({
        createdAt: 1
      });

  res.json({
    users
  });
}


/* =========================================
   GET USER
   ========================================= */

export async function getUser(req, res) {

  const user =
    await User.findById(
      req.params.id
    ).select(
      "-password -resetToken -resetTokenExpires"
    );

  if (!user) {

    return res.status(404).json({
      message: "User not found"
    });

  }

  res.json({
    user
  });
}


/* =========================================
   UPDATE USER
   ========================================= */

export async function updateUser(req, res) {

  const requestedUserId =
    String(req.params.id);

  const loggedInUserId =
    String(req.user._id);


  /*
    Only Admin can update
    another user's account.

    Manager / Team Member
    can update only their
    own profile.
  */

  if (
    requestedUserId !==
      loggedInUserId &&
    req.user.role !== "Admin"
  ) {

    return res.status(403).json({
      message:
        "You can only update your own profile"
    });

  }


  const user =
    await User.findById(
      req.params.id
    );

  if (!user) {

    return res.status(404).json({
      message: "User not found"
    });

  }


  const {
    name,
    email,
    role,
    status,
    password,
    phone,
    designation
  } = req.body;


  /* =========================================
     BASIC PROFILE INFORMATION
     ========================================= */

  if (
    name !== undefined
  ) {

    user.name =
      name.trim();

  }


  if (
    phone !== undefined
  ) {

    user.phone =
      phone.trim();

  }


  if (
    designation !== undefined
  ) {

    user.designation =
      designation.trim();

  }


  /* =========================================
     EMAIL
     ========================================= */

  if (
    email !== undefined
  ) {

    user.email =
      email
        .toLowerCase()
        .trim();

  }


  /* =========================================
     ADMIN ONLY FIELDS
     ========================================= */

  if (
    req.user.role === "Admin"
  ) {

    if (
      role !== undefined
    ) {

      user.role =
        role;

    }


    if (
      status !== undefined
    ) {

      user.status =
        status;

    }

  }


  /* =========================================
     PASSWORD
     ========================================= */

  if (
    password
  ) {

    user.password =
      await bcrypt.hash(
        password,
        12
      );

  }


  /* =========================================
     SAVE
     ========================================= */

  await user.save();


  /* =========================================
     RESPONSE
     ========================================= */

  res.json({

    message:
      "User updated successfully",

    user: {

      id:
        user._id,

      name:
        user.name,

      email:
        user.email,

      phone:
        user.phone,

      designation:
        user.designation,

      role:
        user.role,

      status:
        user.status

    }

  });

}


/* =========================================
   DELETE USER
   ========================================= */

export async function deleteUser(
  req,
  res
) {

  if (
    String(req.user._id) ===
    req.params.id
  ) {

    return res.status(400).json({
      message:
        "You cannot delete your own account"
    });

  }


  const user =
    await User.findByIdAndDelete(
      req.params.id
    );


  if (!user) {

    return res.status(404).json({
      message:
        "User not found"
    });

  }


  res.json({
    message:
      "User deleted successfully"
  });

}