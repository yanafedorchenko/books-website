$(document).ready(function () {
    $("#search_input_field").keyup(fetchJSONBookData);
    $("#login_navbar").remove();
    $("#register_navbar").remove();
    fetchUsername();
});

function fetchJSONBookData(event) {
    var searchTerm = $("#search_input_field").val();
    
    $.ajax({
        type: "post",
        url: "/searchresults",
        data: {
            search: searchTerm
        },
        success: ajaxSearch
    });
}

function ajaxSearch(data) {
    $("#search_results").empty();
    
    if(data.books.length != 0) {
        showSearchSuggestions(data);
    } else {
        throwError();
    }
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

function showSearchSuggestions(data) {
    for(var i=0; i<data.books.length; i++) {
        var listItem = "<li class='list-group-item'>";
        var link = "<a href='/book/" + data.books[i].isbn + "'>\"" + data.books[i].title + "\" by " + data.books[i].author + " (" + data.books[i].year + ")</a>";
        listItem += link + "</li>";
        
        $("#search_results").append(listItem);
    }
}

function throwError() {
    var error = "<li class='list-group-item list-group-item-danger'>No search results</li>";
    $("#search_results").append(error);
}