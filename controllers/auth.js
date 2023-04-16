const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { sendGridApiKey, senderEmail } = require("../privateConstants");
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key: sendGridApiKey,
        },
    })
);

exports.getLogin = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/login", {
        pageTitle: "Login",
        path: "/login",
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
        },
        validationErrors: [],
    });
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/login", {
            path: "login",
            pageTitle: "/login",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
            },
            validationErrors: errors.array(),
        });
    }

    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                return res.status(422).render("auth/login", {
                    path: "login",
                    pageTitle: "/login",
                    errorMessage: "Invalid email or password.",
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: [],
                });
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        req.session.user = user;
                        req.session.isLoggedIn = true;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect("/");
                        });
                    }
                    return res.status(422).render("auth/login", {
                        path: "login",
                        pageTitle: "/login",
                        errorMessage: "Invalid email or password.",
                        oldInput: {
                            email: email,
                            password: password,
                        },
                        validationErrors: [],
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect("/login");
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect("/");
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/signup", {
        pageTitle: "Sign Up",
        path: "/signup",
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationErrors: [],
    });
};

exports.postSignup = (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/signup", {
            pageTitle: "Sign Up",
            path: "/signup",
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword,
            },
            validationErrors: errors.array(),
        });
    }

    return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] },
            });
            return user
                .save()
                .then((result) => {
                    res.redirect("/login");
                    return transporter.sendMail({
                        to: email,
                        from: senderEmail,
                        subject: "Signup succeeded",
                        html: "<h1> You successfully signed up! </h1>",
                    });
                })
                .then((msg) => console.log(msg))
                .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
