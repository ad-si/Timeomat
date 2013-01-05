<?php
include('inc/common.inc.php');

$title = "";     	 
     	 
$content .=  
'<div id="home">
	<img src="img/clocks.png" alt="Clock, Alarm, Stopwatch & Timer" />
	<em>Clock, Alarm, Stopwatch & Timer.<br />
	All in your Browser.</em>
</div>
';
	 


$template = new template($template_file);
$template->readtemplate();
$template->replace('TITLE', $title);
$template->replace('HEADER', $template_header);
$template->replace('MENU', $menu);
$template->replace('CONTENT', $content);
$template->replace('FOOTER', $footer);
$template->parse();

?>