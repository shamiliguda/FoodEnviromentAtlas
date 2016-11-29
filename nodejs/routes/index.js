var express = require('express');
var router = express.Router();
var path = require('path');
var mysql = require('mysql');
var db = mysql.createPool({
	connectionLimit: 10,
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'food_environment_atlas'
});

function executeQuery(query, params, cb) {
	if(params instanceof Function){
		cb = params;
		params = [];
	}
	db.getConnection(function (err, connection) {
		// Use the connection
		connection.query(query,params, function (err, rows) {
			// And done with the connection.
			connection.release();
			cb.call(connection, err, rows);
			// Don't use the connection here, it has been returned to the pool.
		});
	});
}


/* GET home page. */
/*router.get('/', function (req, res, next) {
	//res.render('index', { title: 'Express' });
	res.sendFile('public/index.html', {root: path.resolve(__dirname, '../')});
});*/
router.get('/restaurants', function (req, res) {
	executeQuery('SELECT CONCAT_WS (\' \', state,county) as county, ffr07 FROM `restaurants`',function(err, rows){
		if(err){
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if(rows.length > 0){
			var rowsArray = [];
			for(var i = 0, len = rows.length;i < len ; i++){
				var arr = [];
				for(var key in rows[i]){
					arr.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
				}
				rowsArray.push(arr);
				delete arr;
			}
			res.send(rowsArray);
		}else{
			res.send(rows);
		}
	})
});

router.get('/states', function(req, res){
	executeQuery('SELECT state_name FROM states', function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if (rows.length > 0) {
			var rowsArray = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				for (var key in rows[i]) {
					rowsArray.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
				}
			}
			res.send(rowsArray);
		} else {
			res.send(rows);
		}
	})
});
router.get('/stateswithshortcodes', function(req, res){
	executeQuery('SELECT state_name as name,state_code as short FROM states', function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		res.send(rows);
	})
});
router.get('/counties', function(req, res){
	var state = req.query.state;
	console.log('Provided state is : ', state);
	executeQuery('select county_name from countys where state_id in (select state_id from states where state_name in (?))', state,function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if (rows.length > 0) {
			var rowsArray = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				for (var key in rows[i]) {
					rowsArray.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
				}
			}
			res.send(rowsArray);
		} else {
			res.send(rows);
		}
	})
});
router.get('/getpopulationbycounty', function(req, res){
	var county = req.query.county;
	console.log('Provided county is : ', county);
	executeQuery('\
	select\
	year, sum(population) as population\
	from\
	population_county\
	JOIN\
	countys\
	using(county_id)\
	where\
	county_name in (?)\
	group\
	by\
	year\
	order\
	by\
	year', county,function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if (rows.length > 0) {
			var rowsArray = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				var arr = [];
				for (var key in rows[i]) {
					if(key == 'year'){
						arr.push(rows[i][key].toString());
					}else{
						arr.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
					}
				}
				rowsArray.push(arr);
				delete arr;
			}
			res.send(rowsArray);
		} else {
			res.send(rows);
		}
	})
});
router.get('/gethealthbycounty', function(req, res){
	var county = req.query.county;
	console.log('Provided county is : ', county);
	executeQuery('SELECT \
			year,\
			max(PCT_DIABETES_ADULTS) adult_diabetes,\
			max(PCT_OBESE_ADULTS) adult_obesity,\
			max(PCT_OBESE_CHILD) child_obesity\
	FROM\
	health\
	JOIN\
	countys\
	USING(county_id)\
	where\
	county_name in (?)\
	Group\
	by\
	county_name, year\
	', county,function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if (rows.length > 0) {
			var rowsArray = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				var arr = [];
				for (var key in rows[i]) {
					if(key == 'year'){
						arr.push(rows[i][key].toString());
					}else{
						arr.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
					}
				}
				rowsArray.push(arr);
				delete arr;
			}
			res.send(rowsArray);
		} else {
			res.send(rows);
		}
	})
});


router.get('/getsnapsbystate', function(req, res){
	var state = req.query.state;
	console.log('Provided state is : ', state);
	executeQuery('\
	SELECT\
	CONCAT_WS (\', \',  county_name, c.state_name) as county, SNAPS, d.POVRATE, e.PCT_SNAP\
	FROM\
	stores\
	a\
	LEFT\
	JOIN\
	countys\
	b\
	ON\
	a.county_id = b.COUNTY_ID\
	LEFT\
	JOIN\
	states\
	c\
	ON\
	b.state_id = c.state_id\
	left\
	join\
	socioeconomic\
	d\
	on\
	d.COUNTY_ID = b.county_id\
	left\
	join\
	assistance\
	e\
	on\
	e.county_id = a.county_id\
	where\
	a.year = d.YEAR\
	and\
	d.year = e.year\
	and\
	c.state_name = ?\
			ORDER BY\
	snaps\
	DESC', state,function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if (rows.length > 0) {
			var rowsArray = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				var arr = [];
				for (var key in rows[i]) {
					if(key == 'year'){
						arr.push(rows[i][key].toString());
					}else{
						arr.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
					}
				}
				rowsArray.push(arr);
				delete arr;
			}
			res.send(rowsArray);
		} else {
			res.send(rows);
		}
	})
});

