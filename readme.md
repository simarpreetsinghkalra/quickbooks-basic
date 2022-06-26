# Quickbooks Nodejs SDK Example!

In this repository I have tried to make a prototype project using Nodejs, Expressjs and ejs templates to explaining the usage of Quickbooks Online SDK packages for Nodejs.

## Packages Used

1. [intuit-oauth](https://www.npmjs.com/package/intuit-oauth)
2. [node-quickbooks](https://www.npmjs.com/package/node-quickbooks)

## Prerequisites

You will be needing the following tools before running this script:

1.  Nodejs installed in you system. I am using **v16.13.1** while writing this code.
2.  Some basic knowledge of git, Nodejs, Environment files and Quickbooks online.

## Steps to run

1. Clone this repository.
2. Change your work directory to this project directory.
3. Run command `npm install` to install the dependencies listed in the _package.json_ file.
4. Add environment variables to _.env_ file. I am using MongoDB for storing data so I have added MongoDB variables too.
5. Run command `npm start` and open http://localhost:3000.

## Workflow

In these following steps I am trying to explain how this app is working along with Quickbooks Online:

1.  Click on the given link to log-in
2.  After logging in and selecting a company (if you have multiple companies) you will be redirected to callback uri specified in .env file where I have rendered a link to view customers from MongoDB.
3.  On the customers page you can add new customers by providing DisplayName. The customer will be created on QBO system and will the QBO Customer ID will be stored in MongoDB.
4.  In this example, I have also generated different types of invoices on customers page.
5.  On creating invoices I am creating invoices with a fixed amount and storing the invoice id in MongoDB Database.

You can perform other operations also by defining more functionality to the code.
