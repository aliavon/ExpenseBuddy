import {getEmptyPurchase} from '../constants';

function parseCSV(csvString) {
  const rows = [];
  const lines = csvString.split(/\r?\n/);

  for (const line of lines) {
    const regex = /(?:"([^"]*)"|([^",]+)|(?<=,)(?=,)|([^,]*))(,|\r?\n|$)/g;
    const row = [];
    let match;

    while ((match = regex.exec(line)) !== null) {
      const value = match[1] ?? match[2] ?? match[3] ?? ''; // Match quoted or unquoted values
      row.push(value);

      if (match.index === regex.lastIndex) {
        regex.lastIndex++; // Avoid infinite loop
      }
    }

    if (row.length > 0 && row[row.length - 1] === '') {
      row.pop();
    }

    if (row.length > 0) {
      rows.push(row);
    } // Add non-empty rows
  }

  return rows;
}

const defaultCsvParse = file => {
  const rows = parseCSV(file);
  const emptyItem = getEmptyPurchase();

  return rows.slice(1).map(row => {
    const [
      name,
      quantity,
      unit,
      price,
      category,
      discount,
      date,
      note,
    ] = row;
    return {
      name,
      quantity: parseFloat(quantity.replace(',', '.')),
      unit,
      price: parseFloat(price.replace(',', '.')),
      category: category || emptyItem.category,
      discount: parseFloat(discount.replace(',', '.')) || emptyItem.discount,
      date: new Date(date).toISOString()
        .split('T')[0],
      note: note || emptyItem.note,
    };
  });
};

export default defaultCsvParse;
