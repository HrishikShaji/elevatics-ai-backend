const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");
const nodemailer = require("nodemailer");

const sendEmail = async (req, res) => {
	let browser;
	try {
		const { htmlArray, email, prompt } = req.body;

		browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});
		const page = await browser.newPage();

		const pdfBuffers = [];

		for (const html of htmlArray) {
			await page.setContent(html);
			await page.evaluateHandle("document.fonts.ready");
			const pdfBuffer = await page.pdf({
				format: "A4",
				margin: {
					top: "20px",
					bottom: "20px",
					left: "40px",
					right: "40px",
				},
				printBackground: true,
			});
			pdfBuffers.push(pdfBuffer);
		}

		const mergedPdf = await PDFDocument.create();
		for (const pdfBuffer of pdfBuffers) {
			const pdf = await PDFDocument.load(pdfBuffer);
			const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
			copiedPages.forEach((page) => {
				mergedPdf.addPage(page);
			});
		}

		const finalPdfBuffer = await mergedPdf.save();

		const transporter = nodemailer.createTransport({
			host: "smtp.office365.com",
			port: 587,
			secure: false,
			auth: {
				user: process.env.USER_EMAIL,
				pass: process.env.PASS,
			},
		});

		transporter.sendMail({
			from: '"Full Stack" <fullstackdeveloper1999@outlook.com>',
			to: email,
			subject: `Here is your report on ${prompt}`,
			text: "",
			attachments: [
				{
					filename: `${prompt}.pdf`,
					content: finalPdfBuffer,
					contentType: "application/pdf",
				},
			],
		});

		res.json({ message: "Email sent successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Something went wrong" });
	} finally {
		if (browser) {
			console.log("browser closed");
			await browser.close();
		}
	}
};

module.exports = { sendEmail };
