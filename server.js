const express = require('express');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configure multer for product image uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb('Error: Images only (jpeg, jpg, png, gif, webp)!');
  }
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/styles', express.static('styles'));
app.use('/uploads', express.static('uploads'));
app.use('/js', express.static('js'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost/ECommerceApp', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
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
  otp: String,
  otpExpiration: Date,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: String,
  brand: String,
  images: [String],
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  tags: [String],
  specifications: [{
    key: String,
    value: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ name: 'text', description: 'text', category: 'text', brand: 'text' });
const Product = mongoose.model('Product', productSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model('Cart', cartSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  paymentMethod: { type: String, default: 'card' },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'your-email@gmail.com', // Update with your email
    pass: 'your-app-password', // Update with your app password
  },
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, 'secretkey');
    req.user = decoded;
    next();
  } catch (err) {
    res.redirect('/login');
  }
};

// Middleware for admin authentication
const authenticateAdmin = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, 'secretkey');
    const user = await User.findOne({ email: decoded.email });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Password validation function
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};

// Routes
app.get('/', async (req, res) => {
  try {
    const featuredProducts = await Product.find({ featured: true }).limit(8);
    const categories = await Product.distinct('category');
    res.render('index', { featuredProducts, categories, user: req.user || null });
  } catch (err) {
    console.error('Error loading homepage:', err);
    res.render('index', { featuredProducts: [], categories: [], user: null });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  try {
    if (!validatePassword(password)) {
      return res.render('register', {
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).',
      });
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
    console.log('User registered:', email);
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err.message);
    if (err.code === 11000) {
      res.render('register', { error: 'Email already exists. Please use a different email.' });
    } else {
      res.render('register', { error: 'Registration failed. Please try again.' });
    }
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { error: 'No account found with this email.' });
    }
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ 
        email: user.email, 
        username: user.username,
        userId: user._id,
        role: user.role 
      }, 'secretkey');
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/');
    } else {
      res.render('login', { error: 'Incorrect password. Please try again.' });
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.render('login', { error: 'Login failed. Please try again.' });
  }
});

// Product routes
app.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'desc' ? -1 : 1;

    let query = {};
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);

    const categories = await Product.distinct('category');

    res.render('products', {
      products,
      categories,
      currentPage: page,
      totalPages,
      category: category || '',
      search: search || '',
      sort,
      order: req.query.order || 'asc',
      user: req.user || null
    });
  } catch (err) {
    console.error('Error loading products:', err);
    res.render('products', { 
      products: [], 
      categories: [], 
      currentPage: 1, 
      totalPages: 1,
      category: '',
      search: '',
      sort: 'createdAt',
      order: 'asc',
      user: null
    });
  }
});

app.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render('404');
    }
    
    const reviews = await Review.find({ productId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const relatedProducts = await Product.find({ 
      category: product.category, 
      _id: { $ne: product._id } 
    }).limit(4);

    res.render('product-detail', { 
      product, 
      reviews, 
      relatedProducts,
      user: req.user || null 
    });
  } catch (err) {
    console.error('Error loading product:', err);
    res.status(404).render('404');
  }
});

// Cart routes
app.get('/cart', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId })
      .populate('items.productId');
    res.render('cart', { cart: cart || { items: [] }, user: req.user });
  } catch (err) {
    console.error('Error loading cart:', err);
    res.render('cart', { cart: { items: [] }, user: req.user });
  }
});

app.post('/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }

    const existingItem = cart.items.find(item => 
      item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
        price: product.price
      });
    }

    // Calculate total
    cart.totalAmount = cart.items.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );

    await cart.save();
    res.json({ success: true, message: 'Product added to cart' });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

app.put('/cart/update', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.find(item => 
      item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => 
        item.productId.toString() !== productId
      );
    } else {
      item.quantity = quantity;
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );

    await cart.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.delete('/cart/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (cart) {
      cart.items = cart.items.filter(item => 
        item.productId.toString() !== req.params.productId
      );
      
      cart.totalAmount = cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );
      
      await cart.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Checkout routes
app.get('/checkout', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId })
      .populate('items.productId');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const user = await User.findById(req.user.userId);
    res.render('checkout', { cart, user });
  } catch (err) {
    console.error('Error loading checkout:', err);
    res.redirect('/cart');
  }
});

app.post('/checkout/process', authenticateToken, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId })
      .populate('items.productId');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Generate order ID
    const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create order
    const order = new Order({
      orderId,
      userId: req.user.userId,
      items: cart.items.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.price,
        quantity: item.quantity,
        image: item.productId.images[0] || ''
      })),
      totalAmount: cart.totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'paid' // Simulating successful payment
    });

    await order.save();

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear cart
    await Cart.findOneAndDelete({ userId: req.user.userId });

    res.json({ success: true, orderId: order.orderId });
  } catch (err) {
    console.error('Error processing checkout:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Order routes
app.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.render('orders', { orders, user: req.user });
  } catch (err) {
    console.error('Error loading orders:', err);
    res.render('orders', { orders: [], user: req.user });
  }
});

app.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.orderId,
      userId: req.user.userId 
    });
    
    if (!order) {
      return res.status(404).render('404');
    }

    res.render('order-detail', { order, user: req.user });
  } catch (err) {
    console.error('Error loading order:', err);
    res.status(404).render('404');
  }
});

// Admin routes
app.get('/admin', authenticateAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'username email');

    res.render('admin/dashboard', {
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders,
      user: req.user
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.render('admin/dashboard', {
      stats: { totalProducts: 0, totalOrders: 0, totalUsers: 0, totalRevenue: 0 },
      recentOrders: [],
      user: req.user
    });
  }
});

app.get('/admin/products', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('admin/products', {
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      user: req.user
    });
  } catch (err) {
    console.error('Error loading admin products:', err);
    res.render('admin/products', { products: [], currentPage: 1, totalPages: 1, user: req.user });
  }
});

app.get('/admin/product/add', authenticateAdmin, (req, res) => {
  res.render('admin/add-product', { user: req.user, error: null });
});

app.post('/admin/product/add', authenticateAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, subcategory, brand, stock, featured, tags } = req.body;
    
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      subcategory,
      brand,
      images,
      stock: parseInt(stock),
      featured: featured === 'on',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await product.save();
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error adding product:', err);
    res.render('admin/add-product', { user: req.user, error: 'Failed to add product' });
  }
});

// Logout route
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

server.listen(3000, () => {
  console.log('E-commerce Server running on port 3000');
  console.log('Visit http://localhost:3000 to access the website');
});
