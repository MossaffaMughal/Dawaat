# Dawaat - E-Commerce Platform

## Quick Start Guide

### What's Been Created

You now have a complete, production-ready PERN stack e-commerce website with:

#### ✅ Frontend (React)

- **Pages**: Home, Products, Product Details, Cart, Checkout, Contact, About
- **Admin Portal**: Dashboard, Product Management, Order Management
- **Features**:
  - Responsive design (mobile, tablet, desktop)
  - Shopping cart with local storage
  - User authentication
  - Admin-only access (2 emails: fatimalatif002@gmail.com, mossaffa.msm@gmail.com)
  - Beautiful UI with modern design

#### ✅ Backend (Node.js + Express)

- **API Endpoints**: Authentication, Products, Orders, Contacts
- **Database**: PostgreSQL with complete schema
- **Security**: JWT authentication, bcrypt password hashing
- **Features**:
  - Product management (CRUD operations)
  - Product images (up to 6 per product)
  - Order management
  - Contact form submissions

#### ✅ Database

- **Tables**: users, products, product_images, orders, order_items, cart, cart_items, contacts
- **Ready for**: PostgreSQL on Vercel, AWS RDS, Supabase, or local development

#### ✅ Deployment Ready

- **Vercel Configuration**: Both frontend and backend have vercel.json files
- **Environment Variables**: .env.example files provided
- **Documentation**: Deployment guide included

---

## How to Use This Project

### 1. Local Development Setup

#### Start Backend:

```bash
cd backend
npm install
# Copy .env.example to .env and fill in your database credentials
npm run migrate  # Run database migrations
npm run dev      # Start backend server (port 5000)
```

#### Start Frontend:

```bash
cd frontend
npm install
# Copy .env.example to .env and set REACT_APP_API_URL=http://localhost:5000/api
npm start        # Start frontend (port 3000)
```

### 2. Add Products

1. Signup/Login with one of the admin emails:
   - fatimalatif002@gmail.com
   - mossaffa.msm@gmail.com
2. Go to `/admin/products`
3. Add new products with:
   - Name, description, price, category, stock
   - Upload up to 6 images (you provide the images)

### 3. Manage Orders

1. View orders at `/admin/orders`
2. Update order status (pending → processing → shipped → delivered)
3. Delete orders if needed

### 4. Website Features

- **Home**: Hero section + Featured categories + Best sellers
- **Products**: Browse with category filters
- **Product Details**: Full product info with image gallery
- **Cart**: Add/remove products, manage quantities
- **Checkout**: Complete order form
- **Contact**: Contact form (messages visible in admin)
- **About**: Brand story

---

## Customization Guide

### Change Colors

Edit `frontend/src/styles/globals.css`:

```css
--primary-color: #8b5a5a; /* Brown */
--secondary-color: #ffc0cb; /* Pink */
```

### Update Contact Info

1. `frontend/src/components/Footer.js`
2. `frontend/src/pages/Contact.js`
3. `backend/.env` (ADMIN_EMAILS)

### Add/Remove Menu Items

Edit `frontend/src/components/Header.js` navigation section

### Change Product Categories

The system supports custom categories. Add them in the admin product form:

- Notebook (default)
- Bookmark (default)
- Custom categories work too!

---

## Important Files to Update

### Before Going Live:

1. **Backend .env**

   ```
   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
   JWT_SECRET (set to a unique value)
   FRONTEND_URL (your live frontend URL)
   ```

2. **Frontend .env**

   ```
   REACT_APP_API_URL=your-backend-url
   ```

3. **Admin Emails** (backend/.env)
   ```
   ADMIN_EMAILS=fatimalatif002@gmail.com,mossaffa.msm@gmail.com
   ```

---

## Database Information

The database includes these tables, automatically created by migrations:

- **users**: User accounts (isAdmin flag for admin access)
- **products**: Product catalog
- **product_images**: Product images (supports up to 6 per product)
- **orders**: Customer orders with status tracking
- **order_items**: Individual items in each order
- **cart**: Shopping cart sessions
- **cart_items**: Items in cart
- **contacts**: Contact form submissions

---

## Features Included

### Customer Features

✓ Browse products by category
✓ View detailed product information with images
✓ Add products to cart
✓ Manage cart (add, remove, update quantities)
✓ Checkout process
✓ Contact form
✓ Responsive design

### Admin Features

✓ Dashboard with statistics
✓ Product management (add, edit, delete)
✓ Product image management (up to 6 images)
✓ Order management
✓ Order status tracking
✓ View all orders
✓ Contact form submissions

---

## Deployment Steps

### For Vercel (Recommended)

1. Push to GitHub
2. Backend:
   - New Vercel project → Select backend folder
   - Add all .env variables
   - Deploy
3. Frontend:
   - New Vercel project → Select frontend folder
   - Set REACT_APP_API_URL to backend URL
   - Deploy

**See DEPLOYMENT.md for detailed instructions**

---

## Support & Contact

- **Email**: contact@dawaat.com
- **Phone**: 0326-4427474
- **WhatsApp**: Available (contact via number above)

---

## Project Structure

```
Dawaat/
├── backend/                 # Express server
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── db/             # Database migrations
│   │   └── server.js       # Express app
│   ├── package.json
│   ├── .env.example
│   └── vercel.json
│
├── frontend/                # React app
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── admin/          # Admin pages
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Cart & Auth context
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS files
│   │   ├── utils/          # Helper functions
│   │   ├── App.js          # Routing
│   │   └── index.js        # Entry point
│   ├── package.json
│   ├── .env.example
│   └── vercel.json
│
├── README.md               # Complete documentation
├── DEPLOYMENT.md           # Deployment guide
└── QUICK_START.md         # This file
```

---

## Next Steps

1. **Setup Database**: Create PostgreSQL database and run migrations
2. **Configure Environment Variables**: Update .env files
3. **Add Products**: Use admin portal to add your products
4. **Customize**: Update colors, store info, contact details
5. **Test Locally**: Run npm install & npm start in both folders
6. **Deploy**: Follow DEPLOYMENT.md guide

---

## Notes

- The website is fully responsive and mobile-optimized
- All code is production-ready
- Admin access is restricted to 2 specific emails
- Product images: You provide the image URLs (host on Cloudinary, AWS, etc.)
- The design is modern and fully customized for your brand

---

Good luck with your e-commerce platform! 🚀
