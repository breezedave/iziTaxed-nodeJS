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
    collection.findOne({"VRM" : vrmParam}, function (err, veh) {
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
})


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

module.exports = router;
