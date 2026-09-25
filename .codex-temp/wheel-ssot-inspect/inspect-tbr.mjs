import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "C:\\Users\\HP\\Documents\\Cursor projects\\Commersial\\Bizon\\outputs\\019f9ced-8954-7c91-b1a9-c1bf0cf6d55d\\BIZON_TBR_Catalog_Source_of_Truth.xlsx";

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 8000,
});

const filters = await workbook.inspect({
  kind: "table",
  sheetId: "05_FILTER_REGISTRY",
  range: "A1:AC17",
  maxChars: 12000,
  tableMaxRows: 17,
  tableMaxCols: 29,
  tableMaxCellChars: 120,
});

console.log(overview.ndjson);
console.log(filters.ndjson);
