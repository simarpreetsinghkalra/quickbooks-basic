const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const intuitOauth = require("intuit-oauth");
const nodeQuickbooks = require("node-quickbooks");

const app = express();

const dotenv = require("dotenv");
dotenv.config();

const dbHelper = require("./db-helper");

const quickBookConfig = {
  clientId: process.env.QUICKBOOK_CLIENT_ID,
  clientSecret: process.env.QUICKBOOK_CLIENT_SECRET,
  redirectUri: process.env.QUICKBOOK_REDIRECT_URI,
  realmId: process.env.QUICKBOOK_REALM_ID,
};

const oauthClient = new intuitOauth({
  clientId: quickBookConfig.clientId,
  clientSecret: quickBookConfig.clientSecret,
  environment: "sandbox",
  redirectUri: quickBookConfig.redirectUri,
});

let qbo;
let oauth2_token_json;

// -------- QBO FUNCTIONS --------
const createCustomer = (displayName) => {
  const promise = new Promise((resolve, reject) => {
    console.log("Creating Customer", displayName);
    qbo.createCustomer({ DisplayName: displayName }, async (err, customer) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      try {
        await dbHelper
          .Customer({
            displayName: customer["DisplayName"],
            id: customer["Id"],
          })
          .save();
      } catch (err) {
        console.log(err);
        reject(err);
      }
      resolve(customer);
    });
  });
  return promise;
};

const createSAInvoice = async (customerID, amount = 1000) => {
  const promise = new Promise((resolve, reject) => {
    qbo.createInvoice(
      {
        CustomerRef: {
          value: customerID,
        },
        Line: [
          {
            Amount: amount,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
              ItemRef: {
                name: "Salary Advance",
                value: "31",
              },
              TaxCodeRef: {
                value: "7",
              },
            },
          },
        ],
        DueDate: "2022-01-31",
        TxnDate: "2022-01-25",
      },
      function (err, invoice) {
        if (err) {
          reject(err);
        }
        resolve(invoice);
      }
    );
  });
  return promise;
};

const createFeeInvoice = (customerID, amount = 100) => {
  const promise = new Promise((resolve, reject) => {
    qbo.createInvoice(
      {
        CustomerRef: {
          value: customerID,
        },
        Line: [
          {
            Amount: amount,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
              ItemRef: {
                name: "Tip",
                value: "30",
              },
              TaxCodeRef: {
                value: "11",
              },
            },
          },
        ],
        DueDate: "2022-01-31",
        TxnDate: "2022-01-25",
      },
      function (err, invoice) {
        if (err) {
          reject(err);
        }
        resolve(invoice);
      }
    );
  });
  return promise;
};

const createPayment = (customerId, amount, invoiceId) => {
  const promise = new Promise((resolve, reject) => {
    qbo.createPayment(
      {
        CustomerRef: {
          value: customerId,
        },
        TotalAmt: amount,
        TxnDate: "2020-25-01",
        Line: [
          {
            Amount: amount,
            LinkedTxn: [
              {
                TxnId: invoiceId,
                TxnType: "Invoice",
              },
            ],
          },
        ],
      },
      function (err, payment) {
        if (err) {
          reject(err);
        }
        resolve(payment);
      }
    );
  });
  return promise;
};

const generateAuthLink = () => {
  const authUri = oauthClient.authorizeUri({
    scope: [intuitOauth.scopes.Accounting, intuitOauth.scopes.OpenId],
    state: "intuit-test",
  });
  return authUri;
};

// -------- APP FUNCTIONS --------
const initApp = () => {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.set("view engine", "ejs");
};

const initDB = () => {
  mongoose
    .connect(
      `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(
        process.env.MONGO_PASSWORD
      )}@${process.env.MONGO_CLUSTER}/${
        process.env.MONGO_DB
      }?retryWrites=true&w=majority`
    )
    .then(() => {
      console.log("Connected to MongoDB 📑");
    })
    .catch((err) => console.log(err));
};

initApp();
initDB();

app.get("/", (req, res) => {
  res.render("index", { authLink: generateAuthLink() });
});

app.get("/auth", (req, res) => {
  res.send(`<a href="${generateAuthLink()}">Login with Intuit</a>`);
});

app.get("/callback", (req, res) => {
  oauthClient
    .createToken(req.url)
    .then(function async(authResponse) {
      oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
      qbo = new nodeQuickbooks(
        quickBookConfig.clientId,
        quickBookConfig.clientSecret,
        JSON.parse(oauth2_token_json)["access_token"],
        false,
        quickBookConfig.realmId,
        true,
        true,
        null,
        "2.0",
        JSON.parse(oauth2_token_json)["refresh_token"]
      );
      res.send(
        `<p>You are logged in!</p><br><a href="/customers">View Customers</a>`
      );
    })
    .catch(function (e) {
      console.error(e);
      res.redirect("/");
    });
});

app.get("/customers/:id/createSAInvoice", async (req, res) => {
  const customerId = req.params.id;
  const dbCustomer = await dbHelper.findCustomerById(customerId);

  const saInvoice = await createSAInvoice(dbCustomer.id);
  await dbHelper.updateCustomerById(dbCustomer._id, {
    saInvoiceId: saInvoice.Id,
  });
  res.redirect("/customers");
});

app.get("/customers/:id/createTipInvoice", async (req, res) => {
  const customerId = req.params.id;
  const dbCustomer = await dbHelper.findCustomerById(customerId);
  const tipInvoice = await createFeeInvoice(dbCustomer.id);
  await dbHelper.updateCustomerById(dbCustomer._id, {
    tipInvoiceId: tipInvoice.Id,
  });
  res.redirect("/customers");
});

app.get("/customers", async (req, res) => {
  const allCustomers = await dbHelper.findAllCustomers();
  res.render("customers", { customers: allCustomers });
});

app.post("/customers", async (req, res) => {
  const { displayName } = req.body;
  if (!qbo) {
    res.redirect("/");
  }
  const customer = await createCustomer(displayName);
  res.redirect("/customers");
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`💻 Server listening on port ${server.address().port} 💥`);
});
