# How to use this shopApp?

-   clone it into your repo
-   npm install
-   create a privateConstants.js file which contains the following code:

```
// this is only for enabling sendGrid email through this app
const sendGridApiKey =
    "<Your send grid API Key>";
const senderEmail = "<The provided email>";

// this is for the database
const mongodbPassword = "<mongo_db_password>";

module.exports.mongodbPassword = mongodbPassword;
module.exports.sendGridApiKey = sendGridApiKey;
module.exports.senderEmail = senderEmail;

```

## Small description...

-   this is adopted from a node.js course
-   we use **ejs** for templating and nodejs for backend
-   the client and server is not decoupled
-   **express** is used for backend logic... routing and all
-   **MVC** architecture
-   **mongodb** is used for the database

# Features:

## Authentication

### encrypting password

-   done with the help of external package bcryptjs
-   store password in hashed form
-   using package `bcryptjs`

### route production

-   done by implementing an extra middleware `isAuth` in the router for example:
    `router.get("/add-product", isAuth, adminController.getAddProduct);`

### CSRF Attacks

-   to prevent csrf attacks we use `csurf` package which prevents any post request without access tokens
-   passed as a hidden input with the form in ejs files

### Notification for invalid auth

-   uses connect-flash package to store error messages in the session cookie

### sending email

-   we use send grid service and two corresponding packages `nodemailer` and `nodemailer-sendgrid-transport`
-   in our case the senderIdentity requirement fails

## Advanced authentication

### Reseting password

-   send an email with a newly created token
-   add logic to implement the same...
-   since the mail sending system is not working, this part is skipped

### Authorization

-   prevent admins to edit or delete products other than his own

## Validation

-   `express-validator` package for validating the inputs in sign up form
-   change some display styles and display error messages

## Error handling

-   throwing error instead of console.log
-   we redirect to error 500 page

## File upload and download

-   bodyParser cannot parse files
-   we need `multer` package for the same
-   creating pdf for invoices `pdfKit`

## Pagination

-   to add page 1, 2 ...
-   all the products item need not be rendered all at once

## Async Request

-   treating client and server independently
-   only deleting admin products has been implemented with async call
-   client updates independently after server success response

## Adding Payments

-   this is done with the help of _stripe_
-   this part is not implemented in the application
-   disable csrf protection in case the form is rendered by different vendor
-   we can do this by enabling the `app.use(csrfProtection)` after `app.post('create-order')`
