<?php
/*
 * upload.php 
 * Added: 02/23/07
 * Author: Kord Campbell
 *
 * This file provides POST uploading of multiple images via PHP.  It 
 * uses XML-RPC calls to connect to AZTK and add the images to the user's
 * account.
 *
 * Similar functionality is provided here as in PXN8 module's save modified
 * call to ZAPI.
 *
 * Includes a standard set of functions for talking via xmlrpc to AZTK
 * using PHP.
 *
 * Although some xmlrpc functions are contained in this library
 * (urlpost and xmlrpc_request), the function starting with aztk_
 * should be all you use for talking to aztk.
 */

function urlpost($host, $port, $location, &$data) {
    /*
     * This method sends a very basic HTTP POST to a host, port, and location,
     * sending it the $data as a string. It's very basic. Returns a string of
     * the resulting data.
     *
     * WARNING: Currently, this function dies upon failure to connect.
     */
    $content_length = strlen($data);
    $headers = "POST $location HTTP/1.0\r\n" .
               "Host: $host\r\n" .
               "Connection: close\r\n" .
               "User-Agent: Zoto PHP XMLRPC Client\r\n" .
               "Content-Type: text/xml\r\n" .
               "Content-Length: $content_length" . 
               "\r\n\r\n";

    $c = fsockopen($host, $port);
    if (!$c) {
        trigger_error("Unable to connect to AZTK Server: $host:$port");
    } else {
        fputs($c, $headers);
        fputs($c, $data);
        
        $returndata = "";
        while(!feof($c)){
            $returndata .= fgets($c, 1024);
        }
        fclose($c);
        return $returndata;
    }
}

function xmlrpc_request($host, $port, $location, $function, &$request_data) {
    /*
     * This method sends a very basic XML-RPC request. $host, $port, $location,
     * and $function are pretty simple. $request_data can be any PHP type,
     * and this function returns the PHP type of whatever the xmlrpc function
     * returns.
     *
     * WARNING: This function dies upon failure.
     */
    // Send request
    $request_xml = xmlrpc_encode_request($function, $request_data);

    // Split out response into headers, and xml
    $response = urlpost($host, $port, $location, $request_xml);
    $response_array = split("\r\n\r\n", $response, 2);
    $response_headers = split("\r\n", $response_array[0]);
    $response_xml = $response_array[1];

    $http_array = split(" ", $response_headers[0], 3);
    if ($http_array[1] != "200") {
		trigger_error("xmlrpc request failed: ({$http_array[1]}, {$http_array[2]}) at $host:$port using $location");
    } else {
		// Get native PHP types and return them for data.
		$response_data = xmlrpc_decode_request($response_xml, $function);
		return $response_data;
    }
}

function zapi_call($key, $auth, $function, $request_data) {
	global $zapi_hostname;
	global $zapi_port;
	global $zapi_location;

	$signature = array($key, $auth);
	foreach($request_data as $foo) {
		array_push($signature, $foo);
	}

	$return_data = xmlrpc_request($zapi_hostname, $zapi_port, $zapi_location, $function, $signature);

	if (is_array($return_data)) {
		if ($return_data['faultString']) {

			logDebug("failure in zapi_call");
			logDebug($return_data['faultString']);
			
			header("HTTP/1.0 500 Internal Server Error");
			print $return_data['faultString'];
			stop_debugging();
			die();
		}
	}
	return $return_data;
}

/*
*	start_debugging
*	If the debugging flag: $debugging is set to true, this function opens a file to save log messages.
*/
function start_debugging(){
	global $debugging;
	global $log_path;
	global $log_ref;
	if($debugging){
		$log_ref = fopen($log_path, 'a');
	}
}
/*
*	logDebug
*	if the debugging flag: $debugging is set to true, accepts a status message as a string and 
*	appends it to the log file opened by start_debugging
*	and echoes the message to the output. 
*/
function logDebug($str){
	global $debugging;
	global $log_ref;
	if($debugging){
		fwrite($log_ref, $str."\n\r");
		echo($str.'<br><br>');
	}
}
/*
*	stop_debugging
*	closes the debugging log file
*/
function stop_debugging(){
	global $debugging;
	global $log_ref;
	if($debugging){
		fclose($log_ref);
	}
}


