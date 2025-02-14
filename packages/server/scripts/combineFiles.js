const fs = require("fs");
const path = require("path");

const inputFolder = "./src";
const outputFile = "final.txt";

fs.writeFileSync(outputFile, "", "utf8");

function processDirectory(directory) {
  const items = fs.readdirSync(directory);

  items.forEach((item) => {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      let relativePath = path.relative(".", fullPath).replace(/\\/g, "/");
      if (!relativePath.startsWith("./")) {
        relativePath = "./" + relativePath;
      }

      const fileContent = fs.readFileSync(fullPath, "utf8");

      const dataToAppend = `${relativePath}\n${fileContent}\n\n`;

      fs.appendFileSync(outputFile, dataToAppend, "utf8");
    }
  });
}

processDirectory(inputFolder);

console.log(`data from folder ${inputFolder} collected to ${outputFile}`);
