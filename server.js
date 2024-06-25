require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sendEmail } = require("./sendEmail");
const { generatePdf } = require("./generatePdf");
const { generateExcel } = require("./generateExcel");

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(bodyParser.json());

app.post("/send-email", sendEmail);
app.post("/generate-pdf", generatePdf);
app.post("/generate-excel", generateExcel);

app.get('/test', (req, res) => {
  res.send('Test Success');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
