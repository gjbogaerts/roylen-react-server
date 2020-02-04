const mongoose = require('mongoose');
require('./models/User');
require('./models/Ad');
const Ad = mongoose.model('Ad');
const User = mongoose.model('User');
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

const Schema = mongoose.Schema;

const personSchema = Schema({
	_id: Schema.Types.ObjectId,
	name: String,
	age: Number,
	stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
});

const storySchema = Schema({
	author: { type: Schema.Types.ObjectId, ref: 'Person' },
	title: String,
	fans: [{ type: Schema.Types.ObjectId, ref: 'Person' }]
});

const Story = mongoose.model('Story', storySchema);
const Person = mongoose.model('Person', personSchema);

const author = new Person({
	_id: new mongoose.Types.ObjectId(),
	name: 'Ian Fleming',
	age: 50
});

author.save(function(err) {
	if (err) return;
	const story1 = new Story({
		title: 'Casino Royale',
		author: author._id
	});
	story1.save(function(err) {
		if (err) return;
	});
});

Story.findOne({ title: 'Casino Royale' })
	.populate('author')
	.exec(function(err, story) {
		if (err) console.log(err);
		console.log('The author is %s', story.author.name);
	});

Ad.findById('5e3886f3cd0710607ad3c9a8')
	.populate('creator')
	.exec((err, ad) => {
		if (err) console.log(err);
		console.log('The creator is %s', ad.creator.screenName);
	});

Ad.find({ isActive: true })
	.populate('creator')
	.exec((err, docs) => {
		if (err) {
			console.log('Error connecting to the database');
		}
		console.log(docs);
	});
