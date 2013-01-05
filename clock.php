<?php
include('inc/common.inc.php');
  
$title = ' | Clock'; 

((isset($_GET['diff'])) ? ($diff = $_GET['diff']) : ($diff = 0));  

$content .=
'<div id="clockwrapper">
	
	<h2 id="digitalclock"></h2>
	
	<h3 id="date"></h3>
	
	<script type="text/javascript">
			showTime('.$diff.');
			showDate('.$diff.');
	</script>

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