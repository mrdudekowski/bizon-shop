import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "C:\\Users\\HP\\Documents\\Cursor projects\\Commersial\\Bizon\\outputs\\019f9ced-8954-7c91-b1a9-c1bf0cf6d55d\\BIZON_TBR_Catalog_Source_of_Truth.xlsx";

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheets = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 5000,
});

const features = await workbook.inspect({
  kind: "region",
  sheetId: "03_MODEL_FEATURES",
  range: "A1:Z20",
  maxChars: 12000,
  tableMaxRows: 20,
  tableMaxCols: 26,
  tableMaxCellChars: 180,
});

const qaIssues = await workbook.inspect({
  kind: "region",
  sheetId: "11_QA_ISSUES",
  range: "A1:P12",
  maxChars: 10000,
  tableMaxRows: 12,
  tableMaxCols: 16,
  tableMaxCellChars: 220,
});

const readme = await workbook.inspect({
  kind: "region",
  sheetId: "00_README",
  range: "A1:D27",
  maxChars: 10000,
  tableMaxRows: 27,
  tableMaxCols: 4,
  tableMaxCellChars: 240,
});

const cmsImport = await workbook.inspect({
  kind: "region",
  sheetId: "13_CMS_IMPORT",
  range: "A1:BO6",
  maxChars: 16000,
  tableMaxRows: 6,
  tableMaxCols: 67,
  tableMaxCellChars: 160,
});

console.log("SHEETS");
console.log(sheets.ndjson);
console.log("FEATURES");
console.log(features.ndjson);
console.log("QA_ISSUES");
console.log(qaIssues.ndjson);
console.log("README");
console.log(readme.ndjson);
console.log("CMS_IMPORT");
console.log(cmsImport.ndjson);
