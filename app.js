var express = require('express');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

var app = express()
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');



var routes = require('./routes/index');
var users = require('./routes/users');


// view engine setup
app.set('views', path.join(__dirname, 'views'));

var engine = require('ejs-locals');
app.engine('ejs', engine);
app.set('view engine', 'ejs');

//ENABLE CORS
/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//  console.log(res.header());
  next();
});*/

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);


/*app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://optimmerce-01.myshopify.com/'); // TODO: Change to brosa adress

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});*/




/*app.use(session({
    secret: "cookie_secret",
    name: "cookie_name",
    store: "sessionStore", // connect-mongo session store
    proxy: true,
    resave: true,
    saveUninitialized: true
}));*/

/*app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))*/
 
/*app.use(function (req, res, next) {
  var views = req.session
  console.log("hereeeeasdasssssssssssssssssssssssssssss");
  console.log(views);
  next()
})
*/




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log(err);
    res.status(err.status || 500);
    res.render('error.ejs', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});





// insert on db

/*var insertDocuments = function(db, callback) {
  // Get the documents collection 
  var collection = db.collection('documents');
  // Insert some documents 
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    console.log("Inserted 3 documents into the document collection");
    callback(result);
  });
}


// Connection URL 
// Use connect method to connect to the Server 
var url = 'mongodb://admin:root@ds145158.mlab.com:45158/shoopthelook';

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");
  insertDocuments(db, function() {
    db.close();
  });
});*/




module.exports = app;

