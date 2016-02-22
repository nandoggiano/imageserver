var express = require('express'),
	fs = require('fs-extra'),
	gm = require('gm'),
	util = require('util'),
	cors = require('cors'),
	formidable = require('formidable');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connessi al db');
});
var imgSchema = mongoose.Schema({
	oldname: {type:String,default:'',trim:true},
	newname: {type:String,default:'',trim:true},
	date: { type: Date, default: Date.now },
	ip: {type:String,default:''}
});
var Immagine = mongoose.model('Immagine',imgSchema);

app = express();
app.use(express.static(__dirname + '/public'));
app.use(cors());
app.set('views', './views');
app.set('view engine', 'jade');
app.post('/upload', upload);
app.post('/upload/:id', uploadid);
app.get('/list',list);
app.delete('/del/:id',deleteimg);
app.get('/', function (req, res) {
	res.render('lista');
});
function deleteimg(req,res) {
	var id = req.params.id;
	Immagine.findByIdAndRemove(id,function(err) {
		if (err)
			console.log(err);
		fs.unlink("uploads/"+id,function(err) {
			res.end();
		});
	});
}
function showImg(id,x,y,res) {
	var path = 'uploads/'+id;
	var buf = require('fs').readFileSync(path);
	gm(buf,id).size(function (err,size) {
		if (err) throw err;
		if (x != 0) {
			if (y != 0) {
				var scalax = x/size.width;
				var scalay = y/size.height;
				var scala = scalax<scalay? scalay:scalax;
				var newx = Math.round(size.width*scala);
				var newy = Math.round(size.height*scala);
				this.resize(newx,newy);
				var topx = (newx-x)/2;
				var topy = (newy-y)/2;
				this.crop(x,y,topx,topy);
			}
			else {
				this.resize(x);
			}
		}
		else if (y != 0) {
			this.resize(null,y);
		}
		this.toBuffer('PNG',function (err, buffer) {
			if (err) throw err;
			res.writeHead(200, {'Content-Type': 'image/png' });
			res.end(buffer, 'binary');
		});
	});
}
function cropImg(id,x,y,tox,toy,res) {
	var path = 'uploads/'+id;
	var buf = require('fs').readFileSync(path);
	gm(buf,id).crop(x,y,tox,toy).toBuffer('PNG',function (err, buffer) {
		if (err) throw err;
		res.writeHead(200, {'Content-Type': 'image/png' });
		res.end(buffer, 'binary');
	});
}

app.get('/i/:id', function (req, res) {
	id  = req.params.id;
	res.writeHead(200, {'content-type': 'text/html'});
	var html = "<table>";
	html += "<tr><td colspan=\"3\">";
	html += "<a href=\"/img/"+id+"\">Originale</a>";
	html += "</td></tr>";
	html += "<tr><td colspan=\"3\">";
	html += "<img src=/img/"+id+"/>";
	html += "</td></tr>";
	html += "<tr>";
	html += "<td>";
	html += "<a href=\"/img/"+id+"/200/200\">200*200</a>";
	html += "</td>";
	html += "<td>";
	html += "<a href=\"/img/"+id+"/0/200\">height=200</a>";
	html += "</td>";
	html += "<td>";
	html += "<a href=\"/img/"+id+"/200\">width=200</a>";
	html += "</td>";
	html += "<td>";
	html += "<a href=\"/img/"+id+"/200/200/156/50\">crop=200x200</a>";
	html += "</td>";
	html += "</tr>";
	html += "<tr>";
	html += "<td>";
	html += "<img src=/img/"+id+"/200/200/>";
	html += "</td>";
	html += "<td>";
	html += "<img src=/img/"+id+"/0/200/>";
	html += "</td>";
	html += "<td>";
	html += "<img src=/img/"+id+"/200/>";
	html += "</td>";
	html += "<td>";
	html += "<img src=/img/"+id+"/200/200/156/50/>";
	html += "</td>";
	html += "</tr>";
	html += "</table>";
	res.end(html);
});
app.get('/img/:id', function (req, res) {
	showImg(req.params.id,0,0,res);
});
app.get('/img/:id/:x', function (req, res) {
	showImg(req.params.id,req.params.x,0,res);
});
app.get('/img/:id/:x/:y', function (req, res) {
	showImg(req.params.id,req.params.x,req.params.y,res);
});
app.get('/img/:id/:x/:y/:tox/:toy', function (req, res) {
	cropImg(req.params.id,req.params.x,req.params.y,req.params.tox,req.params.toy,res);
});

app.get('/u', function(req, res) {
  res.render('upload');
});
app.get('/index', function(req, res) {
  res.render('index');
});

function list(req,res) {
	if (true) {
		fs.readdir("uploads",function(err,files) {
			files.sort();
			files.reverse();
			var images = [];
			for (i in files) {
				images.push({_id:files[i],date:i,oldname:files[i]});
			}
			res.writeHead(200, {'content-type': 'text/html'});
			res.end(JSON.stringify({ images: images }));
		});
		return;
	}
	else {
		Immagine.find({}).sort({'date':-1}).exec( function(err,images) {
			res.writeHead(200, {'content-type': 'text/html'});
			res.end(JSON.stringify({ images: images }));
		});
	}
}

function upload(req,res) {
	upload3(req,res,new Immagine({ newname: '' }));
}
function uploadid(req, res){
	Immagine.findById(req.params.id,function(err,img) {
		upload3(req,res,img);
	});
}
function upload3(req,res,img) {
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		res.writeHead(200, {'content-type': 'appplication/json'});
		if (files.file && files.file.type.match(/image/)) {
			res.end(JSON.stringify({ id: img._id }));
		}
		else {
			res.end(JSON.stringify({ id: '' }));
		}
	});

	form.on('end', function(fields, files) {
		if (this.openedFiles[0] !== undefined && this.openedFiles[0].hasOwnProperty('type') && this.openedFiles[0].type.match(/image/)) {
			/* Temporary location of our uploaded file */
			var temp_path = this.openedFiles[0].path;
			/* The file name of the uploaded file */
			//var file_name = this.openedFiles[0].name;
			img.oldname = this.openedFiles[0].name;
			img.ip = req.ip;
			img.save(function (err) {
				if (err) console.log(err);
			});
			var file_name = img._id;
			/* Location where we want to copy the uploaded file */
			var new_location = 'uploads/';

			fs.copy(temp_path, new_location + file_name, function(err) {  
				if (err) {
					console.error(err);
				} else {
					//console.log( this.openedFiles[0].name);
				}
			});
		}
		else {
			console.error('Not an image.');
		}
	});
}

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
