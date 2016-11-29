

function noData(msg) {
	var nodata = document.createElement('div');
	nodata.className = 'alert alert-warning';
	nodata.innerHTML = /*'<span class="pe-7s-junk" style="font-size: 20px;"></span>' +*/ (msg || ' An error occurred while contacting server...');
	return nodata;
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

function getSnapTooltip(data){
	var str = '<div style="margin-top: -12px;width:200px;">\
	<strong>SNAPS count : </strong> <span> ' + data[1] + ' </span><br>\
	<strong>Poverty Rate : </strong> <span> ' + data[2] + ' </span>\
			</div>';
	return str;
}

function onStateChange() {
	$.ajax({
		url: '/getsnapsbystate',
		data: {
			state: document.getElementById('state').value
		},
		success: function (data) {
			document.getElementById('chart1').innerHTML = '';
			if (data.length == 0) {
				document.getElementById('chart1').appendChild(noData('No data to display'));
				return;
			}
			var chartData = [['Year', 'Snaps in county', {
				role: 'tooltip',
				p: {html: true}
			}]];

			for(var i = 0, each; each = data[i] ; i++){
				chartData.push([each[0],each[1], getSnapTooltip(each)]);
			}

			drawChart(chartData, 'chart1', google.visualization.GeoChart, {
				region: 'US-' + $('#state option:selected').attr('simplevalue'),
				displayMode: 'markers',
				/*resolution: 'provinces',// resolution: 'metros'
				//colors: ['#ff4b1f', '#00aa00'],
				tooltip: {isHtml: true},
				title : '',*/
				resolution: 'provinces',
				//magnifyingGlass: {enable: true, zoomFactor: 1.5},
				magnifyingGlass: {enable: true, zoomFactor: 3.5},
				colors: ['#ff4b1f', '#00aa00'], tooltip: {isHtml: true},
				title: '',
				datalessRegionColor: '#fff',
				backgroundColor: '#fff'
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
		url: '/stateswithshortcodes',
		success: function (data) {
			if (data instanceof Array) {
				document.getElementById('state').innerHTML = '';
				for (var i = 0; i < data.length; i++) {
					var option = document.createElement('option');
					option.textContent = data[i].name;
					option.setAttribute('simplevalue', data[i].short );
					document.getElementById('state').appendChild(option);
					delete option;
				}
				document.getElementById('state').value = data[0].name;
				$('#state').trigger('change');
			} else {

			}
		},
		error: function () {
			alert('an error occurred while retreiving data from server');
		}
	});
}
function onLoad() {
	var apiKey = 'AIzaSyDaOJ07DEmxBEunSo8HxvexTvrEQobS_UI';
	var apiKey = 'AIzaSyDaOJ07DEmxBEunSo8HxvexTvrEQobS_UI';
	google.charts.load('upcoming', {mapsApiKey: apiKey, 'packages': ['corechart', 'geochart']});
	google.charts.setOnLoadCallback(loadDefaultValues);
	$('#state').on('change', onStateChange);
}
window.addEventListener('load', onLoad);