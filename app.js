var express = require("express");
var pg = require("pg");
var bodyParser = require("body-parser");
var session = require("express-session");
var path = require("path");
var request = require("request");
var bcrypt = require('bcrypt');
var saltRounds = 10;

const conString = process.env.DB_CON_STRING;

if (conString == undefined) {
    console.log("Error: Environment variable DB_CON_STRING not set!");
    process.exit(1);
}

const dbConfig = {
  connectionString: conString,
  ssl: { rejectUnauthorized: false }
}

var dbClient = new pg.Client(dbConfig);
dbClient.connect();

var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

const PORT = 3000;

var app = express();

app.use(express.static(path.join(__dirname, "/public")));
app.use(session({
    secret: "This is a secret!",
    resave:true,
    saveUninitialized: false
}));

app.set("views", "views");
app.set("view engine", "pug");

app.get("/", function (req, res) {
    if(req.session.user != undefined) {
        req.session.destroy(function (err) {
            console.log("Session destroyed.");
        });
    }
    res.render("registration");
});

app.post("/", urlencodedParser, function (req, res) {   
    var name = req.body.name;
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    
    dbClient.query("SELECT * FROM booksusers WHERE username=$1", [username], function (dbError, dbResponse) {
        if (dbResponse.rows.length == 0) {
            bcrypt.hash(password, saltRounds, function(err, hash) {
                dbClient.query("INSERT INTO booksusers (name, username, email, password) VALUES ($1, $2, $3, $4)", [name, username, email, hash], function (dbItemsError, dbItemsResponse) {
                    res.redirect("login");
                });
            });    
        } else {
            res.render("registration", {error: "Such user already exists!"});
        }
    });
});

app.get("/login", function (req, res) {
    if(req.session.user != undefined) {  
        var username = req.session.user.username;
        res.render("error", {error: `You are already logged in as ${username}.`, additional_message: `If you are not ${username}, please log in to your account. If you don't have one yet, you can sign up.`, under_line: "We'll be happy to see you as a member of our Book Club!"});
    } else {
        res.render("login");
    }
});

app.post("/login", urlencodedParser, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    
    dbClient.query("SELECT * FROM booksusers WHERE username=$1", [username], function (dbError, dbResponse) {
        if (dbResponse.rows.length != 0) {
            bcrypt.compare(password, dbResponse.rows[0].password).then(function(result) {
                if(result == true) {
                    var user = dbResponse.rows[0];

                    req.session.user = {
                                        userId: user.id,
                                        name: user.name,
                                        username: user.username};
                    res.redirect("/search");
                } else {
                        res.render("login", {login_error: "Incorrect password."});
                }
            });
        } else {
            res.render("login", {login_error: "There is no such user yet."})
        }
    });
});

app.get("/search", function (req, res) {
    if(req.session.user != undefined) {   
        res.render("search");
    } else {
        res.render("error", {error: "Please log in to have access to this page."});
    }
});

app.post("/search", urlencodedParser, function (req, res) {
    if(req.session.user != undefined) {
        var searchTerm = req.body.book_search;
        
        dbClient.query(`SELECT * FROM books WHERE LOWER(title) LIKE LOWER('%${searchTerm}%')`, function (dbError, dbResponse) {
            if (dbResponse.rows.length != 0) {
                console.log(dbResponse.rows[0]);
                res.redirect("/book/"+dbResponse.rows[0].isbn);
            } else {
                res.render("error", {error: `Couldn't find "${searchTerm}"`});
            }
        });
    } else {
        res.render("error", {error: "Please log in to have access to this page."});
    }
});

app.post("/searchresults", urlencodedParser, function (req, res) {
    var searchTerm = req.body.search;
    var username = req.session.user.username;
        
    dbClient.query(`SELECT * FROM books WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)`, ["%" + searchTerm + "%"], function (dbError, dbResponse) {
        res.send({books: dbResponse.rows, username: username});
    });
});

app.get("/book/:isbn", function (req, res) {
    if(req.session.user != undefined) {
        var bookISBN = req.params.isbn;
        var username = req.session.user.username;
        
        dbClient.query("SELECT * FROM books WHERE isbn=$1", [bookISBN], function(dbError, dbResponse){
            var book = dbResponse.rows[0];
            
            dbClient.query("SELECT * FROM reviews WHERE book_id=$1", [book.id], function (dbReviewsError, dbReviewsResponse) {
                var quantityOfRatings = dbReviewsResponse.rows.length;
                var generalRating = "No ratings yet";
                if(quantityOfRatings != 0) {    
                    var sumOfRatings = 0;
                    for(var i = 0; i < quantityOfRatings; i++) {
                         sumOfRatings += dbReviewsResponse.rows[i].rating;
                    }
                    generalRating = sumOfRatings / quantityOfRatings;
                }
                
                res.render("book", {book: book, bookISBN: bookISBN, reviews: dbReviewsResponse.rows, rating: generalRating});
            });
        });
        
    } else {
        res.render("error", {error: "Please log in to have access to this page."});
    }
});

app.post("/book/:isbn", urlencodedParser, function(req, res) {
    if(req.session.user != undefined) {
        var newReview = req.body.new_review;
        var newRating = req.body.new_rating;
        var bookISBN = req.params.isbn;
        var userID = req.session.user.userId;
        var username = req.session.user.username;
        
        dbClient.query("SELECT * FROM books WHERE isbn=$1", [bookISBN], function(dbBookError, dbBookResponse) {
            var bookID = dbBookResponse.rows[0].id;
            
            dbClient.query("SELECT * FROM reviews WHERE user_id=$1 AND book_id=$2", [userID, bookID], function(dbReviewsError, dbReviewsResponse) {
                if (dbReviewsResponse.rows.length == 0) {
                    if (newReview != "") {
                        dbClient.query("INSERT INTO reviews (review, user_id, book_id, username, rating) VALUES ($1, $2, $3, $4, $5)", [newReview, userID, bookID, username, newRating], function (dbError, dbResponse) {
                            res.redirect("/book/"+bookISBN);
                        });
                    } else {
                        res.redirect("/book/"+bookISBN);
                    }
                } else {
                    console.log("You can only leave one review per book!");
                }
            });
        });
    } else {
        res.render("error", {error: "Please log in to have access to this page."});
    }
});

app.get("/logout", function (req, res){
    if (req.session.user != undefined) {
        res.render("logout", {name: req.session.user.name});
        req.session.destroy(function (err) {
            console.log("Session destroyed.");
        });
    } else {
        res.render("error", {error: "You are not logged in yet."});
    }
});

app.listen(PORT, function () {
    console.log(`Shopping App listening on Port ${PORT}`);
});