router.get('/getcomparisonfordiffhealthassistances', function (req, res) {
	var county = req.query.county;
	console.log('Provided county is : ', county);
	var state = req.query.state;
	console.log('Provided county is : ', state);
	executeQuery('select `COUNTY_name`, \
	    ROUND((b.pct_snap * b.REDEMP_SNAPS - a.pct_snap * a.REDEMP_SNAPS)/ b.REDEMP_SNAPS,2) AS PCH_SNAP_09_14, \
    ROUND((b.PCT_NSLP* b.REDEMP_SNAPS - a.PCT_NSLP* a.REDEMP_SNAPS)/ a.REDEMP_SNAPS,2) AS PCH_NSLP_09_14, \
    ROUND((b.PCT_SBP * b.REDEMP_SNAPS- a.PCT_SBP* a.REDEMP_SNAPS)/ a.REDEMP_SNAPS,2) AS PCH_SBP_09_14, \
    ROUND((b.PCT_WIC* b.REDEMP_SNAPS - a.PCT_WIC* a.REDEMP_SNAPS)/ a.REDEMP_SNAPS,2) AS PCH_WIC_09_14, \
    ROUND((b.PCT_CACFP* b.REDEMP_SNAPS - a.PCT_CACFP* a.REDEMP_SNAPS)/ a.REDEMP_SNAPS,2) AS PCH_CACFP_09_14 \
	from assistance a join assistance b using (county_id) join countys c using (county_id) inner join states d on c.state_id = d.state_id where a.year = 2009 and b.year = 2014 and county_name = (?) and state_name in (? )\
		', [county,state], function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if (rows.length > 0) {
			var rowsArray = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				var arr = [];
				for (var key in rows[i]) {
					if (key == 'year') {
						arr.push(rows[i][key].toString());
					} else {
						arr.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
					}
				}
				rowsArray.push(arr);
				delete arr;
			}
			res.send(rowsArray);
		} else {
			res.send(rows);
		}
	})
});


router.get('/getrestaurantsbystate', function (req, res) {
	var state = req.query.state;
	console.log('Provided state is : ', state);
	executeQuery('select county_name, FFR, FSR, FFRPTH, FSRPTH, std_FFRPTH, std_FSRPTH  from restaurants r\
	JOIN\
	countys\
	USING(county_id)\
	JOIN\
	states\
	using(state_id)\
	JOIN\
	(select\
	state_id, sum(FFR) / sum(population) * 1000 as std_FFRPTH,\
	sum(FSR) / sum(population) * 1000 as std_FSRPTH\
	from\
	restaurants\
	JOIN\
	population_county\
	using(county_id, year)\
	JOIN\
	countys\
	using(county_id)\
	join\
	states\
	using(state_id)\
	where\
	year = 2014\
	group\
	by\
	state_id\
	)\
	std\
	using(state_id)\
	where\
	year = 2014\
	and\
	FFRPTH < std_FFRPTH\
	and\
	FSRPTH < std_FSRPTH\
	and FFR > 0\
	and FSR > 0\
	and state_name = ?\
	order\
	by\
	FFR, FSR\
	limit\
	10\
	', state, function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if (rows.length > 0) {
			var rowsArray = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				var arr = [];
				for (var key in rows[i]) {
					if (key == 'year') {
						arr.push(rows[i][key].toString());
					} else {
						arr.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
					}
				}
				rowsArray.push(arr);
				delete arr;
			}
			res.send(rowsArray);
		} else {
			res.send(rows);
		}
	})
});
router.get('/getstoresbystate', function (req, res) {
	var state = req.query.state;
	var type = req.query.type;
	console.log('Provided state is : ', state);
	console.log('Provided type is : ', type);
	if(type == null){
		type = 'GROC';
	}
	console.log('concat(' + type + 'PTH * 100,\'%\')');
	executeQuery('SELECT\
	county_name,' + type + ' as Stores, concat(' + type + 'PTH * 100,\'%\'),\
			STD_' + type + 'PTH * 100\
	FROM\
	stores\
	r\
	JOIN\
	countys\
	USING(county_id)\
	JOIN\
	states\
	USING(state_id)\
	JOIN\
	(SELECT\
	state_id,\
	round(SUM(' + type + ') / SUM(population), 11) * 1000\
	AS\
	STD_' + type + 'PTH,\
	Sum(Population) as STATE_POPULATION\
	FROM\
	stores\
	JOIN\
	population_county\
	USING(county_id, year)\
	JOIN\
	countys\
	USING(county_id)\
	JOIN\
	states\
	USING(state_id)\
	WHERE\
	year = 2014\
	GROUP\
	BY\
	state_id\
	)\
	std\
	USING(state_id)\
	WHERE\
	year = 2014\
	AND\
	' + type + 'PTH < STD_' + type + 'PTH\
	AND\
	' + type + ' > 0\
	AND\
	state_name = (?)\
	ORDER\
	BY\
	' + type + '\
	LIMIT\
	10\
	', state, function (err, rows) {
		if (err) {
			console.log(err);
			res.send([]);
			return;
		}
		//res.send(rows);
		if (rows.length > 0) {
			var rowsArray = [];
			for (var i = 0, len = rows.length; i < len; i++) {
				var arr = [];
				for (var key in rows[i]) {
					if (key == 'year') {
						arr.push(rows[i][key].toString());
					} else {
						arr.push(isNaN(parseFloat(rows[i][key])) ? rows[i][key] : parseFloat(rows[i][key]));
					}
				}
				rowsArray.push(arr);
				delete arr;
			}
			res.send(rowsArray);
		} else {
			res.send(rows);
		}
	})
});
module.exports = router;

/*
 select * from states;

 select * from countys where state_id in (select state_id from states where state_name in ('Alabama'));


 select year, sum(population) from population_county JOIN countys using (county_id)
 where county_name in ('Bethel', 'Anchorage')
 group by year
 order by year;

 select county_name, year, sum(population) from population_county JOIN countys using (county_id)
 group by year, county_name
 order by county_name, year;
 */