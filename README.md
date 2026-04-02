# Dawaat E-Commerce Platform

A complete PERN stack (PostgreSQL, Express, React, Node.js) e-commerce website with admin portal, optimized for Vercel deployment.

## Features

### Customer Features

- **Home Page**: Eye-catching hero section with featured categories
- **Product Catalog**: Browse products by category
- **Product Details**: View detailed product information with up to 6 images
- **Shopping Cart**: Add/remove products with quantity management
- **Checkout**: Complete checkout process with delivery options
- **Contact**: Get in touch with the store
- **About**: Learn about Dawaat brand

### Admin Features

- **Admin Dashboard**: View order and revenue statistics
- **Product Management**: Add, edit, delete products with images
- **Order Management**: View, update, and delete customer orders
- **Authentication**: Login-based access with email verification (only 2 emails allowed)

## Tech Stack

### Backend

- **Node.js & Express**: REST API server
- **PostgreSQL**: Database
- **JWT**: Authentication
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin requests

### Frontend

- **React**: UI library
- **React Router**: Navigation
- **Axios**: HTTP client
- **Context API**: State management (Cart, Auth)

## Project Structure

```
Dawaat/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   ├── package.json
│   ├── .env.example
│   └── vercel.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── admin/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── .env.example
│   └── vercel.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### Backend Setup

1. Navigate to backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create .env file (copy from .env.example):

   ```bash
   cp .env.example .env
   ```

4. Update .env with your database credentials and JWT secret

5. Run migrations:

   ```bash
   npm run migrate
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create .env file (copy from .env.example):

   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Admin Access

Only the following emails have admin access:

- fatimalatif002@gmail.com
- mossaffa.msm@gmail.com

## Vercel Deployment

### Backend Deployment

1. Push your backend code to GitHub
2. Create a new project on Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Frontend Deployment

1. Push your frontend code to GitHub
2. Create a new project on Vercel
3. Set `REACT_APP_API_URL` to your backend API URL
4. Deploy

## Database Schema

### Tables

- **users**: User accounts with admin flag
- **products**: Product information
- **product_images**: Product images (up to 6 per product)
- **cart**: User cart sessions
- **cart_items**: Items in cart
- **orders**: Customer orders
- **order_items**: Items in orders
- **contacts**: Contact form submissions

## API Endpoints

### Auth

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Products (Admin)

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `POST /api/products/images/add` - Add product image (admin)
- `DELETE /api/products/images/:imageId` - Delete product image (admin)

### Orders (Admin)

- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/:id` - Get order by ID (admin)
- `PUT /api/orders/:id/status` - Update order status (admin)
- `DELETE /api/orders/:id` - Delete order (admin)

### Contacts (Admin)

- `POST /api/contacts` - Submit contact form
- `GET /api/contacts` - Get all contacts (admin)
- `DELETE /api/contacts/:id` - Delete contact (admin)

## Customization

### Change Brand Colors

Edit `/frontend/src/styles/globals.css`:

```css
:root {
  --primary-color: #8b5a5a; /* Change this */
  --secondary-color: #ffc0cb;
  /* ... */
}
```

### Add Products

Use the admin portal (/admin/products) to add products with images

### Modify Contact Information

Update contact details in:

- `frontend/src/components/Footer.js`
- `frontend/src/pages/Contact.js`
- `backend/.env`

## Responsive Design

All pages are fully responsive for:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (480px - 767px)
- Small Mobile (<480px)

## Support

For issues or questions, contact:

- Email: nigarishpk@gmail.com
- Phone: 0326-4427474

## License

ISC
