const bcrypt = require('bcryptjs');

const plainTextPassword = '123@admin'; // <--- CHANGE THIS to your desired password
const saltRounds = 10; // This should match the salt rounds used in your User model

bcrypt.hash(plainTextPassword, saltRounds)
  .then(hash => {
    console.log('Hashed Password:', hash);
  })
  .catch(err => {
    console.error('Error hashing password:', err);
  });