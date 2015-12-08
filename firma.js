
var app = angular.module('firma_app', [ ]);

app.controller("firmaCtrl", function($scope ) {
	
	// valida si el navegador soporta File API
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		console.log('Great success! All the File APIs are supported.');
	} else {
		alert('The File APIs are not fully supported in this browser.');
	}
	
	var crypto = window.crypto || window.msCrypto;
	
	// valida si el navegador soporta Crypto API
	if(crypto.subtle) {
		console.log('Cryptography API Supported');	 
	} else {
		alert('Cryptography API not Supported');
	}
	
	$scope.password = '';
	var keyArrayBuffer = null;
	var certArrayBuffer = null;
	// var keyForged = null;
	
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
	
	function _arrayBufferToBase64( buffer ) {
		var binary = '';
		var bytes = new Uint8Array( buffer );
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode( bytes[ i ] );
		}
		return window.btoa( binary );
	}
	
	$( document ).ready(function() {
		
	    $('.btn-file :file').each(function() {
  			$( this ).on('fileselect', function(event, numFiles, label) {
	        	// console.log(numFiles);
		        console.log(label);
		    });
  		});	

		$(document).each(function() {
  			$( this ).on('change', '.btn-file :file', function() {
				var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
				input.trigger('fileselect', [numFiles, label]);
		    });
		});

	    $('.btn-file :file').each(function() {
  			$( this ).on('fileselect', function(event, numFiles, label) {
		        var input = $(this).parents('.input-group').find(':text'),
		            log = numFiles > 1 ? numFiles + ' files selected' : label;
		        
		        if( input.length ) {
		            input.val(log);
		        } else {
		            if( log ) 
		            	alert(log);
		        }
		    });
	        
	    });

		// hanlder para leer el archivo local del usuario CERT/KEY
		function handleFileSelect(evt) {
			
			evt.stopPropagation();
			evt.preventDefault();
		
			var files = evt.target.files; 

			for (var i = 0, f; f = files[i]; i++) {
					// console.log(f);
					
					var reader = new FileReader();
					
					// Closure to capture the file information.
					reader.onload = (function(theFile) {
						return function(e) {
						
							console.info("B64 >> " + _arrayBufferToBase64(e.target.result));
							
							if (theFile.name.endsWith('.key')){
								keyArrayBuffer = e.target.result; 

								$('#key_b64').val(_arrayBufferToBase64(keyArrayBuffer));
								// keyForged = forge.util.binary.raw.encode(new Uint8Array(e.target.result));


								$('#key_file_name').val(theFile.name);


							} else if (theFile.name.endsWith('.cer')){
								certArrayBuffer = e.target.result; 
								$('#cert_b64').val(_arrayBufferToBase64(certArrayBuffer));

								$('#cert_file_name').val(theFile.name);

							} else {
								console.log(" ERROR! the name was :" + theFile.name);
							}
							
						};
					})(f);

    				function errorHandler(evt) {
					    switch(evt.target.error.code) {
					      case evt.target.error.NOT_FOUND_ERR:
					        alert('File Not Found!');
					        break;
					      case evt.target.error.NOT_READABLE_ERR:
					        alert('File is not readable');
					        break;
					      case evt.target.error.ABORT_ERR:
					        break; // noop
					      default:
					        alert('An error occurred reading this file.');
					    };
					}

    				reader.onerror = errorHandler;

					// LOS MODOS DE LECTURA DE HTML5
					reader.readAsArrayBuffer(f);
					// reader.readAsText(f, 'UTF-8');
					
					console.log("* * * * * * * * * * * * * * * *");
					console.log("name:" + escape(f.name));
					console.log("type:" + f.type);
					console.log("size:" + f.size);
					console.log("last modifided:" + f.lastModifiedDate.toLocaleDateString());
					console.log("* * * * * * * * * * * * * * * *");
					
				}
				
		}
		
		// HASH DEL ARCHIVO A FIRMAR
		document.getElementById('file').addEventListener('change', function () {

			var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
				file = this.files[0],
				chunkSize = 2097152, // Read in chunks of 2MB
				chunks = Math.ceil(file.size / chunkSize),
				currentChunk = 0,
				spark = new SparkMD5.ArrayBuffer(),
				fileReader = new FileReader();

			fileReader.onload = function (e) {

				// console.log('read chunk nr', currentChunk + 1, 'of', chunks);
				spark.append(e.target.result); // Append array buffer
				currentChunk++;

				if (currentChunk < chunks) {
					loadNext();
				} else {
					// console.log('finished loading');
					var hsh_ = spark.end();
					console.info('computed hash', hsh_); // Compute hash
					$('#hash_archivo').val(hsh_);
				}

			};

			fileReader.onerror = function () {
				console.warn('oops, something went wrong.');
			};

			function loadNext() {
				var start = currentChunk * chunkSize,
					end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

				fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
			}

			loadNext();
		});

		document.getElementById('key').addEventListener('change', handleFileSelect, false);
		document.getElementById('cert').addEventListener('change', handleFileSelect, false);
		
	});

	// Boton Firmar
	$scope.firmar = function(){
		
		console.log("* * * * * * * * * * * * * * * *");
		console.log("* FIRMAR! *");
		$scope.loading = true;

		try {

			// CERTIFICADO
			var z1CertPEM = "" +
			"-----BEGIN CERTIFICATE-----\n" +
			$('#cert_b64').val() +
			"\n-----END CERTIFICATE-----";
			
			var c = new X509();
			c.readCertPEM(z1CertPEM);

			// console.log(c);

			var unix_timestamp_after = KJUR.jws.IntDate.getZulu("20" + c.getNotAfter());
			var dateAfter = new Date(unix_timestamp_after*1000);

			var unix_timestamp_before = KJUR.jws.IntDate.getZulu("20" + c.getNotBefore());
			var dateBefore = new Date(unix_timestamp_before*1000);

			$('#certInfo').html( " <span style='color:green;'> CERT INFO </span> "
				
				+ " <br/> Issued To: <span style='color:red;'>" + c.getSubjectString() + "</span>"
				+ " <br/> Issuer: <span style='color:red;'>" + c.getIssuerString() + "</span>"
				+ " <br/> Serial Number Hex: <span style='color:red;'>" + c.getSerialNumberHex() + "</span>"
				+ " <br/> Valid since: <span style='color:red;'>" + dateBefore + "</span>"
				+ " <br/> Valid until: <span style='color:red;'>" + dateAfter + "</span>"
				// + " <br/> "
				// + " <br/> hN: <span style='color:red;'>"  + c.subjectPublicKeyRSA_hN + "</span>"
				// + " <br/> hE: <span style='color:red;'>" + c.subjectPublicKeyRSA_hE + "</span>"
				// + " <br/> n: <span style='color:red;'>" + c.subjectPublicKeyRSA.n + "</span>"
				// + " <br/> e: <span style='color:red;'>" + c.subjectPublicKeyRSA.e + "</span>"
				);

			// LLAVE PRIVADA
			var pkcs8PEM = "" +
			"-----BEGIN ENCRYPTED PRIVATE KEY-----\r\n" +
			$('#key_b64').val() 
			"-----END ENCRYPTED PRIVATE KEY-----\r\n";

			var h = PKCS5PKEY.getKeyFromEncryptedPKCS8PEM(pkcs8PEM, $scope.password) ;

			// console.log('h');

			$('#keyInfo').html( " <span style='color:green;'> KEY INFO </span> "
				+ " <br/> Type: <span style='color:red;'>" + h.type + "</span>"
				+ " <br/> is private key?: <span style='color:red;'>" + h.isPrivate + "</span>"
				// + " <br/> "
				// + " <br/> n: <span style='color:red;'>" + h.n + "</span>"
				// + " <br/> e: <span style='color:red;'>" + h.e + "</span>"
				// + " <br/> p: <span style='color:red;'>" + h.p + "</span>"
				// + " <br/> q: <span style='color:red;'>" + h.q + "</span>"
				);

			// FIRMAR
			// var hashAlg = $('#hash_alg').val();
			// console.log("with algorithm : " + hashAlg );
			// var hSig = h.signString($('#hash_archivo').val(), hashAlg);

			var sig = new KJUR.crypto.Signature({
				"alg" : "SHA1withRSA"
			});
			sig.init(h);
			sig.updateString($('#hash_archivo').val());
			var hSig = sig.sign();

			console.info("Firma :: " + hSig);

			$('#la_pinche_firma').val(hSig);


			// VALIDAR FIRMA
			var sMsg = $('#hash_archivo').val();

			var isValid = c.subjectPublicKeyRSA.verifyString(sMsg, hSig);

			if (isValid) {
				alert("VALID SIGN!! Success!!");
			} else {
				alert("INVALID SIGN!");
			}

		} catch(err) {
		    console.error(err);
		}

		$scope.loading = false;
		console.log("* END FIRMAR *");
		console.log("* * * * * * * * * * * * * * * *");

	};
		
});