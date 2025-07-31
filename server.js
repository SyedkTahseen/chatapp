const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const stripe = require('stripe')('sk_test_your_stripe_secret_key');
const app = express();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb('Error: Images only (jpeg, jpg, png, gif)!');
  }
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/styles', express.static('styles'));
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost/EcommerceDB',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: false, // set to true if using https
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost/EcommerceDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phone: String,
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  images: [String],
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentMethod: String,
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: String,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 }
  }],
  createdAt: { type: Date, default: Date.now }
});
const Cart = mongoose.model('Cart', cartSchema);

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user && user.isAdmin) {
      return next();
    }
  }
  res.status(403).render('error', { message: 'Access denied. Admin only.' });
};

// Password validation function
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};

// Routes

// Home page
app.get('/', async (req, res) => {
  try {
    const featuredProducts = await Product.find({ featured: true }).limit(8);
    const categories = await Product.distinct('category');
    res.render('index', { 
      user: req.session.userId ? await User.findById(req.session.userId) : null,
      featuredProducts,
      categories
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Login page
app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
});

// Register page
app.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('register', { error: null });
});

// Products page
app.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const category = req.query.category;
    const search = req.query.search;
    
    let query = {};
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    const pages = Math.ceil(total / limit);
    
    res.render('products', {
      user: req.session.userId ? await User.findById(req.session.userId) : null,
      products,
      currentPage: page,
      pages,
      category,
      search
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Product detail page
app.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }
    
    const relatedProducts = await Product.find({ 
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);
    
    res.render('product-detail', {
      user: req.session.userId ? await User.findById(req.session.userId) : null,
      product,
      relatedProducts
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Cart page
app.get('/cart', async (req, res) => {
  try {
    let cart;
    if (req.session.userId) {
      cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    } else if (req.session.cartId) {
      cart = await Cart.findById(req.session.cartId).populate('items.product');
    }
    
    res.render('cart', {
      user: req.session.userId ? await User.findById(req.session.userId) : null,
      cart: cart || { items: [] }
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Checkout page
app.get('/checkout', isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }
    
    const user = await User.findById(req.session.userId);
    res.render('checkout', { user, cart });
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
});

// User profile
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const orders = await Order.find({ user: req.session.userId }).populate('items.product');
    res.render('profile', { user, orders });
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Admin dashboard
app.get('/admin', isAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find().populate('user');
    const users = await User.find();
    
    res.render('admin/dashboard', { products, orders, users });
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
});

// API Routes

// Register user
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    if (!validatePassword(password)) {
      return res.render('register', { error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' });
    }
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.render('register', { error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName
    });
    
    await user.save();
    req.session.userId = user._id;
    res.redirect('/');
  } catch (error) {
    res.render('register', { error: 'Registration failed' });
  }
});

// Login user
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    
    req.session.userId = user._id;
    res.redirect('/');
  } catch (error) {
    res.render('login', { error: 'Login failed' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Add to cart
app.post('/cart/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    let cart;
    
    if (req.session.userId) {
      cart = await Cart.findOne({ user: req.session.userId });
      if (!cart) {
        cart = new Cart({ user: req.session.userId, items: [] });
      }
    } else {
      if (!req.session.cartId) {
        cart = new Cart({ sessionId: Date.now().toString(), items: [] });
        await cart.save();
        req.session.cartId = cart._id;
      } else {
        cart = await Cart.findById(req.session.cartId);
      }
    }
    
    const existingItem = cart.items.find(item => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.items.push({ product: productId, quantity: parseInt(quantity) });
    }
    
    await cart.save();
    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// Update cart
app.put('/cart/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let cart;
    
    if (req.session.userId) {
      cart = await Cart.findOne({ user: req.session.userId });
    } else if (req.session.cartId) {
      cart = await Cart.findById(req.session.cartId);
    }
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const item = cart.items.find(item => item.product.toString() === productId);
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(item => item.product.toString() !== productId);
      } else {
        item.quantity = quantity;
      }
      await cart.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

// Create order
app.post('/order/create', isAuthenticated, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    const items = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price
    }));
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = new Order({
      user: req.session.userId,
      items,
      total,
      shippingAddress,
      paymentMethod
    });
    
    await order.save();
    
    // Clear cart
    await Cart.findByIdAndDelete(cart._id);
    
    res.json({ success: true, orderId: order._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Admin routes
app.post('/admin/product', isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, stock, featured } = req.body;
    const images = req.files ? req.files.map(file => file.filename) : [];
    
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      featured: featured === 'on',
      images
    });
    
    await product.save();
    res.redirect('/admin');
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to create product' });
  }
});

// Initialize sample data
const initializeData = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const sampleProducts = [
        {
          name: 'Wireless Bluetooth Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 99.99,
          category: 'Electronics',
          stock: 50,
          featured: true,
          images: ['headphones.jpg']
        },
        {
          name: 'Smart Fitness Watch',
          description: 'Track your fitness goals with this advanced smartwatch',
          price: 199.99,
          category: 'Electronics',
          stock: 30,
          featured: true,
          images: ['smartwatch.jpg']
        },
        {
          name: 'Organic Cotton T-Shirt',
          description: 'Comfortable and eco-friendly cotton t-shirt',
          price: 29.99,
          category: 'Clothing',
          stock: 100,
          featured: false,
          images: ['tshirt.jpg']
        },
        {
          name: 'Running Shoes',
          description: 'Professional running shoes for maximum comfort',
          price: 89.99,
          category: 'Footwear',
          stock: 75,
          featured: true,
          images: ['shoes.jpg']
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('Sample products initialized');
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeData();
});