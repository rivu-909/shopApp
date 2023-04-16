const fs = require("fs");
const path = require("path");
const Order = require("../models/order");
const Product = require("../models/product");
const PDFDocuemnt = require("pdfkit");

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
    const page = +(!req.query.page ? 1 : req.query.page);

    let totalItems;
    Product.find()
        .count()
        .then((numProducts) => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then((products) => {
            res.render("shop/index", {
                pageTitle: "Shop",
                prods: products,
                path: "/",
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        });
};

exports.getProducts = (req, res, next) => {
    const page = +(!req.query.page ? 1 : req.query.page);

    let totalItems;
    Product.find()
        .count()
        .then((numProducts) => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then((products) => {
            res.render("shop/product-list", {
                pageTitle: "All Products",
                prods: products,
                path: "/products",
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((p) => {
            res.render("shop/product-details", {
                pageTitle: p.title,
                product: p,
                path: "/products",
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .then((user) => {
            const products = user.cart.items;
            res.render("shop/cart", {
                path: "/cart",
                pageTitle: "Your Cart",
                products: products,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then((product) => {
            return req.user.addToCart(product);
        })
        .then((result) => {
            res.redirect("/cart");
        });
};

exports.getOrders = (req, res, next) => {
    Order.find({ "user.userId": req.user._id }).then((orders) => {
        res.render("shop/orders", {
            pageTitle: "Your Orders",
            path: "/orders",
            orders: orders,
        });
    });
};

exports.getCheckout = (req, res, next) => {
    req.user.populate("cart.items.productId").then((user) => {
        const products = user.cart.items;
        let total = 0;
        products.forEach((p) => {
            total += p.quantity * p.productId.price;
        });
        res.render("shop/checkout", {
            pageTitle: "Checkout",
            path: "/checkout",
            products: products,
            totalSum: total,
        });
    });
};

exports.postOrder = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .then((user) => {
            const products = user.cart.items.map((i) => ({
                quantity: i.quantity,
                product: { ...i.productId._doc },
            }));
            const order = new Order({
                user: {
                    userId: req.user,
                },
                products: products,
            });
            return order.save();
        })
        .then((result) => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect("/orders");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user
        .removeFromCart(prodId)
        .then((result) => {
            res.redirect("/cart");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;

    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                return next(newError("No order found."));
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error("Unauthorized"));
            }
            const invoiceName = "invoice-" + orderId + ".pdf";
            const invoicePath = path.join("data", "invoices", invoiceName);

            const pdfDoc = new PDFDocuemnt();
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="' + invoiceName + '"'
            );
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text("Invoice", { underline: true });
            pdfDoc.fontSize(14);
            let totalPrice = 0;
            order.products.forEach((prod) => {
                totalPrice = totalPrice + prod.quantity * prod.product.price;
                pdfDoc.text(
                    prod.product.title +
                        " - " +
                        prod.quantity +
                        " x " +
                        "Rs." +
                        prod.product.price
                );
            });
            pdfDoc.text("Total Price: Rs." + totalPrice);
            pdfDoc.end();
        })
        .catch((err) => next(err));
};
