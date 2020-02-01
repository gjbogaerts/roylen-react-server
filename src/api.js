require('./models/User');
const authRoutes = require('./routes/AuthRoute');
const hostname = 'localhost';
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//set up db connection

const mongoUri = 'mongodb://localhost/roylen';
mongoose.connect(mongoUri, {
	useUnifiedTopology: true,
	useCreateIndex: true,
	useNewUrlParser: true
});
mongoose.connection.on('connected', () => {
	console.log('connected to local mongo db server');
});
mongoose.connection.on('error', err => {
	console.error('Error conntecting to local mongdo db server', err);
});

//starting app, routes and middleware
const app = express();
app.get('/', (req, res) => {
	res.send('Hi there from the api!!');
});

app.use(bodyParser.json());
app.use(authRoutes);
app.listen(3000, hostname, () => {
	console.log('listening on port 3000');
});
