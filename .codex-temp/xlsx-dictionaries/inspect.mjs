import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath =
  "C:/Users/HP/Documents/Cursor projects/Commersial/Bizon/outputs/019f9ced-8954-7c91-b1a9-c1bf0cf6d55d/BIZON_TBR_Catalog_Source_of_Truth.xlsx";

const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load(workbookPath),
);

const sheets = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 4000,
});
console.log(sheets.ndjson);

const dictionaries = await workbook.inspect({
  kind: "region",
  sheetId: "07_DICTIONARIES",
  range: "A1:F80",
  maxChars: 18000,
  tableMaxRows: 80,
  tableMaxCols: 6,
  tableMaxCellChars: 120,
});
console.log(dictionaries.ndjson);
