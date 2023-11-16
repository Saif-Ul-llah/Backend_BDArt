// models/CartItem.js

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: Object, // Assuming your product IDs are strings, adjust if necessary
    required: true,
  },
  userId: {
    type: String, // Assuming your user IDs are strings, adjust if necessary
    required: true,
  },
  selectedOptions: {
    type: Object, // Adjust the type based on your requirements
  },
  description: {
    type: String,
  },
  selectedFile: {
    type: String, // Assuming file paths or URLs, adjust if necessary
  },
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = CartItem;
