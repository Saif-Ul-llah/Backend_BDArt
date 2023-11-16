const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  Background: {
    type: Object,
  },
  animation: {
    type: Object,
  },
  Character_Proportion: {
    type: Object,
  },
  Rigging: {
    type: Object,
  },
  Overlay_Type: {
    type: Object,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
