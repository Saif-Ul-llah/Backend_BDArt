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
const Stripe = require("stripe");
const paypal = require("@paypal/checkout-server-sdk");
// ('sk_test_4eC39HqLyjWDarjtT1zdp7dc')
const stripe = Stripe("sk_test_4eC39HqLyjWDarjtT1zdp7dc");
const axios = require('axios');

const app = express();
// const allowedOrigins = ['https://bd-art.vercel.app'];
const allowedOrigins = ["http://localhost:3000", "https://checkout.stripe.com"];
app.timeout = 300000;
const port = process.env.PORT || 8080;

// Set up PayPal environment
const clientId =
  "ASXc_cVI_R_9qUDqkw3VkOGzjRVUFiUC-Rh2w8lSxwIzCzqQjTEfhSKEZa5OCy_0nqyTHo79UXYgUZ7a";
const clientSecret =
  "EMw_7Z61I4z4Icnoxtx-SUKnaGBTBpaCQnGW8oqgvukAuy_oHXgS3WCHUfYN75hRfpe2Wobtjp04mc1k";

const environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(fileUpload());
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
    app.listen(port, () => {
      console.log(`app running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send(`Server is running ! on :${port} `);
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

app.post("/add-product", async (req, res) => {
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
    if (!name || !price || !category || !imageData) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Create a new product instance with required fields
    const newProductData = {
      name,
      price,
      category,
      imageUrl: imageData,
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
    const products = await Product.find().select(
      "name category price imageUrl brand"
    );

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

app.get("/products-by-category/:category", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { category } = req.params;

    const products = await Product.find({ category: category })
      .select("name category price imageUrl brand")
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json(products);
  } catch (error) {
    console.error("Error getting products by category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/update-cart", async (req, res) => {
  try {
    const { productId, userId, selectedOptions, description, img } = req.body;

    // Create a new cart item
    const newCartItem = new CartItem({
      productId,
      userId,
      selectedOptions,
      description,
      selectedFile: img,
    });

    // Save the cart item to the database
    const savedCartItem = await newCartItem.save();

    res.json({ message: true, savedCartItem });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/get-cart-items/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    // console.log(userId);
    const cartItems = await CartItem.find({ userId });

    res.json({ message: true, cartItems });
  } catch (error) {
    console.error("Error getting cart items:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/create-checkout-session", async (req, res) => {
  // console.log(req.body);
  const line_items = req.body.cart.map((items) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: items.productId.name,
          images: [items.productId.imageUrl],
          description: items.description,
          metadata: {
            id: items.productId._id,
          },
        },
        unit_amount: items.productId.price * 100,
      },
      quantity: 1,
    };
  });
  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    success_url: "http://localhost:3000/Orders",
    cancel_url: "http://localhost:3000/Payment",
    // success_url: 'https://bd-art.vercel.app/Orders',
    // cancel_url: 'https://bd-art.vercel.app/Payment',
  });

  res.redirect(303, session.url);
});

async function getAccessToken() {
  try {
    const clientId =
      "ASXc_cVI_R_9qUDqkw3VkOGzjRVUFiUC-Rh2w8lSxwIzCzqQjTEfhSKEZa5OCy_0nqyTHo79UXYgUZ7a"; // Replace with your actual PayPal client ID
    const clientSecret =
      "EMw_7Z61I4z4Icnoxtx-SUKnaGBTBpaCQnGW8oqgvukAuy_oHXgS3WCHUfYN75hRfpe2Wobtjp04mc1k"; // Replace with your actual PayPal client secret
    const response = await axios.post(
      "https://api.paypal.com/v1/oauth2/token",
      `grant_type=client_credentials`,
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error obtaining PayPal access token:", error.message);
    throw new Error("Error obtaining PayPal access token");
  }
}

app.post("/pay", async (req, res) => {
  try {
    // Check if 'total' and 'cart' properties exist in the request body
    if (!req.body.total || !req.body.cart) {
      throw new Error("Invalid request body");
    }

    // Obtain PayPal access token
    const accessToken = await getAccessToken(); // Implement the function to get the access token

    const lineItems = req.body.cart.map((item) => {
      return {
        name: item.productId.name,
        unit_amount: {
          currency_code: "USD",
          value: item.productId.price.toFixed(2),
        },
        quantity: 1,
      };
    });

    const request = {
      method: "post",
      url: "https://api.paypal.com/v2/checkout/orders", // Update with the correct PayPal API endpoint
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // Include the access token in the Authorization header
      },
      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: req.body.total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: req.body.total.toFixed(2),
                },
              },
            },
            items: lineItems,
          },
        ],
        application_context: {
          return_url: "http://localhost:3000/Orders", // Change to your success URL
          cancel_url: "http://localhost:3000/Payment", // Change to your cancel URL
        },
      },
    };

    const response = await axios(request);
    
    // Get the 'approve' link from the response
    const approveLink = response.data.links.find(link => link.rel === 'approve');

    if (approveLink) {
      // Redirect the user to the PayPal approval page
      res.redirect(approveLink.href);
    } else {
      console.error("No 'approve' link found in the PayPal response.");
      res.status(500).json({ error: "Internal server error" });
    }
  } catch (error) {
    console.error("Error creating PayPal session:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to obtain PayPal access token
