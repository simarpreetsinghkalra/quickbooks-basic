const mongoose = require("mongoose");

const Customer = mongoose.model("Customer", {
  displayName: {
    type: String,
    unique: true,
  },
  id: String,
  saInvoiceId: String,
  tipInvoiceId: String,
  saPaymentId: String,
  tipPaymentId: String,
});

const findCustomerById = async (id) => {
  const customer = await Customer.findById(id);
  return customer;
};

const findCustomerByDisplayName = async (displayName) => {
  const customer = await Customer.findOne({ displayName });
  return customer;
};

const findAllCustomers = async () => {
  const customers = await Customer.find();
  return customers;
};

const updateCustomerById = async (id, data) => {
  return Customer.findByIdAndUpdate(id, data).exec();
};

const dbHelper = {
  Customer,
  findCustomerById,
  findCustomerByDisplayName,
  findAllCustomers,
  updateCustomerById,
};

module.exports = dbHelper;
