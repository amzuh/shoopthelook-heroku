var express = require('express');
var router = express.Router();
var shopifyAPI = require('shopify-node-api');
var MongoClient = require('mongodb').MongoClient;
var db;
var app = express();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var formidable = require("formidable");
var tmp = require('tmp');
var path = require('path'),
    fs = require('fs');
var util = require('util');


var sess;
var secret_token; // final token to init new shopify api instances
var unique = "aaa"+Math.floor((Math.random() * 999999) + 1000); // temp token string


// Initialize connection once
MongoClient.connect("mongodb://admin:root@ds145158.mlab.com:45158/shoopthelook", function(err, database) {
  if(err) throw err;

  db = database;
  // Start the application after the database connection is ready
  app.listen(8080);
  console.log("Listening on port 3000");
});


// Shopify API CONFIG TEMP
var config = {
	   shop: 'brosa-dev.myshopify.com', // MYSHOP.myshopify.com 
	   shopify_api_key: '0c5d97a525d274cde24587a856d1e132', // Your API key 
	   shopify_shared_secret: 'c6f13aa81d469be88c5b20dc3861b8e0', // Your Shared Secret 
	   shopify_scope: 'write_products, write_themes',
	   redirect_uri: 'https://shoopthelook-heroku.herokuapp.com/auth/shopify',
	   nonce: unique // you must provide a randomly selected value unique for each authorization request 
  };





/* GET home page. */
router.get('/', function(req, res) {
  res.render('index.ejs', { title: '', message: '' });
});


/* POST FOR AUTH */
router.post('/goauth', function(req, res) {

	config.shop = req.body.store;
	// init config and redirect to url
	var Shopify = new shopifyAPI(config);
  var auth_url = Shopify.buildAuthURL();
  res.redirect(auth_url);

});



// Create cookie to use session
const genuuid = require('uuid/v4');

router.use(cookieParser())
router.use(session({
  genid: function(req) {
    return genuuid() // use UUIDs for session IDs
  }, secret: 'TopSecretCode', name: 'shoopthelook', resave: true, saveUninitialized: true, cookie: { maxAge: 60000000000 }}));
 


// AFTER AUTH, lets check if it is legit

router.get('/auth/shopify', function(req, res){

  var Shopify = new shopifyAPI(config); // You need to pass in your config here 
  var query_params = req.query;

	
	sess = req.session;


  Shopify.exchange_temporary_token(query_params, function(err, data){
  	// if error, render error else init final connection to shopify
  	if(err){
  		res.render('index.ejs', { title: 'asdasdsa', message: 'erro' });
  	}else {

	   	var Shopify = new shopifyAPI({
		   shop: query_params.shop, // MYSHOP.myshopify.com 
		   shopify_api_key: '0c5d97a525d274cde24587a856d1e132', // Your API key 
		   shopify_shared_secret: 'c6f13aa81d469be88c5b20dc3861b8e0', // Your Shared Secret 
		   access_token: data['access_token'], //permanent token 
			});

			secret_token = data['access_token'];


			// build or shop obj to save on DB
	  	var shop_obj = {
	  		url: query_params.shop,
	  		access_token: data['access_token']
	  	};

	  	
	  	// CHECK SHOP IN DB
		  db.collection('shops').findOne({ url: query_params.shop }, function(err, doc) {		  	
			  if(doc == null){
			  	// insert new shop an create session
			  	db.collection("shops").insert(shop_obj, function(err, result) {
				   /// db.close();
				    sess.the_id = result.ops[0]._id;

				    res.writeHead(301, {
						  Location: "http" + (req.socket.encrypted ? "s" : "") + "://" + 
						    req.headers.host + "/dashboard"}
						);

						res.end();
					});
					
			  } else {
			  	//retrieve store id and create session  
			  	db.collection('shops').findOne({ _id: session }, function(err, doc) {
			  		sess.the_id  = doc._id;
			  		res.writeHead(301, {
						  Location: "http" + (req.socket.encrypted ? "s" : "") + "://" + 
						    req.headers.host + "/dashboard"}
						);
						res.end();
			  	})			  	
			  }
			  
			});			  	
  	}
   
  });
});


router.get('/dashboard', function(req, res){
	if(!req.session.the_id)
		res.render('error.ejs', { title: '', message: '' });
	else
		res.render('dashboard.ejs', { title: '', message: '' });
});




router.get('/dashboard/build', function(req, res){
	res.render('build_image.ejs', { title: 'sucess', message: 'sucess123'});
});



