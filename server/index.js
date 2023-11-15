const express = require("express");
const mongoose = require('mongoose');
const User = require('./user');
require('dotenv').config();
const app = express();
const cors = require("cors");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes } = require("ethereum-cryptography/utils");
const port = 3042;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI).then(() => {
    console.log("Connected to MongoDB!");
}).catch(err => {
    console.log("Failed to connect to MongoDB: ", err.message);
});

app.get("/balance/:address", async (req, res) => {
  const { address } = req.params;
  const user = await User.findOne({ address: address });
  if (user) {
    res.send({ balance: user.amount });
  } else {
    res.status(404).send({ message: "Wallet address not found!" });
  }
});

app.post("/send", async (req, res) => {
  const { sender, recipient, amount } = req.body;
  console.log("receive");
  const senderUser = await User.findOne({ address: sender });
  if (!senderUser) {
    return res.status(400).send({ message: "Sender not found." });
  }

  if (senderUser.amount < amount) {
    return res.status(400).send({ message: "Not enough funds!" });
  }
  senderUser.amount -= amount;
  const recipientUser = await User.findOne({ address: recipient }) || new User({ address: recipient, amount: 0 });
  recipientUser.amount += amount;

  await senderUser.save();
  await recipientUser.save();

  res.send({ balance: senderUser.amount });
});

app.get("/topWallets", async (req, res) => {
  try {
    // Получаем топ 10 кошельков с наибольшим балансом
    const wallets = await User.find().sort({ amount: -1 }).limit(5);
    res.send(wallets);
  } catch (error) {
    console.error("Failed to fetch top wallets:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


app.post("/register", async (req, res) => {
  const { address, publicKey } = req.body;
  const existingUser = await User.findOne({ address: address });

  if (existingUser) {
    return res.status(400).send({ message: "Address already registered." });
  }

  const user = new User({
    address: address,
    publicKey: publicKey,
    amount: 50,
  });
  await user.save();
  res.send({ message: "User registered successfully!" });
});

app.get("/getPublicKey/:address", async (req, res) => {
  const { address } = req.params;

  try {
    // Поиск пользователя по адресу в MongoDB
    const user = await User.findOne({ address });

    // Если пользователь не найден, отправляем ответ с ошибкой
    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Если пользователь найден, отправляем его публичный ключ
    return res.send({ publicKey: user.publicKey });

  } catch (error) {
    // В случае ошибки возвращаем ответ с ошибкой сервера
    console.error("Failed to fetch public key:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});



