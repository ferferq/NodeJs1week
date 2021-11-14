const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Cliente not found!"})
  }

  request.customer = customer;

  return next();
}

function getBalance (statement) {
  const balance = statement.reduce((acc, transactions) => 
  transactions.type === "credit" ?
  acc + transactions.amount :
  acc - transactions.amount
  , 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already Exists!"})
  }

  customers.push({
    id: uuidv4(),
    cpf, 
    name, 
    statement: []
  });

  return response.status(201).send();
});

app.get("/account", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer);
});

//app.use(verifyIfExistAccountCPF);

app.get("/statement", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  if (customer.statement.length < 1) {
    return response.status(204).json({message: "Not exists transactions"});
  }
  return response.json(customer.statement)
});

app.post("/deposit", verifyIfExistAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount, 
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistAccountCPF, (request, response) => {
  const { amount } = request.body;

  const { customer } = request;

  const balance = getBalance(customer.statement);
  
  if (amount > balance) {
    return response.status(400).json({error: "Insufficient funds!"});
  }

  const statementOperation = {
    amount, 
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date.split('-').reverse().join('-') + " 00:00");
  const statement = customer.statement.filter((statement) => 
    statement.created_at.toDateString() === dateFormat.toDateString()
  );

  return response.json(statement);
});

app.put("/account", verifyIfExistAccountCPF, (request, response) => {
  const { name } = request.body;

  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.delete("/account", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  const indexOfCustomer = customers.indexOf(customerTable => customerTable.cpf === customer.cpf);

  customers.splice(indexOfCustomer, 1);
  return response.status(204).send();
});

app.get("/balance", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json({ saldo: balance});
});

app.get("/accountAlls", (request, response) => {
  return response.json({customers});
})


app.listen(3333);
console.log("It's running");
