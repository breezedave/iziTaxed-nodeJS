var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  	res.render('index', { title: 'Express' });
});

router.get('/healthCheck',function(req,res){
	res.json({"hello":"world"})
})

router.get('/allVeh',function(req,res){
	var db = req.db;
    var collection = db.get('vehicleDb');
    collection.find({}, function (err, vehs) {
    	res.json({"vehicles":vehs})
    })
})

router.get('/veh/:vrm',function(req,res){
	var db = req.db;
	var vrmParam = req.params.vrm;
    var collection = db.get('vehicleDb');
    collection.findOne({"vrm" : vrmParam}, function (err, veh) {
    	var result = {};
    	if(veh == null) {
    		result.notFound = true
    		res.json(result);
    		return;
    	}
    	result.VRM = veh.VRM;
    	result.make = veh.make;
    	result.model = veh.model;
    	result.colour = veh.colour;
    	switch (licenceState(veh.licence)) {
    		case "Taxed":
    			result.isTaxed = true;
    			break;
			case "Sorned":
				result.isSorned = true;
				break;
			default:
				result.unTaxed = true;
				break;
    	}

    	res.json(result);
    })
});

router.get('/addVeh',function(req,res){
	try {
		var db = req.db;
	    var collection = db.get('vehicleDb');
	    var veh = randomVeh(randomVRM(),req);
	    collection.insert(veh)
	    res.status = 201;
	    res.send("Ok");
	} catch(e) {
		res.status = 500;
    	res.send(e);
    }
});


function licenceState(lic) {
	var d = new Date();
	d.setHours(0,0,0,0);
	if(d<=lic.expiry) {
		if(lic.type == "Tax") {
			return "Taxed";
		}
		if(lic.type == "Sorn") {
			return "Sorned";
		}
	}
	return "Not Taxed";
}

function randomVRM() {
	var rnd = parseInt(Math.random() * 144);
	var firstReg = new Date();
	firstReg.setHours(0,0,0,0);
	firstReg.setDate(0);
	firstReg.setMonth(firstReg.getMonth()-rnd);
	var regYr = firstReg.getFullYear() - 2000;
	if(firstReg.getMonth() > 8) {
		regYr += 50;
	}
	console.log(regYr);
	var midVRM = ("00" + regYr).slice(("00" + regYr).length-2);
	var VRM = randomLetter() + randomLetter() + midVRM + randomLetter() + randomLetter() + randomLetter();
	return VRM;
}


function randomVeh(vrm,req) {
	var rnd1 = parseInt(Math.random() * req.makes.length);
	var rnd2 = parseInt(Math.random() * req.colours.length);
	var rnd3 = parseInt(Math.random() * 24) -13;
	var makeModel = req.makes[rnd1];
	var vehicle = {};
	vehicle.vrm = vrm;
	vehicle.make = makeModel.make;
	vehicle.model = makeModel.model;
	vehicle.colour = req.colours[rnd2];
	vehicle.licence = {};
	if(Math.random() < 0.8) {
		vehicle.licence.type = "Tax"	
	} else {
		vehicle.licence.type = "Sorn"	
	}
	var expiry = new Date();
	expiry.setMonth(expiry.getMonth()+rnd3);
	expiry.setDate(0);
	vehicle.licence.expiry = expiry;
	return vehicle;
} 

function randomLetter() {
	var rnd = parseInt(Math.random() * 26);
	var ltr = String.fromCharCode(rnd+65);
	if (ltr=="I"||ltr=="Q"||ltr=="Z") {
		return randomLetter();
	} else {
		return ltr;
	}
}

module.exports = router;
