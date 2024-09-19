$(document).ready(function () {
    $("#search_form").submit(fetchISBN);
});


function fetchISBN() {
    $.ajax({
        type: "post",
        url: "/search",
        success: loadBook
    });
}

function loadBook(data) {
    var isbn = data.isbn;
    var url = `https://www.googleapis.com/books/v1/volumes?q=${booksISBN}&maxResults=1&projection=lite`;
    
    $.ajax({
        url: url,
        success: addBookCover
    });
}

function addBookCover (data) {
    alert("it's ok");
    var bookCover = "img src='" + data.items[0].imageLinks.thumbnail + "'";
    
    $("#book_title").before(bookCover); 
}

function fetchUsername() {
     $.ajax({
        type: "post",
        url: "/searchresults",
        success: addUsername
     });
}

function addUsername(data) {
    var username = data.username;
    
    var username_navbar = "<span class='navbar-text'>" + username + "</span>";
    $("#navbarSupportedContent").append(username_navbar);
    
}