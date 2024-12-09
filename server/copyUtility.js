/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../desktop/src/commonUtility/utils.ts');
const destination = path.join(__dirname, 'src/utils.ts');

fs.copyFile(source, destination, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Utilityファイルはコピー済みだぜ');
});
