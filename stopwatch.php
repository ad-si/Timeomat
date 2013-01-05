<?php

include('inc/common.inc.php');
    
$title = ' | Stopwatch';

$content .=
'<div id="stopwatchwrapper">
	<h2 id="stopwatchDisplay">00:00:00.00</h2>
	<br />
	
	<div id="stopwatchcontrols">
		<button id="stopwatchStart" onclick="stopwatchHandler()" />Start</button>
		<button id="stopwatchRound" onclick="stopwatchRound()" style="display: none" />Round</button>
		<button id="stopwatchReset" onclick="stopwatchReset()" style="display: none" />x</button>
		<br />
		<table id="rounds" style="display: none">
			<tr><th>Round</th><th>Time</th><th>Duration</th></tr>
		</table>
	</div>
</div>';



$template = new template($template_file);
$template->readtemplate();
$template->replace('TITLE', $title);
$template->replace('HEADER', $template_header);
$template->replace('MENU', $menu);
$template->replace('CONTENT', $content);
$template->replace('FOOTER', $footer);
$template->parse();

?>