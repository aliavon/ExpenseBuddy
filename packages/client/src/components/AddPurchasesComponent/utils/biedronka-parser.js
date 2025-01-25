/* global Tesseract */

const biedronkaParse = async file => {
  const worker = await Tesseract.createWorker(Tesseract.languages.POL);
  await worker.setParameters({preserve_interword_spaces: '1'});
  const {data: {text}} = await worker.recognize(file);
  await worker.terminate();

  // parse Date
  let [date] = new Date().toISOString()
    .split('T');
  const match = text.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
  if (match) {
    const [
      , day,
      month,
      year,
    ] = match;
    date = `${year}-${month}-${day}`;
  }

  const header = 'Nazwa';
  const footer = 'Sprzedaż opodatkowana';
  let croppedText = text.slice(text.indexOf(header));
  croppedText = croppedText.slice(0, croppedText.indexOf(footer));
  let [, ...rows] = croppedText.split('\n').map(row => row.split(/ {2,}/g));

  let parsedData = [];

  // collect rows data
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row.length === 5) {
      let name, quantity, price, unit = 'pcs', discount = 0;
      [name, , quantity, , price] = row;
      // handle luz products
      if (name.includes('Luz') || name.includes('luz')){
        unit = 'g';
      }

      if (name.includes('kg') && !name.match(/[0-9]+/)) {
        unit = 'kg';
      }

      parsedData.push({
        name,
        quantity: parseFloat(quantity.replace(',', '.')),
        unit,
        price: parseFloat(price.replace(',', '.')),
        category: '',
        discount,
        date,
        note: 'Biedronka',
      });
    }

    // handle discount calc
    if (row.length === 2 && row[0] === 'Rabat') {
      let prevPrice = parsedData.at(-1).price;
      let discountPrice = parseFloat(row[1].replace(',', '.'));
      let discount = parseFloat((-discountPrice * 100 / prevPrice).toFixed(0));
      parsedData.at(-1).price = parseFloat((prevPrice + discountPrice).toFixed(2));
      parsedData.at(-1).discount = discount;
    }
  }

  return parsedData;
};

export default biedronkaParse;
