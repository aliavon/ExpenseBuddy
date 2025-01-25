/* global Tesseract */

const lidlParse = async file => {
  const worker = await Tesseract.createWorker(Tesseract.languages.POL);
  await worker.setParameters({preserve_interword_spaces: '1'});
  const {data: {text}} = await worker.recognize(file);
  await worker.terminate();

  // parse Date
  let [date] = new Date().toISOString()
    .split('T');
  const match = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const [
    fullMatch,
    year,
    month,
    day,
  ] = match;
  date = `${year}-${month}-${day}`;

  const header = fullMatch;
  const footer = 'PTU';
  let croppedText = text.slice(text.indexOf(header));
  croppedText = croppedText.slice(0, croppedText.indexOf(footer));
  let [, ...rows] = croppedText.split('\n').map(row => row.split(/ {2,}/g));

  let parsedData = [];
  // collect rows data
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row.length === 2) {
      let name, quantity, price, unit = 'pcs', discount = 0;
      [name] = row;
      if (['950_80085', 'Lidl Plus rabat'].includes(name)) {
        // handle discount calc
        let prevPrice = parsedData.at(-1).price;
        let discountPrice = parseFloat(row[1].replace(',', '.').slice(1));
        let discount = parseFloat((discountPrice * 100 / prevPrice).toFixed(0));
        parsedData.at(-1).price = parseFloat((prevPrice - discountPrice).toFixed(2));
        parsedData.at(-1).discount = parseFloat((parsedData.at(-1).discount + discount).toFixed(0));
      } else {
        [, quantity, , price] = row[1].match(/([0-9]{1,2}|[0-9]{1,2},[0-9]{3}) .* ([0-9]{1,3},[0-9]{1,2}) ([0-9]{1,3},[0-9]{1,2})/);

        if (name.includes('Luz') || name.includes('luz')){
          unit = 'g';
        }

        parsedData.push({
          name,
          quantity: parseFloat(quantity.replace(',', '.')),
          unit,
          price: parseFloat(price.replace(',', '.')),
          category: '',
          discount,
          date,
          note: 'Lidl',
        });
      }
    }
  }

  return parsedData;
};

export default lidlParse;
