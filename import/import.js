var csv = require("csv-parser");
var pg = require("pg");
const fs = require("fs")

const conString = process.env.DB_CON_STRING;

if (conString == undefined) {
    console.log("ERROR: environment variable DB_CON_STRING not set.");
    process.exit(1);
}

const dbConfig = {
  connectionString: conString,
  ssl: { rejectUnauthorized: false }
}

var dbClient = new pg.Client(dbConfig);
dbClient.connect();

const books = [];

fs.createReadStream('books.csv')
  .pipe(csv())
  .on('data', (data) => books.push(data))
  .on('end', () => {
    importToDatabank(books);
});

function importToDatabank(array) {
    for(let i = 0; i < array.length; i++) {
        dbClient.query("SELECT * FROM books WHERE isbn=$1", [array[i].isbn], function (dbCheckError, dbCheckResponse) {
            if (dbCheckResponse.rows.length == 0) {
                dbClient.query("INSERT INTO books (isbn, title, author, year) VALUES ($1, $2, $3, $4)", [array[i].isbn, array[i].title, array[i].author, array[i].year], function(dbError, dbResponse) {
                    console.log(array[i].title + " imported");
                }); 
            } else {
                console.log(array[i].title + " had already been imported.");
            }
        });
    }
};