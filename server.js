// server.js - VERSI MODIFIKASI (Direct-to-DB)
const express = require("express");
const path = require("path");
const AWS = require("aws-sdk");
const { randomUUID } = require("crypto");

const app = express();
const port = 8080;

// Konfigurasi AWS SDK
// Ganti region jika Anda menggunakan region selain ap-southeast-1
AWS.config.update({ region: "ap-southeast-1" });

// Inisialisasi DynamoDB Document Client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
// Langsung definisikan nama tabel di kode karena hanya ada satu
const DYNAMODB_TABLE_NAME = "QuoteVerse-Quotes";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Endpoint API untuk mendapatkan semua kutipan
app.get("/api/quotes", async (req, res) => {
  const params = {
    TableName: DYNAMODB_TABLE_NAME,
  };
  try {
    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items);
  } catch (err) {
    console.error("Error fetching quotes from DynamoDB:", err);
    res.status(500).send({ message: "Error fetching quotes." });
  }
});

// Endpoint API untuk mengirim kutipan baru (LANGSUNG KE DYNAMODB)
app.post("/api/submit-quote", async (req, res) => {
  const { quote, author } = req.body;
  if (!quote || !author) {
    return res.status(400).send({ message: "Quote and author are required." });
  }

  const params = {
    TableName: DYNAMODB_TABLE_NAME,
    Item: {
      id: randomUUID(),
      quote: quote,
      author: author,
      submittedAt: new Date().toISOString(),
    },
  };

  try {
    await dynamoDB.put(params).promise();
    console.log("Quote saved to DynamoDB successfully");
    res.redirect("/success.html");
  } catch (err) {
    console.error("Error saving message to DynamoDB:", err);
    res.status(500).send({ message: "Failed to submit quote." });
  }
});

app.listen(port, () => {
  console.log(
    `QuoteVerse app (Direct-to-DB version) listening on port ${port}`
  );
});
