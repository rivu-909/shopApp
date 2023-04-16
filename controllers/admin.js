const Product = require("../models/product");
const { validationResult } = require("express-validator");
const fileHelper = require("../util/file");

exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
};

exports.postAddProduct = (req, res, next) => {
    const { title, description, price } = req.body;
    const image = req.file;
    if (!image) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/edit-product",
            editing: false,
            hasError: true,
            product: { title, description, price },
            errorMessage: "Attached file is not an image.",
            validationErrors: [],
        });
    }
    const imageUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user,
    });
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(500).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/edit-product",
            editing: false,
            hasError: true,
            product: { title, imageUrl, description, price },
            errorMessage: "Database operation failed, please try again",
            validationErrors: errors.array(),
        });
    }

    product
        .save()
        .then(() => {
            console.log("PRODUCT CREATED");
            res.redirect("/");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        res.redirect("/");
        return;
    }

    const prodId = req.params.productId;
    Product.findById(prodId).then((product) => {
        if (!product) {
            res.redirect("/");
            return;
        }
        res.render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: editMode,
            product: product,
            hasError: false,
            errorMessage: null,
            validationErrors: [],
        });
    });
};

exports.postEditProduct = (req, res, next) => {
    const { prodId, title, description, price } = req.body;
    const image = req.file;
    if (!image) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/edit-product",
            editing: false,
            hasError: true,
            product: { title, description, price },
            errorMessage: "Attached file is not an image.",
            validationErrors: [],
        });
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            hasError: true,
            product: { title, description, price, _id: prodId },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }
    Product.findById(prodId)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect("/");
            }
            product.title = title;
            product.price = price;
            product.description = description;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            return product.save().then((result) => {
                console.log("UPDATED_PRODUCT");
                res.redirect("/admin/products");
            });
        })

        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id }).then((products) => {
        res.render("admin/products", {
            pageTitle: "Admin Products",
            prods: products,
            path: "/admin/products",
        });
    });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return next(new Error("Product not found."));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then((result) => {
            console.log("DELETED PRODUCT");
            return res.status(200).json({
                message: "Success!",
            });
        })
        .catch((err) => {
            res.status(500).json({ message: "Deleting product failed!" });
        });
};
