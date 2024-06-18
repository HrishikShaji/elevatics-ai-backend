const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");

const generatePdf = async (req, res) => {
	let browser;
	try {
		const { htmlArray } = req.body;
		console.log("Received HTML array:", htmlArray);

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
		res.set({
			"Content-Type": "application/pdf",
			"Content-Disposition": "attachment; filename=generated.pdf",
			"Content-Length": finalPdfBuffer.length,
		});

		res.send(Buffer.from(finalPdfBuffer));
	} catch (err) {
		console.error("Error generating PDF:", err);
		res.status(500).json({ message: "Something went wrong" });
	} finally {
		if (browser) {
			await browser.close();
		}
	}
};

module.exports = { generatePdf };
