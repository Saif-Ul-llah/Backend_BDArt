const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
  userId: {
    type: Object,
    required: true,
  },
  products: [
    {
      productId: {
        type: Object,
        required: true,
      },
      name:{
        type:String,
        required:true,
      },
      productImage:{
        type :String
      },
      quantity: {
        type: Number,
        required: true,
      },

      price: {
        type: Number,
        required: true,
      },
      dec:{
        type:String,
      },

    selectedFile:{
        type: String
    },
    selectedOptions: {
        type: Object, // Adjust the type based on your requirements
      },

    },
  ],
  paymentMethod: {
    type: String, // "paypal" or "stripe" or any other payment method
    required: true,
  },
  paymentDetails: {
    // Add fields specific to payment details (e.g., transaction ID, payment status)
    type: mongoose.Schema.Types.Mixed, // This allows storing arbitrary data
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
