var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  	res.render('index', { title: 'Express' });
});

router.get('/healthCheck',function(req,res){
	res.json({"hello":"world"})
})

router.post('/addOffence', function(req, res){
	var db = req.db;
	var offence = req.body;
	console.log(offence);
    var collection = db.get('offenceDb');
    var promise = collection.insert(offence);
    promise.on('error',function(err){ 
		res.status = 500;
    	res.send(err.message);
	});
	promise.on('success',function(doc){ 
		res.status = 201;
    	res.send("Ok");
    });
    
});

router.get('/allVeh',function(req,res){
	var db = req.db;
    var collection = db.get('vehicleDb');
    collection.find({}, function (err, vehs) {
    	res.json({"vehicles":vehs})
    })
})

router.get('/allOffences',function(req,res){
	var db = req.db;
    var collection = db.get('offenceDb');
    collection.col.aggregate([{
	$project: {
        item: 1,
        "DateTime": "$DateTime",
        "VRM":"$VRM",
        "MACAddress":"$MACAddress",
        "BrowserInfo":"$BrowserInfo",
        "GpsLocation":"$GpsLocation",
        "Photos": { $size: "$Photo" }
    }}], 
    function (err, offs) {
    	for(var i = 0; i < offs.length; i ++) {
    		offs[i].DateTimeString = new Date(offs[i].DateTime);
    	}
	res.render("Offences",{"offences":offs})
    });
});

router.get('/photo/:num/:VRM/:DateTime', function(req,res){
	var db = req.db;
	var VRM = req.params.VRM;
	var num = parseInt(req.params.num)||0;
	var DateTime = parseInt(String(req.params.DateTime).substring(0,String(req.params.DateTime).length-4));
	console.log(DateTime);

    var collection = db.get('offenceDb');
    collection.findOne({"VRM":VRM, "DateTime":DateTime}, {Photo:{$slice: [1, 1]}},function(err,rec) {
    	if(rec.Photo && rec.Photo.length-1 >= num) {
	    	res.contentType("image/jpeg");
	    	var img = new Buffer(rec.Photo[num], 'base64');
	        res.end(img, "Base64");
        } else {
        	res.send("Not Found");
        }
    });
});

router.get('/veh/:vrm',function(req,res){
	var db = req.db;
	var vrmParam = req.params.vrm.toUpperCase();
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
