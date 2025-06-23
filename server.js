// server.js
const express = require("express");
const path = require("path");
const AWS = require("aws-sdk");

const app = express();
const port = 8080;

// Konfigurasi AWS SDK (akan menggunakan IAM Role di EC2, jadi tidak perlu hardcode credentials)
// Pastikan Region sesuai dengan tempat Anda mendeploy resource
AWS.config.update({ region: "ap-southeast-1" }); // Contoh: Singapore

const sqs = new AWS.SQS();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL; // Akan di-set sebagai environment variable di EC2
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME; // Akan di-set sebagai environment variable di EC2

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS) dari direktori 'public'
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

// Endpoint API untuk mengirim kutipan baru (akan mengirim ke SQS)
app.post("/api/submit-quote", async (req, res) => {
  if (!SQS_QUEUE_URL) {
    return res.status(500).send({ message: "SQS Queue URL not configured." });
  }

  const { quote, author } = req.body;
  if (!quote || !author) {
    return res.status(400).send({ message: "Quote and author are required." });
  }

  const params = {
    MessageBody: JSON.stringify({
      quote,
      author,
      submittedAt: new Date().toISOString(),
    }),
    QueueUrl: SQS_QUEUE_URL,
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log("Quote submitted to SQS successfully");
    // Redirect ke halaman sukses atau kirim response
    res.redirect("/success.html");
  } catch (err) {
    console.error("Error sending message to SQS:", err);
    res.status(500).send({ message: "Failed to submit quote." });
  }
});

app.listen(port, () => {
  console.log(`QuoteVerse app listening at http://localhost:${port}`);
});
