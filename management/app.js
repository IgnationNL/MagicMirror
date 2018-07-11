const AWS = require('aws-sdk');

const AWS_ACCESS_KEY_ID = "AKIAJ2MBWRIJ4SFMJPRA";
const AWS_SECRET_ACCESS_KEY = "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"

const rekognition = new AWS.Rekognition({
	"accessKeyId": AWS_ACCESS_KEY_ID,
	"secretAccessKey": AWS_SECRET_ACCESS_KEY,
	"region": "us-west-2"
});

const AWSCollectionId = "photos";
const AWSBucketIgnation = "ignationbucket";

var path = require("path");
var bodyParser = require('body-parser');
var querystring = require('querystring');
const multer = require('multer'); // file storing middleware
var fs = require('fs');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');
const flash = require("connect-flash");
const ejs = require("ejs");


// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
	function(username, password, done) {
		db.users.findByUsername(username, function(err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, {message: "Incorrect username"});
			}
			if (user.password != password) {
				return done(null, false, {message: "Incorrect password"});
			}
			return done(null, user);
		});
	}));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
	cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
	db.users.findById(id, function (err, user) {
		if (err) { return cb(err); }
		cb(null, user);
	});
});




const multerConfig = {

	storage: multer.diskStorage({
    //Setup where the user's file will go
    destination: function(req, file, next) {
    	next(null, './public/photo-storage');
    },

    //Then give the file a unique name
    filename: function(req, file, next) {
    	const ext = file.mimetype.split('/')[1];
    	next(null, file.fieldname + '-' + Date.now() + '.' + ext);
    }
}),

  //A means of ensuring only images are uploaded.
  fileFilter: function(req, file, next) {
  	if (!file) {
  		next();
  	}
  	const image = file.mimetype.startsWith('image/');
  	if (image) {
  		console.log('photo uploaded locally');



  		next(null, true);
  	} else {
  		console.log("file not supported");

      //TODO:  A better message response to user on failure.
      return next();
  }
}
};

AWS.config.update({
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY
});
var s3 = new AWS.S3();

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(flash());

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));


app.use(require('cookie-parser')());
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


/******************************** ROUTES ********************************/

/*** GET / ***
 *
 * Home endpoint
 *
 */
 app.get('/',
 	function(req, res) {

 		if (req.user) {
 			res.render("dashboard.ejs",  {title: "Dashboard", user: req.user });
 		} else {
 			res.redirect('/login');
 		}
 	});

/*** GET /login ***
 *
 * User wants to login.
 *
 */
 app.get('/login',
 	function(req, res){
 		res.render("login.ejs",  {message: req.flash('error'), title: "Login"});
 	});


/*** POST /files ***
 *
 * User is loggin in
 *
 */
 app.post('/login', passport.authenticate('local', { failureRedirect: '/login', successRedirect: "/", failureFlash: true } ) );

/*** GET /logout ***
 *
 * User wants to logout
 *
 */
 app.get('/logout',
 	function(req, res){
 		req.logout();
 		res.redirect('/');
 	});

/*** GET /files ***
 *
 * Will return all files and whether or not the file have one or more faces (isIndexed:Boolean)
 *
 */
app.get("/files", function(req, res) { // Get files (PLURAL)
	// User needs to be authenticated
	if (!req.user) {
		res.sendStatus(401);
		return;
	}
	// eof: User needs to be authenticated

  awsGetFiles(function(err, resp) { // awsGetFiles
  	if (err) {
  		res.send(JSON.stringify({
  			"err": "Failed to retrieve files from AWS.",
  			"resp": resp
  		}));
  		return;
  	}

    // Step 2: Retrieve indexed faces and merge it with the files.
    awsGetFaceIndexes(function(err2, resp2) { // awsGetFaceIndexes
    	if (err) {
    		res.send(JSON.stringify({
    			"err": "Failed to get face indexes.",
    			"resp": resp
    		}));
    		return;
    	}

      for (var i in resp.Contents) { // For each file
      	var file = resp.Contents[i];
        file["isIndexed"] = false; // default

        for (var j in resp2.Faces) { // For each face
        	var face = resp2.Faces[j];
          if (file.Key === face.ExternalImageId) { // Found match
          	file["isIndexed"] = true;
          	break;
          }
      }
  }
  res.send(JSON.stringify({
  	"err": err,
  	"resp": resp
  }));
  return;
    }); // eof: awsGetFaceIndexes
  }); // eof: awsGetFiles
}); // eof: Get files (PLURAL)

