import React, {useState} from 'react';
import {Input, SIZE as INPUT_SIZE} from 'baseui/input';
import {Select} from 'baseui/select';
import {Button, SIZE, SHAPE} from 'baseui/button';
import {FileUploader} from 'baseui/file-uploader';
import {Block} from 'baseui/block';
import {useMutation} from '@apollo/client';
import {LabelMedium, LabelLarge, ParagraphSmall} from 'baseui/typography';

import {ADD_PURCHASES_QUERY} from '../../gql';

const fileUploadOptions = [
  {
    label: 'CSV',
    id: 'csv',
  }, {
    label: 'Biedronka',
    id: 'biedronka',
  }, {
    label: 'Lidl',
    id: 'lidl',
  },
];

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
  const [csvType, setCsvType] = React.useState([fileUploadOptions[0]]);
  const [addPurchases] = useMutation(ADD_PURCHASES_QUERY);

  const getHandleAddRow = (rowData = emptyItem, index) => () => {
    if (typeof index === 'number') {
      setPurchases(prev => {
        let newData = [...prev];
        newData.splice(index + 1, 0, rowData);
        return newData;
      });
    } else {
      setPurchases(prev => [...prev, rowData]);
    }
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
  return (
    <Block
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="stretch"
    >
      <LabelLarge>Add Purchases</LabelLarge>
      <ParagraphSmall>Upload a csv file, or receipt image based on selected type</ParagraphSmall>
      <Block
        marginTop="16px"
        display="flex"
        justifyContent="space-between"
      >
        <Block
          display="flex"
          gridColumnGap="14px"
          alignItems="flex-start"
        >
          <Block>
            <LabelMedium
              marginBottom="4px"
              marginTop="2px"
            >
              Select a file type
            </LabelMedium>
            <Select
              options={fileUploadOptions}
              value={csvType}
              placeholder="Select a file type"
              onChange={params => setCsvType(params.value)}
              clearable={false}
            />
          </Block>
          <FileUploader
            fileRows={[]}
            processFileOnDrop={handleFileUpload}
            accept={csvType[0]?.id ? ['.jpg', '.png'] : ['.csv']}
          />
        </Block>

        <Button
          onClick={handleSave}
          disabled={!totalSpending}
          size='large'
        >
          Save
          {` ${totalSpending.toFixed(2)} zł`}
        </Button>
      </Block>

      <Block
        display="grid"
        gridTemplateColumns="0.3fr 1.5fr 0.5fr 0.5fr 0.7fr 1fr 0.7fr 1fr 1fr 30px"
        gridColumnGap="4px"
        gridRowGap="2px"
        marginTop="10px"
        marginBottom="10px"
        alignItems="center"
      >
        <div />
        <LabelMedium>Name*</LabelMedium>
        <LabelMedium>Quantity*</LabelMedium>
        <LabelMedium>Unit*</LabelMedium>
        <LabelMedium>Price(zł)*</LabelMedium>
        <LabelMedium>Category</LabelMedium>
        <LabelMedium>Discount(%)</LabelMedium>
        <LabelMedium>Date*</LabelMedium>
        <LabelMedium>Note</LabelMedium>
        <div />
        {purchases.map((p, index) => (
          <React.Fragment key={index}>
            <Button
              onClick={getHandleAddRow(p, index)}
              size={SIZE.compact}
            >
              copy
            </Button>
            <Input
              size={INPUT_SIZE.mini}
              value={p.name}
              onChange={e => handleInputChange('name', e.target.value, index)}
            />
            <Input
              size={INPUT_SIZE.mini}
              value={p.quantity}
              onChange={e => handleInputChange('quantity', parseFloat(e.target.value), index)}
              type="number"
            />
            <Input
              size={INPUT_SIZE.mini}
              value={p.unit}
              onChange={e => handleInputChange('unit', e.target.value, index)}
            />
            <Input
              size={INPUT_SIZE.mini}
              value={p.price}
              onChange={e => handleInputChange('price', parseFloat(e.target.value), index)}
              type="number"
            />
            <Input
              size={INPUT_SIZE.mini}
              value={p.category}
              onChange={e => handleInputChange('category', e.target.value, index)}
            />
            <Input
              size={INPUT_SIZE.mini}
              value={p.discount}
              onChange={e => handleInputChange('discount', parseFloat(e.target.value), index)}
              type="number"
            />
            <Input
              size={INPUT_SIZE.mini}
              value={p.date}
              onChange={e => handleInputChange('date', e.target.value, index)}
              type="date"
            />
            <Input
              size={INPUT_SIZE.mini}
              value={p.note}
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
          onClick={getHandleAddRow()}
          size={SIZE.compact}
        >
          add
        </Button>
      </Block>
    </Block>
  );
};

export default AddPurchasesComponent;
