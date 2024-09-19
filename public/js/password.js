$(document).ready(function() {
    $("#password_input").one("keypress", addVerification);
});

function addVerification() {
    var password = $("#password_input").val();
    var requirementsList = $("#password_requirements");
    var requirements = "";
    var title = "<p>Password requirements:</p>";
    var requirementsArray = [
        "At least <b>one number</b>", 
        "Be at least <b>8 characters</b>"];
    var IDs = ["one_number", "eight_characters"];
    
    for (var i = 0; i < requirementsArray.length; i++) {
        requirements += "<li class='list-group-item requirements_init' id=" + IDs[i] + ">" + requirementsArray[i] + "</li>";
    }
    
    requirementsList.before(title);
    requirementsList.append(requirements);
    
    $("#password_input").keyup(verifyPassword);
}

function verifyPassword(event) {
    var password = $("#password_input").val();
    var eightCharacters = $("#eight_characters");
    var oneNumber = $("#one_number");
    
    if (event.keyCode == 8) {
        somethingChanged(password, eightCharacters, oneNumber);
    } else {
        checkLength(password, eightCharacters);
        containsOneNumber(password, oneNumber);
    }
    
    if ($("#eight_characters").hasClass("requirement_fulfilled") && $("#one_number").hasClass("requirement_fulfilled")) {
        enableButton();
    }
}

function enableButton () {
    $("#sign_up_button").attr("disabled", false);
}


function checkLength(password, id) {
    if (password.length >= 8) {
        id.removeClass("requirements_init");
        id.addClass("requirement_fulfilled");
    }
}

function containsOneNumber(password, id) {
    var password = $("#password_input").val();

    for(let i = 0; i <= 9; i++) {
        if (password.includes(i)) {
            id.removeClass("requirements_init");
            id.addClass("requirement_fulfilled");
        }
    }
}

function somethingChanged(password, idLength, idNumber) {
    if (password.length < 8) {
        idLength.removeClass("requirement_fulfilled");
        idLength.addClass("requirements_init");
        $("#sign_up_button").attr("disabled", true);
    } 
    
    if (/\d/.test(password) == false) {
        idNumber.removeClass("requirement_fulfilled");
        idNumber.addClass("requirements_init");
        $("#sign_up_button").attr("disabled", true);
    }
}