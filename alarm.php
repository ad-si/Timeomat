<?php
include('inc/common.inc.php');
 
$title = ' | Alarm';


$months = array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
 
 
$content .= 
'<div id="alarmwrapper">';

$content .='
<audio id="audioplayer" src="sounds/alarm.wav" preload="auto" loop="loop" ></audio>';

if(!isset($_GET['alarm']) && !isset($_GET['sound'])){
	
	$content .= 
	'<form action="alarm" method="get">
		<input type="time" value="'.(isset($_GET['alarm']) ? escape($_GET['alarm']) : '12:00').'" name="alarm"/>';
				
			$content .= '<div id="repeat">';
			
			foreach($months as $month){
				$content .=
				'<input type="checkbox" name="'.escape(substr($month, 0, 2)).'" '.(isset($_GET[substr($month, 0, 2)]) ? 'checked="checked"' : '').' /> '.
					$month.
				'<br />';
			}
			
			$content .='</div>';	
				
		$content .=
		'<select name="sound">';
		
			if(isset($_GET['sound'])){
				$content .='<option value="'.escape($_GET['sound']).'">'.escape(ucfirst($_GET['sound'])).'</option>';
			}else{
				$content .=
				'<option value="alarmbell">Alarmbell</option>'.
				//'<option value="waves">Waves</option>'.
				//'<option value="guitar">Guitar</option>'.
				//'<option value="fire">Fire</option>'.
				'';
			}
			
		$content .=
		'</select>'.
	
	((isset($_GET['sound']) && isset($_GET['alarm']))? '' : '<input type="submit" value="Start" />').
	
	'</form>';

}else{

	$content .=  
	'<div id="clockwrapper">
	
		<h2 id="digitalclock"></h2>
		
		<script type="text/javascript">
				showTime();
		</script>

	</div>';
	
	$content .=
	'<h3>'.escape($_GET['alarm']).'</h3>'.
	'<div id="repeat">'.
	'';
			
			foreach($months as $month){
				if(isset($_GET[substr($month, 0, 2)])){
				$content .=
				'<input type="checkbox" name="'.escape(substr($month, 0, 2)).'" checked="checked" /> '.
					$month.
				'<br />';
				}
			}
			
	$content .='</div>';
	
	$content .=
	'<h3>'.escape(ucfirst($_GET['sound'])).'</h3>';
	
	
	$content .='
	<script type="text/javascript">
	
		alarmsound = "'.escape($_GET['sound']).'";
		alarmtime = "'.escape($_GET['alarm']).'";
		alarmdays = new Array(';
		
		foreach($months as $month){
				$content .= (isset($_GET[substr($month, 0, 2)]) ? '"'.escape(substr($month, 0, 2)).'", ' : '');
			}
		
		$content .= 
		'"whatever");
		
		
		alarm(alarmtime, alarmdays, alarmsound);
		
	</script>';	

}

$content .='</div>';
	 
     
$template_header .= '';


$template = new template($template_file);
$template->readtemplate();
$template->replace('TITLE', $title);
$template->replace('HEADER', $template_header);
$template->replace('MENU', $menu);
$template->replace('CONTENT', $content);
$template->replace('FOOTER', $footer);
$template->parse();

?>