/*** CREATE /file ***
 *
 * Will create a new file and face index
 *
 * @param file the file to be uploaded and indexed
 * @param name the name of the user.
 */
 app.post('/file', multer(multerConfig).single('faceImage'), function(req, res) {
	// User needs to be authenticated
	if (!req.user) {
		res.sendStatus(401);
		return;
	}
	// eof: User needs to be authenticated

	if (!req.file) {
		res.send(JSON.stringify({
			"err": "File not supported.",
			"resp": null
		}));
		return;
	}
	if (!req.body.name) {
		res.send(JSON.stringify({
			"err": "No name specified.",
			"resp": null
		}));
		return;
	}

	var path = __dirname + "/public/photo-storage/" + req.file.filename;
	var name = req.body.name;
	var now = new Date();
	var id = 'P' + now.toISOString().slice(2, 19).replace(/-|T|:/g, "");
  var nameEncoded = Buffer.from(name).toString('base64').replace(/=/, ""); // Replace all equal signs. We don't need them and they are not allowed in the ExternalImageId.
  nameEncoded = nameEncoded.replace("=", "");
  var key = id + nameEncoded;

  console.log("THE KEY IS: " + key);

  awsUploadFile(key, path, function(err, resp) { // awsUploadFile
  	if (err) {
  		console.log("error amazon upload: ");
  		console.log(err);
  		res.send(JSON.stringify({
  			"err": "Failed to upload file to Amazon.",
  			"resp": null
  		}));
  		return;
  	}

  	console.log("amazon file uploaded ");

    deleteFile(path); // Remove the locally saved file.

    // Proceed with the next step: indexing the photo
    awsCreateFaceIndex(key, function(err2, resp2) { // awsCreateFaceIndex
    	var output = {
    		"err": null,
    		"resp": null
    	};

      if (err2) { // There was an error indexing the face.
      	output.err = "Error indexing face.";
      	console.log(err2);

        // Since we can't index the file, delete it immediately
        awsDeleteFiles([key], function(err3, resp3) {
        	res.send(JSON.stringify(output));
        	return;
        });
        return;
    }

    if (resp2.FaceRecords.length === 0) {
    	output.err = "No faces found in image, please upload a picture in which the face is properly visible.";

        // Since we can't index the file, delete it immediately
        awsDeleteFiles([key], function(err4, resp4) {
        	res.send(JSON.stringify(output));
        	return;
        });
        return;
    } else {
    	output.resp = "New face has been added successfully.";
    }

    res.send(JSON.stringify(output));
    return;
    }); // eof: awsCreateFaceIndex
  }); // eof: awsUploadFile
}); // eof: Create file

/*** PREVIEW /file ***
 *
 * Will retrieve the file object and return it to the user for viewing
 *
 * @param key ID of the file to be retrieved
 */
app.post("/file/preview", function(req, res) { // Get file preview
	// User needs to be authenticated
	if (!req.user) {
		res.sendStatus(401);
		return;
	}
	// eof: User needs to be authenticated

	if (!req.body.key) {
		res.send(JSON.stringify({
			"err": "No key specified",
			"resp": null
		}));

		return;
	}
	awsGetFileUrl(req.body.key, function(err, resp) {
		if (err) {
			err = "Failed to retrieve file from AWS."
		}
		res.send(JSON.stringify({
			"err": err,
			"resp": resp
		}));
		return;
	});
});


/*** DELETE /files ***
 *
 * Will delete the files using the provided keys along with their indexes.
 *
 * @param keys array with key id's of the files.
 */
app.delete("/files", function(req, res) { // Delete files
	// User needs to be authenticated
	if (!req.user) {
		res.sendStatus(401);
		return;
	}
	// eof: User needs to be authenticated

	if (!req.body.keys) {
		res.send(JSON.stringify({
			"err": "No key array specified",
			"resp": null
		}));

		return;
	}

  // First delete the indexes. These indexes MUST be deleted before deleting the files. Otherwise it will result in having indexes, but no corresponding files.

  // Retrieve indexes
  awsGetFaceIndexes(function(err, resp) { // awsGetFaceIndexes

    var faceIds = []; // holds all the faceIds that need to be removed.

    for (var j in resp.Faces) { // For each face
    	var face = resp.Faces[j];

      if (req.body.keys.includes(face.ExternalImageId)) { // ExternalImageId of the face matches the key
      	faceIds.push(face.FaceId);
      }
    } // eof: for each face

    // Make the call for deleting faces.
    awsDeleteFaceIndexes(faceIds, function(err2, resp2) { // awsDeleteFaceIndexes
    	if (err2) {
    		console.log(err2);
    		console.log(resp2);
    		res.send(JSON.stringify({
    			"err": "Could not delete face indexes.",
    			"resp": resp2
    		}));
    		return;
    	}

      // Indexes removed: now we can delete the file.
      awsDeleteFiles(req.body.keys, function(err3, resp3) { // awsDeleteFiles
      	console.log("delete file");
      	if (err3) {
      		err3 = "Indexes are deleted, but couldn't delete files from Amazon. Please try again.";
      	}
      	res.send(JSON.stringify({
      		"err": err3,
      		"resp": "File(s) and indexe(s) have been successfully deleted."
      	}));
      }); // eof: awsDeleteFiles
    }); // eof: awsDeleteFaceIndexes
  }); // eof: awsGetFaceIndexes
}); // eof: Delete files





