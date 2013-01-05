<?php

include('inc/common.inc.php');

$content .='<div id="timerwrapper">';

$content .='
<audio id="audioplayer" src="sounds/alarm.wav" preload="auto" loop="loop" ></audio>';


if(isset($_GET['dur']) && $_GET['dur'] != '00:00:00'){		

	$title = ' | '.(isset($_GET['name']) ? escape($_GET['dur']).' '.escape($_GET['name']).' Timer' : escape($_GET['dur']).' Timer');
	
	$dur = explode(":", $_GET['dur']);	
	$duration = ($dur[0] * 60 * 60 * 1000) + ($dur[1] * 60 * 1000) + ($dur[2] * 1000);
	
	
	$content .= (isset($_GET['name']) ? '<h3>'.escape($_GET['name']).'</h3>' : '');
	$content .='<h2 id="rest"></h2>';

	$content .='
	<script type="text/javascript">
	
		var now = new Date();
		var later = now.valueOf() + '.$duration.';
	
		countdown(later);
		
	</script>';	
	
}elseif(isset($_GET['date']) && $_GET['date'] != '2011-01-01'){

 
	$title = ' | Countdown'.(isset($_GET['name']) ? ' to '.escape($_GET['name']) : '') .'';
	
	
	$content .= (isset($_GET['name']) ? '<h2>'.$_GET['name'].'</h2>' : '');
	$content .='<h3 id="rest"></h3>';

	$content .='
	<script type="text/javascript">
	
		var later = Date.parse("'.$_GET['date'].'T'.$_GET['time'].'");
		countdown(later);
		
	</script>';
		
}else{	
		 
	$title = ' | Timer';
	
	$content .= '
	<form action="timer" method="get" >
		<h3>Start a Timer</h3>
		<input type="text" value="00:00:00" name="dur" />
		<input type="submit" value="Start" />
	</form>
	<form action="timer" method="get" >
		<h4>or a Countdown</h4>
		<input type="date" value="2011-01-01" name="date" />			
		<input type="time" value="12:00" name="time" />
		<input type="text" name="name" placeholder="name" />
		<input type="submit" value="Start" />
	</form>	
	';
	
}
  
  
$content .='</div>';


$template = new template($template_file);
$template->readtemplate();
$template->replace('TITLE', $title);
$template->replace('HEADER', $template_header);
$template->replace('MENU', $menu);
$template->replace('CONTENT', $content);
$template->replace('FOOTER', $footer);
$template->parse();

?>