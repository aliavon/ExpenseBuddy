import React, {useState} from 'react';
import {Input, SIZE as INPUT_SIZE} from 'baseui/input';
import {Select} from 'baseui/select';
import {Button, SIZE, SHAPE} from 'baseui/button';
import {FileUploader} from 'baseui/file-uploader';
import {Table} from 'baseui/table';
import {Block} from 'baseui/block';
import {gql, useMutation} from '@apollo/client';
import {LabelMedium} from 'baseui/typography';

const ADD_PURCHASES = gql`
  mutation AddPurchases($purchases: [PurchaseInput!]!) {
    addPurchases(purchases: $purchases) {
      id
      name
      quantity
      unit
      price
      category
      discount
      date
      note
    }
  }
`;

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
      if (name === 'Lidl Plus rabat') {
        // handle discount calc
        let prevPrice = parsedData.at(-1).price;
        let discountPrice = parseFloat(row[1].replace(',', '.').slice(1));
        let discount = parseFloat((discountPrice * 100 / prevPrice).toFixed(0));
        parsedData.at(-1).price = parseFloat((prevPrice - discountPrice).toFixed(2));
        parsedData.at(-1).discount = parseFloat((parsedData.at(-1).discount + discount).toFixed(0));
      } else {
        [, quantity, , price] = row[1].match(/([0-9]{1,2}|[0-9]{1,2},[0-9]{3}) \* ([0-9]{1,3},[0-9]{1,2}) ([0-9]{1,3},[0-9]{1,2})/);

        parsedData.push({
          name,
          quantity: parseFloat(quantity.replace(',', '.')),
          unit,
          price: parseFloat(price.replace(',', '.')),
          category: '',
          discount,
          date,
          note: '',
        });
      }
    }
  }

  return parsedData;
};
const biedronkaCsvParse = async file => {
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
        note: '',
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

const emptyItem = {
  name: '',
  quantity: 0,
  unit: 'pcs',
  price: 0,
  category: '',
  discount: 0,
  date: new Date().toISOString()
    .split('T')[0],
  note: '',
};

const AddPurchasesComponent = () => {
  const [purchases, setPurchases] = useState([emptyItem]);
  const [csvType, setCsvType] = React.useState([]);
  const [addPurchases] = useMutation(ADD_PURCHASES);

  const handleAddRow = () => {
    setPurchases(prev => [...prev, emptyItem]);
  };

  const getHandleRemoveRow = index => () => {
    setPurchases(prev => {
      let newArr = [...prev];
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const handleInputChange = (field, value, index) => {
    setPurchases(prev => {
      let newItem = {...prev[index]};
      newItem[field] = value;
      let newArr = [...prev];
      newArr[index] = newItem;
      return newArr;
    });
  };

  const handleFileUpload = async file => {
    const csvAlgo = csvType[0]?.id;
    const reader = new FileReader();
    reader.readAsText(file);
    // reader.readAsArrayBuffer(fi)
    reader.onload = async () => {
      let parsedPurchases = [emptyItem];
      if (csvAlgo === 'biedronka') {
        parsedPurchases = await biedronkaCsvParse(file);
      } else if (csvAlgo === 'lidl') {
        parsedPurchases = await lidlParse(file);
      } else {
        parsedPurchases = defaultCsvParse(reader.result);
      }
      setPurchases(parsedPurchases);
    };
  };

  const handleSave = async () => {
    try {
      await addPurchases({variables: {purchases}});
      alert('Purchases saved successfully!');
      setPurchases([emptyItem]);
    } catch (error) {
      console.error('Error saving purchases:', error);
    }
  };

  const totalSpending = purchases?.reduce((sum, purchase) => sum + purchase.price, 0) || 0;
  console.log({purchases});
  return (
    <div>
      <h2>Add Purchases</h2>
      <Block
        display="grid"
        gridTemplateColumns="1.5fr 0.5fr 0.5fr 0.5fr 1fr 0.5fr 1fr 1fr 30px"
        gridColumnGap="2px"
        gridRowGap="2px"
        marginTop="10px"
        marginBottom="10px"
        alignItems="center"
      >
        <LabelMedium>Name*</LabelMedium>
        <LabelMedium>Quantity*</LabelMedium>
        <LabelMedium>Unit*</LabelMedium>
        <LabelMedium>Price*</LabelMedium>
        <LabelMedium>Category</LabelMedium>
        <LabelMedium>Discount</LabelMedium>
        <LabelMedium>Date*</LabelMedium>
        <LabelMedium>Note</LabelMedium>
        <div />
        {purchases.map(({name, quantity, unit, price, category, discount, date, note}, index) => (
          <React.Fragment key={index}>
            <Input
              size={INPUT_SIZE.mini}
              value={name}
              onChange={e => handleInputChange('name', e.target.value, index)}
            />
            <Input
              size={INPUT_SIZE.mini}
              value={quantity}
              onChange={e => handleInputChange('quantity', parseFloat(e.target.value), index)}
              type="number"
            />
            <Input
              size={INPUT_SIZE.mini}
              value={unit}
              onChange={e => handleInputChange('unit', e.target.value, index)}
            />
            <Input
              size={INPUT_SIZE.mini}
              value={price}
              onChange={e => handleInputChange('price', parseFloat(e.target.value), index)}
              type="number"
            />
            <Input
              size={INPUT_SIZE.mini}
              value={category}
              onChange={e => handleInputChange('category', e.target.value, index)}
            />
            <Input
              size={INPUT_SIZE.mini}
              value={discount}
              onChange={e => handleInputChange('discount', parseFloat(e.target.value), index)}
              type="number"
            />
            <Input
              size={INPUT_SIZE.mini}
              value={date}
              onChange={e => handleInputChange('date', e.target.value, index)}
              type="date"
            />
            <Input
              size={INPUT_SIZE.mini}
              value={note}
              onChange={e => handleInputChange('note', e.target.value, index)}
            />
            <Button
              onClick={getHandleRemoveRow(index)}
              size={SIZE.mini}
              shape={SHAPE.circle}
            >
              X
            </Button>
          </React.Fragment>
        )
        )}
        <Button
          onClick={handleAddRow}
          size={SIZE.mini}
        >
          Add next
        </Button>
      </Block>

      <h3>
        Upload
        {csvType[0]?.id ? ' Image' : ' CSV'}
      </h3>
      <Block
        display="inline-flex"
        gridColumnGap="8px"
        alignItems="flex-start"
      >
        <FileUploader
          fileRows={[]}
          processFileOnDrop={handleFileUpload}
          accept={csvType[0]?.id ? ['.jpg', '.png'] : ['.csv']}
        />

        <Select
          options={[
            {
              label: 'Biedronka',
              id: 'biedronka',
            }, {
              label: 'Lidl',
              id: 'lidl',
            },
          ]}
          value={csvType}
          placeholder="Select csv file type"
          onChange={params => setCsvType(params.value)}
        />
      </Block>
      <h3>
        Total:
        {` ${totalSpending.toFixed(2)} zł`}
      </h3>
      <Button onClick={handleSave}>Save Purchases</Button>
    </div>
  );
};

export default AddPurchasesComponent;
