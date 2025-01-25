
export const getEmptyPurchase = () => ({
  name: '',
  quantity: 0,
  unit: 'pcs',
  price: 0,
  category: '',
  discount: 0,
  date: new Date().toISOString()
    .split('T')[0],
  note: '',
});

export const FILE_UPLOAD_TYPE = {
  CSV: 'csv',
  BIEDRONKA: 'biedronka',
  LIDL: 'lidl',
};

export const FILE_TYPES_TO_UPLOAD = {
  DEFAULT: ['.csv'],
  [FILE_UPLOAD_TYPE.CSV]: ['.csv'],
  [FILE_UPLOAD_TYPE.BIEDRONKA]: ['.jpg', '.png', '.tiff'],
  [FILE_UPLOAD_TYPE.LIDL]: ['.jpg', '.png', '.tiff'],

};

export const fileUploadOptions = [
  {
    label: 'CSV',
    id: FILE_UPLOAD_TYPE.CSV,
  }, {
    label: 'Biedronka',
    id: FILE_UPLOAD_TYPE.BIEDRONKA,
  }, {
    label: 'Lidl',
    id: FILE_UPLOAD_TYPE.LIDL,
  },
];
