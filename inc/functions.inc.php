<?php

function escape($text) {
     return htmlspecialchars($text);
}

function browserhack($d) {

	$a = (isset( $_SERVER['HTTP_USER_AGENT'] ) ) ? strtolower( $_SERVER['HTTP_USER_AGENT'] ) : '';//Detect Browser (order is important!)
	$b = '';
	
	if(isset($d["mobile"])) {
		if(stristr($a, "iphone")) {
			$b = $d["mobile"];
		}elseif(stristr($a, "android")) {
			$b = $d["mobile"];
		}elseif(stristr($a, "blackberry")) {
			$b = $d["mobile"];
		}
	}
	
	if(isset($d["desktop"])) {
		if(!stristr($a, "iphone") && !stristr($a, "android")) {
			$b = $d["desktop"];
		}
	}
	
	if (stristr($a, "blackberry") && isset($d["blackberry"])) {
		$b = $d["blackberry"];
	}	
	elseif (stristr($a, "iphone") && isset($d["iphone"])) {
		$b = $d["iphone"];
	}	
	elseif (stristr($a, "android") && isset($d["android"])) {
		$b = $d["android"];
	}
	elseif (stristr($a, "opera") && isset($d["opera"])) {
		$b = $d["opera"];
	}
	elseif (stristr($a, "msie") && isset($d["ie"])) {
		$b = $d["ie"];
	}
	elseif (stristr($a, "chrome") && isset($d["chrome"])) {
		$b = $d["chrome"];
	}
	elseif (stristr($a, "safari") && isset($d["safari"])) {
		$b = $d["safari"];
	}
	elseif (stristr($a, "firefox") && isset($d["firefox"])) {
		$b = $d["firefox"];
	}				
	
		return $b;
}

?>