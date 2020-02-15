const jwt = require('jsonwebtoken');
const JWTKey = require('../env/keys');

module.exports = (req, res, next) => {
	const { authorization } = req.headers;
	if (!authorization) {
		return res
			.status(422)
			.send({ error: 'Auth absent. You must be logged in', err });
	}
	const token = authorization.replace('Bearer ', '');
	jwt.verify(token, JWTKey, async (err, payload) => {
		if (err) {
			return res.status(422).send({ error: 'You must be logged in', err });
		}
		const { adminName } = payload;
		req.adminName = adminName;
		next();
	});
};
