const express = require("express");
const { check, body } = require("express-validator");
const authController = require("../controllers/auth");
const User = require("../models/user");
const router = express.Router();

router.get("/login", authController.getLogin);
router.post(
    "/login",
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a valid email.")
            .normalizeEmail(),
        body("password", "Password has to be valid").isAlphanumeric().trim(),
    ],
    authController.postLogin
);
router.post("/logout", authController.postLogout);
router.get("/signup", authController.getSignup);
router.post(
    "/signup",
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a valid email.")
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then((userDoc) => {
                    if (userDoc) {
                        return Promise.reject("Email exists already!");
                    }
                });
            })
            .normalizeEmail(),
        body(
            "password",
            "Please enter a alpha-numeric password with more than 7 characters."
        )
            .isLength({ min: 7 })
            .isAlphanumeric(),
        body("confirmPassword").custom((value, { req }) => {
            if (value !== req.body.password) {
                return Promise.reject("Passwords have to match");
            }
            return true;
        }),
    ],
    authController.postSignup
);

module.exports = router;
