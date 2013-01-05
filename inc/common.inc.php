<?php

include('classes/template.class.php');
include('functions.inc.php');

function error_handler($errno, $errstr, $errfile, $errline) {
	// if (substr($_SERVER['REQUEST_URI'], 0, 5) == '/timeomat/')
        echo '<pre>'.(new ErrorException($errstr, 0, $errno, $errfile, $errline)).'</pre>';
    // else
    // mail('adriansieber@web.de', 'AdrianSieber error', new ErrorException($errstr, 0, $errno, $errfile, $errline));
    if ($errno != E_WARNING && $errno != E_NOTICE)
        exit;
}

set_error_handler('error_handler');

$template_file = 
'template/home.htm';


$template_header = 
browserhack(array(
	'mobile' => '<link rel="stylesheet" href="styles/mobile.css" type="text/css" />
				<meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
				<link rel="apple-touch-icon" href="img/favicon_hq.png"/>
				<link rel="apple-touch-startup-image" href="/favicon_hq.png">
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="none" />',
	'desktop' => '<link rel="stylesheet" href="styles/desktop.css" type="text/css" />',
));

$template_header .= 
'<link rel="icon" href="img/favicon.png" type="image/png" />
<script src="js/functions.js" type="text/javascript"></script>
<script type="text/javascript" src="https://apis.google.com/js/plusone.js"></script>';



$menu = '';

$menu .= 
	'<h1 title="Timeomat">
		<a href="/">
			Timeomat
		</a>
	</h1>'.
	
	'<div id="links">'.
		'<a id="clock" href="clock" title="Clock" ></a>'.
		'<a id="alarm" href="alarm" title="Alarmclock" ></a>'.
		'<a id="stop" href="stopwatch"  title="Stopwatch"></a>'.
		'<a id="timer" href="timer" title="Timer" ></a>'.
	'</div>'.
	'<a id="adrian" href="http://www.adriansieber.com/">By Adrian Sieber</a>';

				
$footer =
'<div id="social">
		<div class="fb-like" data-href="http://www.facebook.com/timeomat" data-send="true"
			data-layout="box_count" data-width="100" data-show-faces="true">
		</div>
		<a href="https://twitter.com/share" class="twitter-share-button" data-count="vertical" data-via="AdrianSieber">
			Tweet
		</a>
		<script type="text/javascript" src="//platform.twitter.com/widgets.js">
		</script>
		&nbsp;&nbsp;
		<g:plusone size="tall" href="http://timeomat.com/"></g:plusone>
</div>';	

$content = '';
?>
