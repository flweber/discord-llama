import fs from "fs";
import PDFParser from "pdf2json"; 

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", (errData) =>
 console.error(errData.parserError)
);
pdfParser.on("pdfParser_dataReady", (pdfData) => {
 fs.writeFile(
  "./pdf2json/test/F1040EZ.json",
  JSON.stringify(pdfData),
  (data) => console.log(data)
 );
});

pdfParser.loadPDF("./pdf2json/test/pdf/fd/form/F1040EZ.pdf");