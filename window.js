window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.resolveLocalFileSystemURL = window.webkitResolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

//(function($, document, window, navigator) {

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

	var simply = {},
		fs;

	simply.fileName = getNewName();
	simply.fileExtension = 'html';
	simply.originalName = simply.fileName + '.' + simply.fileExtension;
	simply.fileStatus = 'New file';
	simply.isNew = true;

	window.simply = simply;

	$(function() {
		// Set-up toolbar buttons
		$('#toolbar button[data-command]').each(function() {
			var command = $(this).attr('data-command');
			$(this).on('click', function() {
				document.execCommand(command, false, null);
			});
		});


		$('#filename').on('blur', function() {
			window.simply.fileName = unescape($(this).html());
			updateFileName();
		});

		$('#fileextension').on('blur', function() {
			window.simply.fileExtension = unescape($(this).html());
			updateFileName();
		});

		// setup idle functions
		$('#editor').on("idle.idleTimer", function(event, elem, obj) {
			console.log('idle');
			if(!window.simply.isNew){
				save(getFileName());
			}
			window.simply.isNew = false;
		});

		$('#editor').on("active.idleTimer", function(event, elem, obj) {
			updateFileStatus('typing...');
		});
		// starting idle timer
		$('#editor').idleTimer({
			timeout: 2000,
			events: 'keydown'
		});

		// Select text by default
		var selection = window.getSelection();
		selection.setPosition(0);

		initFs(function(){
			updateFileName();
			updateLoadDropdown();
			updateSaveDropdown();
		});
	});

	var initFs = function(callback) {
		navigator.webkitPersistentStorage.requestQuota(
			1024 * 1024 * 30,
			function(grantedSize) {
				window.requestFileSystem(window.PERSISTENT, grantedSize, function(_fs) {
					fs = _fs;
					if(callback) callback();
				}, errorHandler);
			}, errorHandler
		);
	};

	var updateFileName = function(newName) {
		if(newName !== void 0){
			if(newName.indexOf('.') > -1){
				var fn = newName.split('.');
				window.simply.fileName = fn[0];
				window.simply.fileExtension = fn[1];
			}else{
				window.simply.fileName = '';
				window.simply.fileExtension = newName;
			}
		}
		$('#filename').html(unescape(window.simply.fileName));
		$('#fileextension').html(unescape(window.simply.fileExtension));
		updateSaveDropdown();
	}

	var save = function(filename) {
		fs.root.getFile(
			filename, {
				create: true
			},
			function(fileEntry) {
				console.log('fileEntry: ', fileEntry);
				fileEntry.createWriter(function(fileWriter) {
					console.log('fileWriter: ', fileWriter);
					fileWriter.onwriteend = function(e) {
						console.log('Write completed.');
						updateLoadDropdown();
						updateFileStatus('Saved');
					};

					fileWriter.onerror = function(e) {
						console.error('Write failed: ', e);
						updateFileStatus('Error while saving!');
					};

					var content = $("#editor").html();
					var blob = new Blob([content], {type: 'text/plain'});
					fileWriter.write(blob);
				}, errorHandler);
			}, errorHandler
		);
	};

	var load = function(filename, callback){
		fs.root.getFile(filename, {}, function(fileEntry) {
			fileEntry.file(function(file) {
				var reader = new FileReader();

				reader.onload = function(e) {
					window.simply.originalName = filename;
					updateSaveDropdown();
					updateFileStatus('Loaded');
					if (callback) callback(this.result);
				};

				reader.readAsText(file);
			}, errorHandler);
		}, errorHandler);
	}

	var getFileList = function(callback){
	    var dirReader = fs.root.createReader();
		var entries = [];

		var fetchEntries = function() {
			dirReader.readEntries(function(results) {
				if (!results.length) {
					if (callback) callback(entries.sort().reverse());
				} else {
					entries = entries.concat(results);
					fetchEntries();
				}
			}, errorHandler);
		};

		fetchEntries();
	}

	var updateSaveDropdown = function(){
		var ul = $('#dropdown-save > ul');
		$('li:not([role="presentation"])', ul).remove();

		if(window.simply.originalName !== getFileName()){
			$('<li><a href="#">' + window.simply.originalName + '</a></li>')
				.on('click', function() {
					save(window.simply.originalName);
				})
				.appendTo(ul);
		}

		$('<li><a href="#">' + getFileName() + '</a></li>')
			.on('click', function() {
				save(getFileName());
			})
			.appendTo(ul);
	}
	

	var updateLoadDropdown = function() {
		var ul = $('#dropdown-load > ul');
		$('li:not([role="presentation"])', ul).remove();

		getFileList(function(savedFiles){
			for (var i = 0; i < savedFiles.length; i++) {
				var file = savedFiles[i];

				// load dropdown
				//var del = $('<i class="fa fa-fw fa-trash-o pull-right" data-ls-name="' + file.name + '"></i>')
				//	.on('click', function() {
				//		console.log('remove', $(this).attr('data-ls-name'))
				//	});
				
				var title = $('<a href="#" data-ls-name="' + file.name + '">' + file.name + '</a>')
					.on('click', function() {
						var filename = $(this).attr('data-ls-name');
						console.log('load: ' + filename);
						load(filename, function(content){
							$("#editor").html(content);
							updateFileName(filename);
						});
					});

				//del.appendTo(title)
				$('<li></li>')
					.append(title)
					.appendTo(ul);
			}
		});
	}

	var updateFileStatus = function(status){
		window.simply.filestatus = status;
		$('#filestatus').text(status);
	}

	var getFileName = function(){
		if(window.simply.fileExtension){
			if(window.simply.fileExtension.length > 0){
				return window.simply.fileName + '.' + window.simply.fileExtension;
			}
		}
		return window.simply.fileName;
	}

	function errorHandler(error) {
		console.error(error.name, error);
	}
//})(jQuery, document, window, navigator);