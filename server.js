var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    Rx = require('rx'),
    Immutable = require('immutable');

var usersMap = Immutable.Map({});
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
        extended: false
    }));
app.use('/', express.static(path.join(__dirname, 'client')));

var server = app.listen(5002);

var io = require('socket.io')(server);
var sourceConnect = Rx.Observable.create(function(observer){
    
    io.on('connection', function(socket){

        socket.emit('my socketId', {'socketId': socket.id, 'connectTime': Date.now()});

        socket.on('client connect', function(data){
            observer.onNext({'socket': socket, 'data': data, 'event': 'client connect'});
        });
    });

    return function(){
        io.close();
    }
});

var sourceDisconnect = Rx.Observable.create(function(observer){

    io.on('connection', function(socket){
        socket.on('disconnect', function(data){
            observer.onNext({'socketId': socket.id, 'event': 'client disconnect'});
        });
    });

    return function(){
        io.close();
    }
});

var observerConnect = sourceConnect
.subscribe(function(obj){
    var socketId = obj.data.socketId;
    usersMap = usersMap.set(socketId, obj.data);
    io.emit('all users', usersMap.toArray());
});

var observerDisconnect = sourceDisconnect
.subscribe(function(obj){
    var socketId = obj.socketId;
    var user = usersMap.get(socketId);
    usersMap = usersMap.delete(obj.socketId);
    io.emit('all users', usersMap.toArray());
});

app.post('/message', function(req, res){
    io.emit('message', req.body);
});

