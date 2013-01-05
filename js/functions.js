/*---------------------------------------Clock-----------------------------------------------*/

function showTime(diff){
	var now = new Date();
	var time = now.valueOf() + (parseInt(diff) * 3600000);
	var nowCity = new Date(time);
	
	if(diff){
		var display = nowCity.toLocaleTimeString().substr(0, 8);
	}else{	
		var display = now.toLocaleTimeString().substr(0, 8);
	}
		
	document.getElementById("digitalclock").innerHTML = display;	
	timerid = setTimeout("showTime("+diff+")", 200);
}

function showDate(diff){
	var Datum = new Date();
	var time = Date.parse(Datum) + (parseInt(diff) * 3600000);
	var dateCity = new Date(time);
	
	var weekday = new Array("Sunday" ,"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
	var month = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
	
	theDate = weekday[dateCity.getDay()] + ", ";
	theDate += " " + dateCity.getDate() + ".";
	theDate += month[dateCity.getMonth()];
	theDate += " " + dateCity.getFullYear();
	
	document.getElementById("date").innerHTML = theDate;
	
	timers = setTimeout("showDate("+diff+")",1000);
 }
 
 
/*---------------------------------------Alarm-----------------------------------------------*/

function inc(arr, obj) {
    for(var i=0; i<arr.length; i++) {
        if (arr[i] == obj) return true;
    }
}	
	
function alarm(){
	
	var now = new Date();	
	var weekday = new Array("Su" ,"Mo", "Tu", "We", "Th", "Fr", "Sa");

	if (alarmtime.toString() == now.toLocaleTimeString().substr(0, 5)){	
		for(var i=0; i<alarmdays.length; i++) {
			if (alarmdays[i] == weekday[now.getDay()]){ 
				clearTimeout(alarmtimer);
				timeIsOver("alarm");
			}
    	}
	}else{
		alarmtimer = window.setTimeout("alarm()", 1000);
	}

 }


/*---------------------------------------Stopwatch-----------------------------------------------*/

	firsttime = true;
	isrunning = 0;
	roundCounter = 0;
	lastRound = 0;
	
function stopwatchHandler(){
	if(isrunning == 0){			
 		if(firsttime){stopwatchStart = new Date(); firsttime=false}
 		
		stopwatch();
		isrunning = 1;
		document.getElementById("stopwatchStart").innerHTML = 'Stop';
 		document.getElementById("stopwatchReset").style.display = 'none';
 		document.getElementById("stopwatchRound").style.display = 'inline-block';
        
	}else{		
		clearTimeout(stopwatchTimer);
		isrunning = 0;		
		document.getElementById("stopwatchStart").innerHTML = 'Continue';
		document.getElementById("stopwatchReset").style.display = 'inline-block';
 		document.getElementById("stopwatchRound").style.display = 'none';
			
	}	
}

function stopwatchRound(){
	roundCounter += 1;
 	document.getElementById("rounds").style.display = 'inline-block';

	//document.getElementById("rounds").innerHTML = '<tr><td>Round 1</td><td>' + tohours(stopwatchCounter) + '</td></tr>';
	
	var row = document.createElement("tr");
		row.id = "row_" + roundCounter;
        document.getElementById("rounds").appendChild(row);
	var round = document.createElement("td");
		round.innerHTML = roundCounter;		
        document.getElementById("row_" + roundCounter).appendChild(round);
	var time = document.createElement("td")		
		time.innerHTML = tohours(stopwatchValue);
        document.getElementById("row_" + roundCounter).appendChild(time);
    var difference = document.createElement("td")		
		difference.innerHTML = tohours(stopwatchValue - lastRound);
		lastRound = stopwatchValue;
        document.getElementById("row_" + roundCounter).appendChild(difference);
}
 
function stopwatch(){ 	
 	stopwatchNow = new Date();
 	stopwatchValue = stopwatchNow - stopwatchStart;
 	
	document.getElementById("stopwatchDisplay").innerHTML = tohours(stopwatchValue); 	
 
 	stopwatchTimer = window.setTimeout("stopwatch()", 10);
}

function stopwatchReset(){
 	stopwatchStart = new Date();
 	roundCounter = 0;
 	lastRound = 0;
 	
 	document.getElementById("stopwatchDisplay").innerHTML = '00:00:00.00';
	document.getElementById("stopwatchStart").innerHTML = 'Start';
 	document.getElementById("stopwatchReset").style.display = 'none';
 	document.getElementById("rounds").style.display = 'none';
 	document.getElementById("rounds").innerHTML = '<tr><th>Round</th><th>Time</th><th>Duration</th></tr>';
}
  

/*---------------------------------------Timer-----------------------------------------------*/

function countdown(countdownTo){	
	var now = new Date();	
	var milsec = countdownTo - now;		
	var rest = new Date(milsec);	
	var theTime = rest.toUTCString().substr(16,9);
	
	if(milsec > 86400000){
		//var theYears = rest.getFullYear() - 1970;
		var theDays = Math.floor(milsec / (24 * 60 *60* 1000)) + ' Days, ';
	}else{
		var theDays = '';
	}
	
	if(rest <= 0){		
		clearTimeout(stopIt);
		timeIsOver("timer");
	}else{
		document.getElementById("rest").innerHTML = theDays + theTime;
		stopIt = setTimeout("countdown("+ countdownTo +")", 200);
	}	
}

 
/*------------------------------------------------------------------------------------------------*/ 

function tohours(milsec){

 	var CountdownText = '';
 	
 	var Stunden = Math.floor(milsec/3600000);
	Rest = milsec % 3600000;
	
		if(Stunden > 9){ CountdownText += Stunden + ':' ; }
		else{ CountdownText += "0" + Stunden + ':';}
	
	var Minuten = Math.floor(Rest/60000);
	Rest = milsec % 60000;
	
		if(Minuten > 9){ CountdownText += Minuten  + ':';}
		else if(Minuten == 0) { CountdownText += "0" + Minuten  + ':';}		
		else { CountdownText += "0" + Minuten  + ':';}
	
	var Sekunden = Math.floor(Rest/1000);
	Rest = milsec % 1000;
	
		if(Sekunden > 9) { CountdownText += Sekunden  + '.';}
		else { CountdownText += "0" + Sekunden  + '.';}
		
	var Millisekunden = Math.floor(Rest/10);
	
		if(Millisekunden >= 10) {CountdownText += Millisekunden;}
		else if (Millisekunden < 10 && Millisekunden >= 0) {CountdownText += "0" + Millisekunden;}
		else {CountdownText += "00" + Millisekunden;}
		
	return CountdownText
}

function timeIsOver(type){
	var audioElement = document.getElementById("audioplayer"); 
		audioElement.play();
	
	document.getElementById("html").style.background = "rgb(100,0,0)";
	
	if(type == "alarm"){
		var isitok = alert('Time to get up!'); 
		if(isitok == undefined){		
			var audioElement = document.getElementById("audioplayer"); 
			audioElement.pause();
			document.getElementById("html").style.background = "url(img/bg.jpg) black";
		}
	}else{	
		var isitok = alert('Your Time Is Over!'); 
		if(isitok == undefined){		
			var audioElement = document.getElementById("audioplayer"); 
			audioElement.pause();
			document.getElementById("html").style.background = "url(img/bg.jpg) black";
			window.location.replace('http://timeomat.com/timer'); 
		}
	}
}
