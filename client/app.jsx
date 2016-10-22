var Main = React.createClass({
    getInitialState() {
        return {
            users: [],
            messages: []
        }
    },
    componentDidMount() {
        var socket = io();
        var props = this.props;
        var users = this.state.users;
        var messages = this.state.messages;
        var self = this;

        var socketIdStream = Rx.Observable.create(observer => {
            socket.on('my socketId', data => { observer.onNext(data); });
        });
        socketIdStream.subscribe(data => {
            socket.emit('client connect', {
                screenname: props.screenname,
                socketId: data.socketId,
                connectTime: data.connectTime
            });
        });

        var socketAllUsersStream = Rx.Observable.create(observer => {
            socket.on('all users', data => { observer.onNext(data); });
        });
        socketAllUsersStream.subscribe(data => {
            self.setState({users: data});
        });

        var socketMessageStream = Rx.Observable.create(observer => {
            socket.on('message', data => { observer.onNext(data); });
        });
        socketMessageStream.subscribe(data => {
            messages.push(data);
            self.setState(messages);
        });
    },
    render() {
        return (
            <div>
                <AppBar />
                <div className="row">
                    <div className="col s6"><ChatPane data={{screenname: this.props.screenname,
                        messages: this.state.messages}} /></div>
                    <div className="col s6"><PresencePane data={this.state.users}/></div>
                </div>
            </div>
        );
    }
});

var AppBar = React.createClass({
    render() {
        return (
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo center">RxJS CHAT</a>
                            <ul id="nav-mobile" className="left hide-on-med-and-down">
                                <li><a href="#">about</a></li>
                        </ul>
                    </div>
                </nav>
            </div>
        );
    }
});

var PresencePane = React.createClass({
    render() {
        return (
            <div>
                <h4>active users</h4>
                <table className="striped">
                    <thead>
                        <tr>
                            <th data-field="id">screenname</th>
                            <th data-field="name">online</th>
                        </tr>
                    </thead>

                    <tbody>
                    {
                        this.props.data.map((user, index) => {
                            return <tr key={user.screenname}>
                                <td>{user.screenname}</td>
                                <td>{moment(user.connectTime).format('YYYY-MM-DD HH:mm:ss')}</td>
                            </tr>
                        })
                    }
                    </tbody>
                </table>
            </div>
        );               
    }
});

var ChatPane = React.createClass({
    componentDidMount() {
        var button = document.getElementById('sendBtn');
        var textField = document.getElementById('message-input');

        var clickStream = Rx.Observable.fromEvent(button, 'click').map(e => true);
        var enterKeyPressedStream = Rx.Observable.fromEvent(textField, 'keyup').filter(e => e.keyCode == 13);
        var textEnteredStream = Rx.Observable.fromEvent(textField, 'keyup').map(e => e.target.value);
        var sendMessageStream = Rx.Observable.merge(clickStream, enterKeyPressedStream);

        var mergedStream = textEnteredStream.takeUntil(sendMessageStream);

        var text = '';
        var onNext = t => { text = t; }
        var onError = e => { }
        var onComplete = () => {
            $.post('/message', {'message': text, 'name': this.props.data.screenname, 'timestamp': Date.now()});
            textField.value = '';
            textField.focus();
            mergedStream.subscribe(onNext, onError, onComplete);
        }
        mergedStream.subscribe(onNext, onError, onComplete);
    },
    render() {
        return (
            <div>
               <h4>your name is {this.props.data.screenname}</h4>
               <ul className="collection">
                    {
                        this.props.data.messages.map((message, index) => {
                            return <li className="collection-item" key={message.timestamp}>
                            <span className="title">{message.name} <i>{moment(parseInt(message.timestamp)).format('YYYY-MM-DD HH:mm:ss')}</i></span>
                            <p>
                            <strong>{message.message}</strong>
                            </p>
                            </li>
                        })
                    }
                </ul>
                <div className="row">
                    <div className="input-field col s10">
                        <input id="message-input" type="text" className="validate" ref="message" />
                        <label className="active" htmlFor="message-input">your text message</label>
                    </div>
                    <div className="input-field col s2">
                        <a id="sendBtn" className="btn-floating btn-large waves-effect waves-light red"><i className="material-icons">send</i></a>
                    </div>
                </div>
            </div>
        );
    }
});



var createRandomName = len => {
    var text = '';
    var accepted = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < len; i++) {
        text += accepted.charAt(Math.floor(Math.random() * accepted.length));
    }
    return text;
};

//screenname is randomly generated and passed in as a prop to Main class

ReactDOM.render(<Main screenname={createRandomName(6)} />, document.getElementById('container'));
