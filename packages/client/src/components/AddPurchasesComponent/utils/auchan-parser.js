/* global Tesseract */

const auchanParse = async file => {
  const worker = await Tesseract.createWorker(Tesseract.languages.POL);
  await worker.setParameters({ preserve_interword_spaces: '1' });
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();

  // parse Date
  let [date] = new Date().toISOString()
    .split('T');
  const match = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (match) {
    const [
      , year,
      month,
      day,
    ] = match;
    date = `${year}-${month}-${day}`;
  }

  const header = date;
  const footer = 'SPRZEDAŻ OPODATK';
  let croppedText = text.slice(text.indexOf(header));
  croppedText = croppedText.slice(0, croppedText.indexOf(footer));
  let [, ...rows] = croppedText.split('\n').map(row => row.split(/ {2,}/g));
  let parsedDataMap = {};

  // collect rows data
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row.length === 2) {
      let name, quantity, price, unit = 'pcs', discount = 0;
      [name] = row;
      if (name.includes('Rabat')) {
        let realName = name.slice(6);
        if (parsedDataMap[realName].price) {
          let discountPrice = parseFloat(row[1].replace(',', '.').slice(1, -1));
          let discount = parseFloat((discountPrice * 100 / parsedDataMap[realName].price).toFixed(0));
          parsedDataMap[realName].price = parseFloat((parsedDataMap[realName].price - discountPrice).toFixed(2));
          parsedDataMap[realName].discount = parseFloat((parsedDataMap[realName].discount + discount).toFixed(0));
        }
      } else {
        [, quantity, , price] = row[1].match(/^([\d,]+) x([\d,]+) ([\d,]+)[ABC]$/) || [
          undefined,
          '0',
          undefined,
          '0',
        ];

        if (quantity.includes(',')) {
          unit = 'kg';
        }

        if (parsedDataMap[name]) {
          parsedDataMap[name].quantity = parsedDataMap[name].quantity + parseFloat(quantity.replace(',', '.'));
          parsedDataMap[name].price = parsedDataMap[name].price + parseFloat(price.replace(',', '.'));
        } else {
          parsedDataMap[name] = {
            name: name.match(/^(.+?)\s+(\d+[A-C]?)$/)[1],
            quantity: parseFloat(quantity.replace(',', '.')),
            unit,
            price: parseFloat(price.replace(',', '.')),
            category: '',
            discount,
            date,
            note: 'Auchan',
          };
        }
      }
    }

  }

  return Object.values(parsedDataMap);
};

export default auchanParse;