/******************************** eof: ROUTES ********************************/

/******************************** API CALLS ********************************/

/*** awsGetFiles() ***
 *
 *   Retrieves the objects in the bucket
 *
 *   @param callback callback in the form of (err, resp) that will be called upon completion
 */
 function awsGetFiles(callback) {
 	s3.listObjectsV2({
 		Bucket: AWSBucketIgnation,
 		Delimiter: '/'
 	}, (err, data) => {
 		callback(err, data);
 	});
 }

/*** awsGetFileURL() ***
 *
 *   Retrieves an url which is valid for 30 seconds to the file
 *
 *   @param key key of the file to be retrieved.
 *   @param callback callback in the form of (err, resp) that will be called upon completion
 */
 function awsGetFileUrl(key, callback) {

	 var params = {
  		Bucket: AWSBucketIgnation,
  		Key: key,
			Expires: 30
  	};
		var url = s3.getSignedUrl('getObject', params, function(err, url) {
			callback(err, url);
		});
 }

/*** awsDeleteFiles() ***
 *
 *   Deletes the objects
 *
 *   @param keys array with keys of the files to be deleted.
 *   @param callback callback in the form of (err, resp) that will be called upon completion
 */
 function awsDeleteFiles(keys, callback) {
 	var objects = [];
 	for (var i in keys) {
 		objects.push({
 			Key: keys[i]
 		});
 	}

 	s3.deleteObjects({
 		Bucket: AWSBucketIgnation,
 		Delete: {
 			Objects: objects
 		}
 	}, function(err, data) {
 		callback(err, data);
 	});
 }







/*** awsUploadFile() ***
 *
 *   Uploads a file to AWS
 *
 *   @param key unique identifier for the file
 *   @param path local path of the file to be uploaded
 *   @param callback callback in the form of (err, resp) that will be called upon completion
 */
 function awsUploadFile(key, path, callback) {
 	var fileStream = fs.createReadStream(path);
 	var now = new Date();

 	var params = {
 		Bucket: AWSBucketIgnation,
 		Key: key,
 		Body: fileStream
 	};

 	s3.upload(params, function(err, data) {
 		callback(err, data);
 		return;
 	});
 }



/*** awsCreateFaceIndex ***
 *
 *   Indexes the file containing a face
 *
 *   @param key key of the file to be indexed
 *   @param callback callback with error and response object
 *   @return nothing, use callback.
 */
 function awsCreateFaceIndex(key, callback) {
 	const params = {
 		CollectionId: AWSCollectionId,
 		ExternalImageId: key,
 		DetectionAttributes: [],
 		Image: {
 			S3Object: {
 				Bucket: AWSBucketIgnation,
 				Name: key
 			}
 		}
 	};

 	rekognition.indexFaces(params, function(err, resp) {
 		callback(err, resp);
 		return;
 	});
 }

/*** awsDeleteFaceIndexes ***
 *
 *   Returns a list with faces.
 *
 *   @param faceIds array with ids of the faces to be deleted
 *   @param callback callback with error and response object
 *   @return nothing, use callback.
 */
 function awsDeleteFaceIndexes(faceIds, callback) {
 	rekognition.deleteFaces({
 		"CollectionId": AWSCollectionId,
 		"FaceIds": faceIds
 	}, function(err, resp) {
 		callback(err, resp);
 	});
 }

/*** awsGetFaceIndexes ***
 *
 *   Returns a list with indexed faces.
 *
 *   @param callback callback with error and response object
 *   @return nothing, use callback.
 */
 function awsGetFaceIndexes(callback) {
 	rekognition.listFaces({
 		"CollectionId": AWSCollectionId
 	}, function(err, resp) {
 		callback(err, resp);
 	});
 }




 /******************************** eof: API CALLS ********************************/









 function deleteFile(path) {
 	fs.unlink(path, function(error) {
 		if (error) {
 			console.log("Could not delete file locally. Error: " + error);
 		} else {
 			console.log("Succesfully deleted file locally.")
 		}
 	});
 }
