const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/ECommerceApp', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define schemas
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

// Create models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@shopeasy.com',
    password: 'Admin123!',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  },
  {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'Password123!',
    role: 'user',
    firstName: 'John',
    lastName: 'Doe'
  }
];

const sampleProducts = [
  // Electronics
  {
    name: 'iPhone 15 Pro',
    description: 'The latest iPhone with advanced A17 Pro chip, titanium design, and professional camera system.',
    price: 999.99,
    category: 'Electronics',
    subcategory: 'Smartphones',
    brand: 'Apple',
    images: ['/uploads/iphone15pro.jpg'],
    stock: 50,
    rating: 4.8,
    numReviews: 245,
    featured: true,
    tags: ['smartphone', 'ios', 'titanium', 'professional'],
    specifications: [
      { key: 'Display', value: '6.1-inch Super Retina XDR' },
      { key: 'Chip', value: 'A17 Pro' },
      { key: 'Storage', value: '128GB' },
      { key: 'Camera', value: '48MP Main, 12MP Ultra Wide, 12MP Telephoto' }
    ]
  },
  {
    name: 'MacBook Pro 14"',
    description: 'Powerful laptop with M3 chip, perfect for professionals and creative workflows.',
    price: 1999.99,
    category: 'Electronics',
    subcategory: 'Laptops',
    brand: 'Apple',
    images: ['/uploads/macbook-pro-14.jpg'],
    stock: 25,
    rating: 4.9,
    numReviews: 189,
    featured: true,
    tags: ['laptop', 'professional', 'm3', 'retina'],
    specifications: [
      { key: 'Chip', value: 'Apple M3' },
      { key: 'Memory', value: '8GB unified memory' },
      { key: 'Storage', value: '512GB SSD' },
      { key: 'Display', value: '14.2-inch Liquid Retina XDR' }
    ]
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android smartphone with S Pen, advanced cameras, and AI features.',
    price: 1199.99,
    category: 'Electronics',
    subcategory: 'Smartphones',
    brand: 'Samsung',
    images: ['/uploads/galaxy-s24-ultra.jpg'],
    stock: 40,
    rating: 4.7,
    numReviews: 312,
    featured: true,
    tags: ['smartphone', 'android', 's-pen', 'camera'],
    specifications: [
      { key: 'Display', value: '6.8-inch Dynamic AMOLED 2X' },
      { key: 'Processor', value: 'Snapdragon 8 Gen 3' },
      { key: 'RAM', value: '12GB' },
      { key: 'Storage', value: '256GB' }
    ]
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling wireless headphones with premium sound quality.',
    price: 399.99,
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'Sony',
    images: ['/uploads/sony-wh1000xm5.jpg'],
    stock: 75,
    rating: 4.6,
    numReviews: 428,
    featured: false,
    tags: ['headphones', 'wireless', 'noise-canceling', 'premium'],
    specifications: [
      { key: 'Driver', value: '30mm' },
      { key: 'Battery Life', value: '30 hours' },
      { key: 'Connectivity', value: 'Bluetooth 5.2' },
      { key: 'Weight', value: '250g' }
    ]
  },

  // Clothing
  {
    name: 'Nike Air Max 270',
    description: 'Comfortable lifestyle sneakers with visible Max Air cushioning.',
    price: 150.00,
    category: 'Clothing',
    subcategory: 'Shoes',
    brand: 'Nike',
    images: ['/uploads/nike-air-max-270.jpg'],
    stock: 100,
    rating: 4.4,
    numReviews: 567,
    featured: true,
    tags: ['sneakers', 'casual', 'air-max', 'comfort'],
    specifications: [
      { key: 'Material', value: 'Synthetic and textile' },
      { key: 'Sole', value: 'Rubber' },
      { key: 'Closure', value: 'Lace-up' },
      { key: 'Size Range', value: 'US 6-14' }
    ]
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight-leg jeans, the original and the best.',
    price: 89.99,
    category: 'Clothing',
    subcategory: 'Jeans',
    brand: 'Levi\'s',
    images: ['/uploads/levis-501-jeans.jpg'],
    stock: 80,
    rating: 4.5,
    numReviews: 234,
    featured: false,
    tags: ['jeans', 'classic', 'denim', 'straight-leg'],
    specifications: [
      { key: 'Fit', value: 'Straight' },
      { key: 'Material', value: '100% Cotton' },
      { key: 'Wash', value: 'Medium Blue' },
      { key: 'Waist Sizes', value: '28-42' }
    ]
  },

  // Home & Garden
  {
    name: 'Dyson V15 Detect',
    description: 'Powerful cordless vacuum with laser detection and advanced filtration.',
    price: 749.99,
    category: 'Home & Garden',
    subcategory: 'Appliances',
    brand: 'Dyson',
    images: ['/uploads/dyson-v15-detect.jpg'],
    stock: 30,
    rating: 4.8,
    numReviews: 156,
    featured: true,
    tags: ['vacuum', 'cordless', 'laser', 'powerful'],
    specifications: [
      { key: 'Suction Power', value: '230 AW' },
      { key: 'Battery Life', value: 'Up to 60 minutes' },
      { key: 'Bin Capacity', value: '0.77 liters' },
      { key: 'Weight', value: '3.0 kg' }
    ]
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-use pressure cooker that combines 7 kitchen appliances in one.',
    price: 99.99,
    category: 'Home & Garden',
    subcategory: 'Kitchen',
    brand: 'Instant Pot',
    images: ['/uploads/instant-pot-duo.jpg'],
    stock: 60,
    rating: 4.7,
    numReviews: 1234,
    featured: false,
    tags: ['pressure-cooker', 'multi-use', 'kitchen', 'cooking'],
    specifications: [
      { key: 'Capacity', value: '6 Quart' },
      { key: 'Functions', value: '7-in-1' },
      { key: 'Material', value: 'Stainless Steel' },
      { key: 'Dimensions', value: '13.43 x 12.2 x 12.8 inches' }
    ]
  },

  // Sports
  {
    name: 'Peloton Bike+',
    description: 'Premium indoor cycling bike with rotating HD touchscreen and live classes.',
    price: 2495.00,
    category: 'Sports',
    subcategory: 'Fitness Equipment',
    brand: 'Peloton',
    images: ['/uploads/peloton-bike-plus.jpg'],
    stock: 15,
    rating: 4.6,
    numReviews: 89,
    featured: true,
    tags: ['exercise-bike', 'indoor-cycling', 'fitness', 'premium'],
    specifications: [
      { key: 'Screen', value: '23.8" HD rotating touchscreen' },
      { key: 'Resistance', value: 'Magnetic' },
      { key: 'Dimensions', value: '59" L x 23" W x 53" H' },
      { key: 'Weight', value: '140 lbs' }
    ]
  },
  {
    name: 'Wilson Pro Staff Tennis Racket',
    description: 'Professional-grade tennis racket used by top players worldwide.',
    price: 249.99,
    category: 'Sports',
    subcategory: 'Tennis',
    brand: 'Wilson',
    images: ['/uploads/wilson-pro-staff.jpg'],
    stock: 45,
    rating: 4.5,
    numReviews: 78,
    featured: false,
    tags: ['tennis', 'racket', 'professional', 'wilson'],
    specifications: [
      { key: 'Head Size', value: '97 sq in' },
      { key: 'Weight', value: '315g' },
      { key: 'String Pattern', value: '16x19' },
      { key: 'Grip Size', value: '4 1/4 - 4 5/8' }
    ]
  },

  // Books
  {
    name: 'The Psychology of Money',
    description: 'Timeless lessons on wealth, greed, and happiness by Morgan Housel.',
    price: 16.99,
    category: 'Books',
    subcategory: 'Finance',
    brand: 'Harriman House',
    images: ['/uploads/psychology-of-money.jpg'],
    stock: 120,
    rating: 4.7,
    numReviews: 456,
    featured: false,
    tags: ['finance', 'psychology', 'money', 'bestseller'],
    specifications: [
      { key: 'Author', value: 'Morgan Housel' },
      { key: 'Pages', value: '256' },
      { key: 'Publisher', value: 'Harriman House' },
      { key: 'Language', value: 'English' }
    ]
  },
  {
    name: 'Atomic Habits',
    description: 'An easy and proven way to build good habits and break bad ones.',
    price: 18.99,
    category: 'Books',
    subcategory: 'Self-Help',
    brand: 'Avery',
    images: ['/uploads/atomic-habits.jpg'],
    stock: 95,
    rating: 4.8,
    numReviews: 892,
    featured: true,
    tags: ['self-help', 'habits', 'productivity', 'bestseller'],
    specifications: [
      { key: 'Author', value: 'James Clear' },
      { key: 'Pages', value: '320' },
      { key: 'Publisher', value: 'Avery' },
      { key: 'ISBN', value: '978-0735211292' }
    ]
  }
];

async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return { ...user, password: hashedPassword };
      })
    );

    await User.insertMany(usersWithHashedPasswords);
    console.log(`Created ${usersWithHashedPasswords.length} users`);

    // Create products
    await Product.insertMany(sampleProducts);
    console.log(`Created ${sampleProducts.length} products`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Admin Login:');
    console.log('Email: admin@shopeasy.com');
    console.log('Password: Admin123!');
    console.log('\n👤 User Login:');
    console.log('Email: john@example.com');
    console.log('Password: Password123!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seed function
seedDatabase();