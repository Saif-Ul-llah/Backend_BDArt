const express = require("express");
const Registration = require("./models/registration");
// const Provider = require("./models/providers");
const cors = require("cors");
const bodyParser = require("body-parser");
// const Product = require('./models/product');
const session = require("express-session");
const fileUpload = require("express-fileupload");
const compression = require("compression");
const Product = require("./models/product");
const mongoose = require("mongoose");
const CartItem = require("./models/CartItems");

const app = express();
const allowedOrigins = ["http://localhost:3000"];
app.timeout = 300000;


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// app.use(express.urlencoded({ extended: true }));

app.use(fileUpload());
// app.use(express.json())
app.use(compression());
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

mongoose
  .connect(
    process.env.MONGODB_UR ||
      "mongodb+srv://brandwavedigital1:admin123987@bd-arts.yufffbg.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp"
  )
  .then(() => {
    console.log("mongoose connected with atlas");
    app.listen(8080, () => {
      console.log("app running on port 8080");
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Server is running !");
});
app.get("/protected-route", (req, res) => {
  if (req.session.user) {
    // User is authenticated, you can proceed
    res.json({ message: "Authenticated user" });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.post(`/registration`, async (req, res) => {
  try {
    //  const {userName,userEmail,userPass}=req.body
    const { userEmail } = req.body;

    //   console.log(req.body)
    const isNewUser = await Registration.emailExists(userEmail);
    if (!isNewUser)
      return res.json({ success: false, message: "already in use" });
    const user = await Registration.create({
      user_name: req.body.userName,
      email: req.body.userEmail,
      password: req.body.userPass,
    });
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Configure express-session middleware
app.use(
  session({
    secret: "your-secret-key", // Change this to a secure secret
    resave: false,
    saveUninitialized: false,
  })
);

app.post("/signin", async (req, res) => {
  try {
    const { userEmail, userPass } = req.body;
    const email = userEmail;

    const user = await Registration.findOne({ email });

    if (user && userPass === user.password) {
      // Store user information in the session
      req.session.user = {
        email: user.email,
        // Other user data as needed
      };
      res.status(200).json(user);
    } else {
      res.status(401).json({ message: "Credentials do not match" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/admin", async (req, res) => {
  try {
    const email = "admin@gmail.com";
    const password = "admin123";

    const { userEmail, userPass } = req.body;
    // console.log(userEmail,userPass)

    if (email === userEmail && password === userPass) {
      res.status(200).json(email);
    } else {
      res.status(401).json({ message: "Credentials do not match" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//   app.post('/add-product', async (req, res) => {
//     try {
//       const { name, brand, price, category, imageData, imageContentType } = req.body;
// console.log(name)
//       // Basic validation
//       if (!name || !brand || !price || !category || !imageData || !imageContentType) {
//         return res.status(400).json({ message: 'All fields are required.' });
//       }

//       // Additional validation (you can customize this based on your requirements)

//       // Assuming price should be a positive number
//       if (typeof price !== 'number' || price <= 0) {
//         return res.status(400).json({ message: 'Price must be a positive number.' });
//       }

//       // Create a new product instance
//       const newProduct = new Product({
//         name,
//         brand,
//         price,
//         category,
//         imageUrl: `data:${imageContentType};base64,${imageData}`,
//       });

//       // Save the product to the database
//       const savedProduct = await newProduct.save();
//       console.log(savedProduct);
//       res.status(201).json(savedProduct);
//     } catch (error) {
//       console.error('Error adding product:', error);

//       // Differentiate between validation errors and database errors
//       if (error.name === 'ValidationError') {
//         // Extract specific validation error messages
//         const validationErrors = Object.values(error.errors).map((e) => e.message);
//         res.status(400).json({ message: 'Validation failed.', errors: validationErrors });
//       } else {
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     }
//   });

// Route to get all products

// app.post('/add-product', async (req, res) => {
//   console.log(req.body);
//   // console.log(req.files);
//   try {
//     const { name, brand, price, category, imageData, imageContentType } = req.body;

//     // Basic validation
//     if (!name || !brand || !price || !category || !imageData || !imageContentType) {
//       return res.status(400).json({ message: 'All fields are required.' });
//     }
//     // Create a new product instance
//     const newProduct = new Product({
//       name,
//       brand,
//       price,
//       category,
//       imageUrl: `data:${imageContentType};base64,${imageData}`,
//     });

//     // Save the product to the database
//     const savedProduct = await newProduct.save();
//     // console.log(savedProduct);
//     res.status(201).json({message:'add-Sucessfully',savedProduct});
//   } catch (error) {
//     console.error('Error adding product:', error);

//     // Differentiate between validation errors and database errors
//     if (error.name === 'ValidationError') {
//       // Extract specific validation error messages
//       const validationErrors = Object.values(error.errors).map((e) => e.message);
//       res.status(400).json({ message: 'Validation failed.', errors: validationErrors });
//     } else {
//       res.status(500).json({ message: 'Internal Server Error' });
//     }
//   }
// });

// ... (imports and other configurations)

app.post('/add-product',async(req, res) => {

  try {
    const {
      name,
      price,
      category,
      imageData,
      Background,
      animation,
      Character_Proportion,
      Rigging,
      Overlay_Type,
    } = req.body;

    // Basic validation
    if (!name || !price || !category || !imageData ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Create a new product instance with required fields
    const newProductData = {
      name,
      price,
      category,
      imageUrl:imageData,
    };

    // Set optional fields
    newProductData.Background = JSON.parse(Background);
    newProductData.animation = JSON.parse(animation);
    newProductData.Character_Proportion = JSON.parse(Character_Proportion);
    newProductData.Rigging = JSON.parse(Rigging);
    newProductData.Overlay_Type = JSON.parse(Overlay_Type);

    // Create a new Product instance with all fields
    const newProduct = new Product(newProductData);

    // Save the product to the database
    const savedProduct = await newProduct.save();

    // Return a success message along with the saved product
    res
      .status(201)
      .json({ message: "Product added successfully.", savedProduct });
  } catch (error) {
    console.error("Error adding product:", error);

    // Differentiate between validation errors and database errors
    if (error.name === "ValidationError") {
      // Extract specific validation error messages
      const validationErrors = Object.values(error.errors).map(
        (e) => e.message
      );
      res
        .status(400)
        .json({ message: "Validation failed.", errors: validationErrors });
    } else {
      // Generic server error message
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

app.get("/get-products", async (req, res) => {
  try {
    // Retrieve a limited set of products from the database
    // const { page = 1, pageSize = 10 } = req.query; 
    const products = await Product.find()
      .select("name category price imageUrl brand")
      
   
    // Send the list of products as a response
    res.status(200).json(products);
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/update-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, brand, price, category, imageData, imageContentType } =
      req.body;

    console.log("Received image data on the server:", imageData);
    console.log("Received image content type on the server:", imageContentType);

    // Basic validation
    if (
      !name ||
      !brand ||
      !price ||
      !category ||
      !imageData ||
      !imageContentType
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find the product by ID
    const product = await Product.findById(productId);

    // Check if the product exists
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Update product details
    product.name = name;
    product.brand = brand;
    product.price = price;
    product.category = category;

    // Update image if provided
    if (imageData && imageContentType) {
      product.imageUrl = `data:${imageContentType};base64,${imageData}`;
    }

    // Save the updated product
    const updatedProduct = await product.save();

    res
      .status(200)
      .json({ message: "Product updated successfully.", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);

    // Differentiate between validation errors and database errors
    if (error.name === "ValidationError") {
      // Extract specific validation error messages
      const validationErrors = Object.values(error.errors).map(
        (e) => e.message
      );
      res
        .status(400)
        .json({ message: "Validation failed.", errors: validationErrors });
    } else {
      // Generic server error message
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

app.delete("/delete-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product by ID and delete it
    await Product.findByIdAndDelete(productId);

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}); 

app.get("/get-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product by ID
    const product = await Product.findById(productId);

    // Return the product details
    res.status(200).json(product);
  } catch (error) {
    console.error("Error getting product details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get('/products-by-category/:category', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { category } = req.params;

    const products = await Product.find({ category: category })
      .select('name category price imageUrl brand')
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json(products);
  } catch (error) {
    console.error('Error getting products by category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/update-cart',async (req, res) => {

  try {
    const { productId, userId, selectedOptions, description ,img} = req.body;
   

    // Create a new cart item
    const newCartItem = new CartItem({
      productId,
      userId,
      selectedOptions, 
      description,
      selectedFile:img
    });

    // Save the cart item to the database
    const savedCartItem = await newCartItem.save();

    res.json({message:true, savedCartItem});
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } 

});

app.get('/get-cart-items/:userId', async (req, res) => {  
  try {
    const userId = req.params.userId;
    // console.log(userId);
    const cartItems = await CartItem.find({userId});

    res.json({ message: true, cartItems });
  } catch (error) {
    console.error('Error getting cart items:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}); 