import React, {useState} from 'react';
import {Input, SIZE as INPUT_SIZE} from 'baseui/input';
import {Select} from 'baseui/select';
import {Button, SIZE, SHAPE} from 'baseui/button';
import {FileUploader} from 'baseui/file-uploader';
import {Block} from 'baseui/block';
import {useMutation} from '@apollo/client';
import {LabelMedium, LabelLarge, ParagraphSmall} from 'baseui/typography';
import {toaster} from 'baseui/toast';

import {ADD_PURCHASES_QUERY} from '../../gql';
import CategorySelect from '../form/category-select';
import Preloader from './preloader';
import {lidlParser, biedronkaParser, csvParser} from './utils';
import {getEmptyPurchase, fileUploadOptions, FILE_UPLOAD_TYPE, FILE_TYPES_TO_UPLOAD} from './constants';

const AddPurchasesComponent = () => {
  const [purchases, setPurchases] = useState([getEmptyPurchase()]);
  const [csvType, setCsvType] = useState([fileUploadOptions[0]]);
  const [isFileParsing, setIsFileParsing] = useState(false);
  const [addPurchases] = useMutation(ADD_PURCHASES_QUERY);

  const getHandleAddRow = (rowData = getEmptyPurchase(), index) => () => {
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
    let beforeLoadTime = new Date().getTime();
    const csvAlgo = csvType[0]?.id;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async () => {
      setIsFileParsing(true);
      let parsedPurchases = [getEmptyPurchase()];
      try {
        if (csvAlgo === FILE_UPLOAD_TYPE.BIEDRONKA) {
          parsedPurchases = await biedronkaParser(file);
        } else if (csvAlgo === FILE_UPLOAD_TYPE.LIDL) {
          parsedPurchases = await lidlParser(file);
        } else {
          parsedPurchases = csvParser(reader.result);
        }
        setPurchases(parsedPurchases);
        toaster.positive(`File loaded and parsed in ${(new Date().getTime() - beforeLoadTime) / 1000} seconds`);
      } catch (error) {
        toaster.negative(error.message);
      }
      setIsFileParsing(false);
    };
  };

  const handleSave = async () => {
    try {
      await addPurchases({variables: {purchases}});
      alert('Purchases saved successfully!');
      setPurchases([getEmptyPurchase()]);
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
      <ParagraphSmall>Upload a csv file, or receipt image based on selected type. Uploading a file will override current data</ParagraphSmall>
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
              disabled={isFileParsing}
              options={fileUploadOptions}
              value={csvType}
              placeholder="Select a file type"
              onChange={params => setCsvType(params.value)}
              clearable={false}
            />
          </Block>
          <FileUploader
            disabled={isFileParsing}
            fileRows={[]}
            maxFiles={1}
            processFileOnDrop={handleFileUpload}
            accept={FILE_TYPES_TO_UPLOAD[csvType[0]?.id] || FILE_TYPES_TO_UPLOAD.DEFAULT}
          />
        </Block>

        <Button
          onClick={handleSave}
          disabled={!totalSpending || isFileParsing}
          size='large'
        >
          Save
          {` ${totalSpending.toFixed(2)} zł`}
        </Button>
      </Block>

      <Block
        display="grid"
        gridTemplateColumns="0.3fr 1.5fr 0.5fr 0.5fr 0.7fr 1fr 0.7fr 1fr 1fr auto"
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

        {!isFileParsing && purchases.map((p, index) => (
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
            <CategorySelect
              size={INPUT_SIZE.mini}
              placeholder=""
              value={p.category}
              onChange={value => handleInputChange('category', value, index)}
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
        ) || null}
        {isFileParsing && <Preloader rows={10} /> || null}
        <Button
          disabled={isFileParsing}
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
