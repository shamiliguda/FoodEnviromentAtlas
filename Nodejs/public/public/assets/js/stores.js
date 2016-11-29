/**
 * Created by Ramana on 9/17/2016.
 */

function noData(msg) {
	var nodata = document.createElement('div');
	nodata.className = 'alert alert-warning';
	nodata.innerHTML = /*'<span class="pe-7s-junk" style="font-size: 20px;"></span>' +*/ (msg || ' An error occurred while contacting server...');
	return nodata;
}

function getSnapTooltip(data) {
	var str = '<div style="margin-top: -12px;width:200px;">\
	<strong>' + $('.checkBox.checked').next().text().trim() + '/1,000 pop (%) : </strong> <span> ' + data[2] + ' </span><br>\
	<strong>Stores Count : </strong> <span> ' + data[1] + ' </span>\
			</div>';
	return str;
}
function drawChart(data, element, gChart, options) {
	var _options = {};
	if (options instanceof Object) {
		for (var i in options) {
			_options[i] = options[i];
		}
	}
	var data = google.visualization.arrayToDataTable(data);
	var chart = new gChart(document.getElementById(element));
	chart.draw(data, _options);
}


function onStateChange() {
	$.ajax({
		url: '/getstoresbystate',
		data: {
			state: document.getElementById('state').value,
			type : $('.checkBox.checked').attr('chartValue')
		},
		success: function (data) {
			document.getElementById('chart1').innerHTML = '';
			if (data.length == 0) {
				document.getElementById('chart1').appendChild(noData('No data to display'));
				return;
			}
			var chartData = [['County Name', $('.checkBox.checked').next().text().trim() + '/1,000 pop (%)', 'Standard ' + $('.checkBox.checked').next().text().trim() + '/1,000 pop (%)']];

			for(var i = 0 ; i < data.length ; i++){
				chartData.push([data[i][0],data[i][2],data[i][3]]);
			}

			//chartData = chartData.concat(data);
			/*
			 chartData[chartData.length - 1][5] = 'Standard Fast Food Restaurants Per Thousand';
			 chartData[chartData.length - 1][6] = data[0][6];
			 chartData[chartData.length - 1][7] = 'Standard Full Service Restaurants Per Thousand';
			 chartData[chartData.length - 1][8] = data[0][8];
			 */

			drawChart(chartData, 'chart1', google.visualization.ComboChart, {
				legend: {
					position: 'bottom'
				},
				title: '', tooltip: {isHtml: true},
				seriesType: 'bars',
				series: {
					1: {visibleInLegend: false, type: 'line'}
				}, hAxis: {
					slantedText: true,
					slantedTextAngle: 45 // here you can even use 180
				},
				colors : ['#3366CC','#3366CC']
			});
		},
		error: function () {
			//alert('an error occurred while retreiving data from server');
			document.getElementById('chart1').innerHTML = '';
			document.getElementById('chart1').appendChild(noData());
		}
	});
}


function loadDefaultValues() {
	$.ajax({
		url: '/states',
		success: function (data) {
			if (data instanceof Array) {
				document.getElementById('state').innerHTML = '';
				for (var i = 0; i < data.length; i++) {
					var option = document.createElement('option');
					option.textContent = data[i];
					document.getElementById('state').appendChild(option);
					delete option;
				}
				document.getElementById('state').value = data[0];
				$('#state').trigger('change');
			} else {

			}
		},
		error: function () {
			alert('an error occurred while retreiving data from server');
		}
	});
}

function onCheckBoxClick(){
	$('.checkBoxParent .checkBox.checked').removeClass('checked');
	if($(this).find('.checkBox.checked').length == 0){
		$(this).find('.checkBox').addClass('checked');
		onStateChange();
	}
}

function onLoad() {
	var apiKey = 'AIzaSyDaOJ07DEmxBEunSo8HxvexTvrEQobS_UI';
	google.charts.load('upcoming', {mapsApiKey: apiKey, 'packages': ['corechart', 'geochart']});
	google.charts.setOnLoadCallback(loadDefaultValues);
	$('#state').on('change', onStateChange);
	$('.checkBoxParent').on('click',onCheckBoxClick);
}
window.addEventListener('load', onLoad);