/* debug to file cause flash has no clue */
$log_path = '/zoto/apache_web/static_pages/debug.txt';
$log_ref = null;
$upload_success = false;

/* split out our domain name */
$domain = split("[.:]", $_SERVER['HTTP_HOST']);
$domain = ($domain[1] . "." . $domain[2]);

/*if we're on org we want to turn on the debugging flag*/
$debugging = (strpos($_SERVER['HTTP_HOST'],'.org') === false )?false:true; 
start_debugging();

/* get our username and token from the cookie */
$auth = null;
if(array_key_exists('auth_hash', $_COOKIE)){
	logDebug("auth by cookie");
	$auth = split("[:]", $_COOKIE['auth_hash']);
} else if(array_key_exists('auth', $_GET)){
	logDebug('auth by get');
	$auth = split("[:]", $_GET['auth']);
} else {
	logDebug("Unable to auth user");
	trigger_error("Unable to auth user.");
}
$auth_username = $auth[0];
$auth_token = $auth[2];

/* set up our ZAPI call parameters */
//$zapi_hostname = $_SERVER['SERVER_ADDR'];
//$zapi_hostname = "www.zoto.com";
$zapi_hostname = "www.".$domain;
$zapi_port = 80;
$zapi_location = "/RPC2";
$zapi_key = "5d4a65c46a072a4542a816f2f28bd01a";
$zapi_auth = array("username"=>$auth_username, "token"=>$auth_token);
$zapi_function = "images.add";

$uploaddir = '/zoto/apache_web/static_pages/uploads/';
$uploadfile = $uploaddir . basename($_FILES['Filedata']['name']);
logDebug($uploadfile);

$image_filename = basename($_FILES['Filedata']['name']);

$media_id = '';
$error_msg = 'there was a problem with the server';


logDebug('number of files uploaded ' . count($_FILES));
foreach ($_FILES as $key => $value) {
	logDebug("Key: $key; Value: $value");
}



/* here's where we actually do the work */
if($auth[0] != null){
	if (move_uploaded_file($_FILES['Filedata']['tmp_name'], $uploadfile)) {
		logDebug("File is valid, and was successfully uploaded.");
	
		/* open and read in the image file data */
		$handle = fopen($uploadfile, "r");
		$media_binary = fread($handle, filesize($uploadfile));
		xmlrpc_set_type(&$media_binary, "base64");
		fclose($handle);
		unlink($uploadfile);

		/* build the args for the XML-RPC query */
		$zapi_query = array($image_filename, $image_filename, "", $media_binary);

		/* send it to the zoto server */
		$result = zapi_call($zapi_key, $zapi_auth, $zapi_function, $zapi_query);
		if (is_array($result)) {
			foreach ($result as $key => $value) {
				logDebug("Key: $key; Value: $value");
			}
			if($result[0] == '0'){
				$upload_success = true;
				global $media_id;
				$media_id = $result[1];
			} else if($result[0] == '-1'){
				global $error_msg;
				$error_msg = $result[1];
			}
		}

	} else {
		logDebug("no file specified for upload!");
		$error_msg = 'no file was specified to upload';
	}
} else {
	logDebug("User was not authed");
	$error_msg = 'you must be logged in to upload photos';
}

stop_debugging();
?>
<html>
<head>
<script>
<?php
	/*	
		The parent window can check for the success of the upload by the existance of the "success" variable and that its first item is a 0.
	*/
	if($upload_success){
		echo("var success = [0,{'filename':'$image_filename', 'media_id':'$media_id'}];");
	} else {
		echo("var success = [-1,{'filename':'$image_filename', 'msg':'$error_msg'}];");
	}
?>
</script>
</head>
<body></body>
</html>
