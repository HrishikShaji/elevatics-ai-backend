const { JSDOM } = require("jsdom");
const ExcelJS = require("exceljs");

const generateExcel = async (req, res) => {
	try {
		const { htmlArray } = req.body;

		const workbook = new ExcelJS.Workbook();

		htmlArray.forEach((html, index) => {
			const dom = new JSDOM(html);
			const document = dom.window.document;

			const table = document.querySelector("table");
			if (table) {
				const worksheet = workbook.addWorksheet(`Sheet ${index + 1}`);

				const rows = table.querySelectorAll("tr");
				rows.forEach((row, rowIndex) => {
					const cells = row.querySelectorAll("th, td");
					cells.forEach((cell, cellIndex) => {
						worksheet.getCell(rowIndex + 1, cellIndex + 1).value =
							cell.textContent.trim();
					});
				});
			}
		});

		const buffer = await workbook.xlsx.writeBuffer();
		console.log(buffer);
		res.set({
			"Content-Type":
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"Content-Disposition": "attachment; filename=generated.xlsx",
			"Content-Length": buffer.length,
		});

		res.send(buffer);
	} catch (err) {
		console.error("Error generating Excel:", err);
		res.status(500).json({ message: "Something went wrong" });
	}
};

module.exports = { generateExcel };
