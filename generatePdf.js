const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");

const generatePdf = async (req, res) => {
  let browser;
  try {
    const { htmlArray } = req.body;
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const pdfBuffers = [];

    for (const html of htmlArray) {
      await page.setContent(html);
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

    await browser.close();

    const mergedPdf = await PDFDocument.create();
    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const finalPdfBuffer = await mergedPdf.save();
    console.log("created pdf", finalPdfBuffer);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=generated.pdf",
      "Content-Length": finalPdfBuffer.length,
    });
    res.send(finalPdfBuffer);
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

module.exports = { generatePdf };