// POST IMAGE
router.post('/dashboard/build', function(req, res){
	

    
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
    	//console.log("HERE FIELDS --------------------------------------------------------------------");
    	//console.log(fields.name);
    	//console.log(util.inspect({fields: fields, files: files}));

			// convert image to base64 encoded string
			var base64str = base64_encode(files.image.path);
			// convert base64 string back to image 
			var put_data = {
			  "asset": {
			    "key": "assets\/"+files.image.name,
			    "attachment": base64str
			  }
			}

			var Shopify = new shopifyAPI({
		   shop: 'brosa-dev.myshopify.com', // MYSHOP.myshopify.com 
		   shopify_api_key: '0c5d97a525d274cde24587a856d1e132', // Your API key 
		   shopify_shared_secret: 'c6f13aa81d469be88c5b20dc3861b8e0', // Your Shared Secret 
		   access_token: secret_token, //permanent token 
			});

			Shopify.put('/admin/themes/127557761/assets.json', put_data, function(err, data, headers){
				if(err != "undefined") {
				  var the_url = {
				  	"url": data.asset.public_url,
				  	"shop": "brosa-dev.myshopify.com",
				  	"image_id": fields.name
				  }
			  	db.collection("images").insert(the_url, function(err, result) {
			  		if(result.result.ok == 1){
			  			res.writeHead(301, {
							  Location: "http" + (req.socket.encrypted ? "s" : "") + "://" + 
							    req.headers.host + "/dashboard/build/step-2"}
							);
							res.end();
			  		} else {
			  			console.log("Something went wrong inserting image in db");
			  		}					  
					  	///db.close();					 
					});
				} else {
					console.log("couldn't upload image to shopify");
				}
	      

			}); 

    });

});



router.get('/dashboard/build/step-2', function(req, res){
	// get last inserted image
	 db.collection("images").find({}).toArray(function(err, docs) {
    var last_img = docs[docs.length-1];
		res.render('build_image_2.ejs', { image: last_img.url, message: 'sucess'});
		res.end();
    //db.close();
  });
 	
});



// POST THE HOTSPOTS 
router.get('/dashboard/build/step-3', function(req, res){
	//console.log(req);
	console.log("---------------------------------------");
	console.log("POSTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT");

	var Shopify = new shopifyAPI({
	   shop: 'brosa-dev.myshopify.com', // MYSHOP.myshopify.com 
	   shopify_api_key: '0c5d97a525d274cde24587a856d1e132', // Your API key 
	   shopify_shared_secret: 'c6f13aa81d469be88c5b20dc3861b8e0', // Your Shared Secret 
	   access_token: secret_token, //permanent token 
		});

	var hotsp = req.query.HotspotPlugin_data;
	var data_obj = JSON.parse(hotsp);
	var id_arr = [];
	for(var i=0; i < data_obj.length; i++){
		id_arr.push(data_obj[i].product_id);
	}
	id_arr = id_arr.join(",");
		// GET PRODUCTS and pass values to our object
		Shopify.get('/admin/products.json',{ids: id_arr, fields: 'id,title,images,variants'}, function(err, data, headers){
			for(var k=0; k < data.products.length; k++){
				data_obj[k].title = data.products[k].title;
				data_obj[k].image = data.products[k].images[0].src;
				data_obj[k].price = data.products[k].variants[0].price;
			}
			/*console.log("IM HERE -------------------------------------------------------------------------");
				console.log(data.products);
				console.log("DATA OBJ ---------------------------------------------");
				console.log(data_obj);		*/

				// Insert in our db the hotspot with all the pproduct information
			 db.collection("images").find({}).toArray(function(err, docs) {
		    var last_img = docs[docs.length-1];
		    var img_id = last_img._id;
		    console.log("THIS IS IT -----------------------------------------------------------------");
		   //console.log(data_obj);
		    console.log("THIS IS IT ------------------------------------END -----------------------------");

				// update image with hotspots and product info
				db.collection("images").findAndModify(
				  {_id: img_id},
				  {},
				  {  $set: {"hotspots": data_obj}},      
				  {new:true, upsert:true}, function (err, doc) {
				    if(err) {
				    	console.log("ERROR -------------------------------------------ERROR ------------------------- ERROR");
				 			//res.render('response.ejs', { title: '', message: 'Something went wrong. Please try again' })
				  	}else{
				  		console.log("SUCCESS -------------------------------------------SUCCESS ------------------------- SUCCESS");
			    		//console.log(doc);
			  			res.render('response.ejs', { title: '', other: 'Success, your image has been saved' })
			    		res.end();
			    	}
				  }
				);

		    //db.close();
		  })

		})
	


	 //res.end();

});



router.get('/dashboard/get_image/:id', function(req,res){
	console.log("here");
	console.log(req.params.id);


	db.collection("images").find({"image_id":req.params.id}).toArray(function(err, results){
	    console.log(results);
	    res.setHeader("Access-Control-Allow-Origin", "*");
	    res.json(results)
	    //res.send(JSON.stringify(results));
	 		//res.send(results);
	 		res.end();
	});

})


module.exports = router;




// HELPER FUNCTIONS



// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
function base64_decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}