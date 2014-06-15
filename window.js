var getNewName = function() {
    var D = new Date();
    var y = D.getFullYear(),
        m = D.getMonth() + 1,
        d = D.getDate();
    return 'simply_' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d + '_' + randomNumber(1000, 9999);
}

var randomNumber = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

var simply = {};

simply.fileName = getNewName();
simply.fileExtension = 'html';

window.simply = simply;

$(function() {
    // Set-up toolbar buttons
    $('#toolbar button[data-command]').each(function() {
        var command = $(this).attr('data-command');
        $(this).on('click', function() {
            document.execCommand(command, false, null);
        });
    });

    var updateFileName = function() {
        $('#filename').html(unescape(window.simply.fileName));
        $('#fileextension').html(unescape(window.simply.fileExtension ? '.' + window.simply.fileExtension : ''));
    }
    updateFileName();

    // Select text by default
    var selection = window.getSelection();
    selection.setPosition(0);
});