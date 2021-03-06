const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  screenName: {
    type: String,
    unique: true,
    required: true,
    minlength: 3
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  nix: {
    type: Number,
    default: 100,
    required: true
  },
  pwResetKey: {
    type: String
  },
  avatar: {
    type: String
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  ads: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Ad' }],
  favoriteAds: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Ad' }]
});

UserSchema.pre('save', function(next) {
  const user = this;
  if (!user.isModified('password')) {
    return next;
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  const user = this;
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }
      if (!isMatch) {
        return reject(false);
      }
      return resolve(true);
    });
  });
};

mongoose.model('User', UserSchema);
