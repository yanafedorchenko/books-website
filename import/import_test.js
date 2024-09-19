var fs = require('fs');
var csv = require("csv-parser");

const results = [];

fs.createReadStream('books.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
//    importToDatabank(results);
    console.log(results);
    
    fs.appendFile('books.json', JSON.stringify(results), function (err) {
    if (err) throw err;
    console.log('All done!');
    });
});


/*
function fetchJSONData () {
    var url = "books.csv"
    
    $ajax({
        url: url,
        dataType: "json",
        success: resultsReceived,
        error: errorRequestingData
    });
}
*/