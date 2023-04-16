const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");
const User = require("./models/user");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const { mongodbPassword } = require("./privateConstants");
const multer = require("multer");

const MONGODB_URI = `mongodb+srv://Arkojit:${mongodbPassword}@rivu-909.1fcvtlq.mongodb.net/shop`;

const app = express();
const store = new MongoDbStore({
    uri: MONGODB_URI,
    collection: "sessions",
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, _callback) => {
        _callback(null, "images");
    },
    filename: (req, file, _callback) => {
        _callback(null, file.originalname);
    },
});

const fileFilter = (req, file, _callback) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        _callback(null, true);
    } else {
        _callback(null, true);
    }
};

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
    session({
        secret: "my-secret",
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    console.log(error);
    res.redirect("/500");
});

mongoose
    .connect(MONGODB_URI)
    .then((result) => {
        console.log("connected again");
        app.listen(3000);
    })
    .catch((err) => console.log(err));
