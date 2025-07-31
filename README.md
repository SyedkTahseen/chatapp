# ShopEasy - Modern E-commerce Website

A full-featured e-commerce website built with Node.js, Express, MongoDB, and EJS templating. Features a modern, responsive design with complete shopping cart functionality, user authentication, product management, and admin panel.

## 🌟 Features

### 🛍️ Customer Features
- **Product Browsing**: Browse products with filtering, sorting, and search functionality
- **Product Categories**: Organized product categories (Electronics, Clothing, Home & Garden, Sports, Books, etc.)
- **Shopping Cart**: Add/remove items, quantity management, real-time totals
- **User Authentication**: Secure registration and login with password validation
- **Checkout Process**: Complete checkout flow with shipping calculations
- **Order Management**: View order history and track order status
- **Product Reviews**: Read and write product reviews with ratings
- **Responsive Design**: Mobile-first responsive design works on all devices

### 👑 Admin Features
- **Product Management**: Add, edit, and delete products with image uploads
- **Order Management**: View and manage customer orders
- **User Management**: View registered users and their information
- **Dashboard Analytics**: Sales statistics and performance metrics
- **Image Upload**: Multi-image product gallery support

### 🔧 Technical Features
- **Modern UI/UX**: Clean, professional design with Font Awesome icons
- **Security**: Password hashing, JWT authentication, input validation
- **Performance**: Optimized database queries and image handling
- **SEO Friendly**: Semantic HTML structure and meta tags
- **Error Handling**: Comprehensive error handling and user feedback

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or cloud service)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas (cloud)
   - Update the connection string in `server.js` if needed
   - Default: `mongodb://localhost/ECommerceApp`

4. **Seed the database with sample data**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

6. **Access the website**
   - Open your browser and go to `http://localhost:3000`
   - The application will be running on port 3000

## 📋 Demo Accounts

The seeded database includes demo accounts for testing:

### Admin Account
- **Email**: admin@shopeasy.com
- **Password**: Admin123!
- **Access**: Full admin dashboard and product management

### User Account
- **Email**: john@example.com
- **Password**: Password123!
- **Access**: Regular customer features

## 🗂️ Project Structure

```
ecommerce-website/
├── server.js              # Main server file with Express routes
├── package.json            # Dependencies and scripts
├── views/                  # EJS templates
│   ├── index.ejs          # Homepage
│   ├── login.ejs          # User login page
│   ├── register.ejs       # User registration
│   ├── products.ejs       # Product catalog
│   ├── product-detail.ejs # Individual product page
│   ├── cart.ejs           # Shopping cart
│   ├── checkout.ejs       # Checkout process
│   ├── orders.ejs         # Order history
│   └── admin/             # Admin panel views
├── styles/                 # CSS stylesheets
│   └── main.css           # Main stylesheet
├── uploads/                # Product image uploads
├── scripts/                # Utility scripts
│   └── seedData.js        # Database seeding script
└── README.md              # This file
```

## 🛠️ Database Schema

### User Model
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  firstName: String,
  lastName: String,
  address: Object,
  phone: String
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  brand: String,
  images: [String],
  stock: Number,
  rating: Number,
  featured: Boolean,
  tags: [String],
  specifications: [Object]
}
```

### Order Model
```javascript
{
  orderId: String (unique),
  userId: ObjectId,
  items: [Object],
  totalAmount: Number,
  status: String,
  shippingAddress: Object,
  paymentStatus: String
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for production configuration:

```env
PORT=3000
MONGODB_URI=mongodb://localhost/ECommerceApp
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### MongoDB Setup
The application uses MongoDB for data storage. You can:

1. **Local MongoDB**: Install MongoDB locally and run `mongod`
2. **MongoDB Atlas**: Use the cloud service for production
3. **Docker**: Run MongoDB in a Docker container

## 🎨 Customization

### Styling
- Main styles are in `/styles/main.css`
- Modern CSS Grid and Flexbox layouts
- CSS variables for easy theme customization
- Mobile-first responsive design

### Categories
Add new product categories by:
1. Adding products with the new category
2. Updating category icons in the homepage
3. The system automatically detects and displays new categories

### Payment Integration
The checkout currently simulates payment processing. To integrate real payments:
1. Set up Stripe or PayPal accounts
2. Add payment processing in `/checkout/process` route
3. Update the frontend with payment forms

## 📱 Mobile Responsiveness

The website is fully responsive and optimized for:
- **Desktop**: Full-featured experience with hover effects
- **Tablet**: Optimized layouts and touch-friendly interfaces
- **Mobile**: Compact navigation and mobile-optimized forms

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure session management
- **Input Validation**: Server-side validation for all forms
- **XSS Protection**: EJS template escaping
- **File Upload Security**: Image type validation and size limits

## 🚀 Performance Optimizations

- **Database Indexing**: Optimized MongoDB queries
- **Image Optimization**: Compressed product images
- **Lazy Loading**: Images loaded on demand
- **Caching**: Browser caching for static assets
- **Pagination**: Efficient product loading

## 🧪 Testing

### Manual Testing
1. Register a new user account
2. Browse products and use filters
3. Add items to cart and checkout
4. Test admin features with admin account
5. Verify responsive design on different devices

### Test Data
The seed script creates:
- 2 test users (admin and regular user)
- 12 sample products across different categories
- Realistic product data with images and specifications

## 📦 Deployment

### Production Deployment
1. Set up production MongoDB instance
2. Configure environment variables
3. Update email settings for notifications
4. Set up file upload storage (AWS S3, etc.)
5. Configure reverse proxy (Nginx) if needed

### Heroku Deployment
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
git push heroku main
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the package.json file for details.

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```
Error: MongoDB connection error
```
- Ensure MongoDB is running on your system
- Check the connection string in server.js
- Verify MongoDB service is started

**Port Already in Use**
```
Error: listen EADDRINUSE :::3000
```
- Kill the process using port 3000: `kill -9 $(lsof -t -i:3000)`
- Or change the port in server.js

**File Upload Issues**
- Ensure the `uploads/` directory exists
- Check file permissions
- Verify file size limits

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the code comments for implementation details

## 🎯 Future Enhancements

- Real payment gateway integration (Stripe, PayPal)
- Product reviews and ratings system
- Wishlist functionality
- Advanced search with filters
- Email notifications for orders
- Social media login integration
- Multi-language support
- Advanced analytics dashboard
- Product recommendations
- Inventory management system

---

**Built with ❤️ using Node.js, Express, MongoDB, and modern web technologies.**

