// Inside your MongoDB model file (e.g., Registration.js)

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  user_name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  apply: {
    promoCode: {
      type: String,
    },
  },
});

userSchema.statics.emailExists = async function (email) {
  try {
    const user = await this.findOne({ email });
    if (user) return false;

    return true;
  } catch (error) {
    console.log(`error from emailExists: ${error.message}`);
    return false;
  }
};

// New method to add a user based on Google login data
userSchema.statics.addGoogleUser = async function (userData) {
  try {
    const { email, user_name } = userData;
    
    // Check if the user already exists
    const userExists = await this.emailExists(email);
    
    if (!userExists) {
      // User already exists, do nothing
      return;
    }

    // User doesn't exist, add to the database
    const newUser = new this({
      user_name,
      email,
    });

    await newUser.save();
  } catch (error) {
    console.log(`error from addGoogleUser: ${error.message}`);
  }
};

const Registration = mongoose.model('Registration', userSchema);

module.exports = Registration;
