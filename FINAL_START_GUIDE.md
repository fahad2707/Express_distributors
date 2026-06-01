# 🚀 Final Start Guide - Complete Website

## ✅ Everything is Fixed and Ready!

### Step 1: Add Warehouse Banner Image (Optional but Recommended)

1. Save your warehouse image as: `frontend/public/warehouse-banner.jpg`
2. Or the banner will show a gradient fallback

### Step 2: Seed Database (Add 64 Products)

```bash
cd /Users/gb/Desktop/asif/backend
npm run seed
```

**Expected Output:**
```
✅ MongoDB connected successfully
✅ Default admin created
✅ Database seeded successfully
   - 8 categories created
   - 64 products created
```

### Step 3: Start the Website

```bash
cd /Users/gb/Desktop/asif
npm run dev
```

Wait for both servers to start (about 30 seconds).

### Step 4: Open Your Browser

Visit: **http://localhost:3000**

## 🎯 What You'll See

### Homepage Features:
- ✨ **Warehouse Banner**: Beautiful hero section with your warehouse image
- 🏷️ **Category Filter**: Click categories to filter products
- 🔍 **Search Bar**: Search products by name
- 🛍️ **Product Grid**: All 64 products displayed beautifully
- 🛒 **Add to Cart**: Hover over products or click button
- 📱 **Fully Responsive**: Works on all devices

### Complete Flow:
1. **Browse Products** → See all 64 products on homepage
2. **Filter by Category** → Click category buttons
3. **Search Products** → Use search bar
4. **Add to Cart** → Click "Add to Cart" (login required)
5. **View Cart** → Click cart icon in header
6. **Checkout** → Proceed to payment (Stripe required)
7. **View Orders** → See order history

## 🔑 Login Information

### Customer Login:
1. Go to: http://localhost:3000/login
2. Enter phone: `+1234567890` (any number)
3. Check **backend terminal** for OTP code
4. Enter OTP to login

### Admin Login:
- URL: http://localhost:3000/admin/login
- Email: `admin@edinc.com`
- Password: `Admin1234` (from seed; change after first login)

## 🛒 Complete Shopping Flow

### 1. Browse (No Login Required)
- Visit homepage
- See all products
- Filter by category
- Search products

### 2. Add to Cart (Login Required)
- Click "Add to Cart" on any product
- Will redirect to login if not logged in
- After login, can add products

### 3. View Cart
- Click cart icon (top right)
- See all items
- Adjust quantities
- Remove items

### 4. Checkout
- Click "Proceed to Checkout"
- Enter payment details (Stripe)
- Complete order
- Redirected to orders page

### 5. View Orders
- Click "Orders" in header
- See all your orders
- Track order status
- View order details

## ⚠️ Important Notes

### Stripe Setup (Optional):
- Website works without Stripe
- Checkout button will be disabled
- To enable: Add Stripe keys to `.env` files
- See `STRIPE_SETUP.md` for details

### Products Not Showing?
1. Make sure you ran `npm run seed` in backend folder
2. Check MongoDB connection in backend terminal
3. Refresh browser
4. Check browser console for errors

## 🎨 Design Features

- **Minimal & Professional**: Clean, modern design
- **Warehouse Banner**: Eye-catching hero section
- **Smooth Animations**: Hover effects, transitions
- **Fast Loading**: Optimized performance
- **Responsive**: Perfect on mobile, tablet, desktop
- **User-Friendly**: Intuitive navigation

## ✅ Success Checklist

- [ ] Database seeded (64 products)
- [ ] Website running (both servers)
- [ ] Can see products on homepage
- [ ] Can filter by categories
- [ ] Can search products
- [ ] Can add to cart (after login)
- [ ] Can view cart
- [ ] Can checkout (if Stripe configured)

## 🚀 You're All Set!

Your website is now:
- ✅ Fully functional
- ✅ Beautiful and professional
- ✅ Ready for customers
- ✅ Complete with all features

**Enjoy your amazing e-commerce website!** 🎉

---

## Deploying both frontend and backend on Vercel (Services)

### Pre-deploy checklist (quick)

| Check | Why |
|--------|-----|
| **Root directory** is repo root (`.`, `./`, or empty) — **not** `frontend` | So root `vercel.json` is used and both services deploy. |
| **`JWT_SECRET`** is a long random string (e.g. output of `openssl rand -hex 32`), **not** a command name | Wrong secret breaks **all** logins and admin tokens. |
| **`MONGODB_URI`** points at the DB that actually has your catalog | Empty/wrong DB ⇒ **no products**. |
| **`NEXT_PUBLIC_API_URL`** = `/express/api` (or rely on Vercel build default) | Browser + static `/site` must hit Express, not a broken `/api` proxy. |
| **Cloudinary** uses exact names: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Other names are ignored; uploads break. |
| **`FRONTEND_URL`** = your real public site URL (required if you use a **custom domain**; `*.vercel.app` is allowed even without it) | CORS + email links. |
| After env changes, **redeploy** | `prebuild` rewrites `public/site/index.html` with the API base. |
| **Admin in production** | `ensureDefaultAdmin` does **not** run in `NODE_ENV=production` unless `ALLOW_DEFAULT_ADMIN=true`. Create an admin by running **`npm run seed`** (or migrate) against the **same** Atlas DB as `MONGODB_URI`, or set `ALLOW_DEFAULT_ADMIN=true` once, log in, then remove it. |

Smoke test after deploy: `https://YOUR-APP.vercel.app/express/health` and `.../express/api/products`.

The repo includes **`experimentalServices`** in **`vercel.json`**: at the **repository root** (preferred), and a copy under **`frontend/vercel.json`** so Services still work if Vercel’s **Root Directory** is set to `frontend` (the backend entrypoint is `../backend` in that case). Prefer the **repository root** as the root directory and using only the root config.

1. **Create / import the project** on Vercel and set the **Framework Preset** to **Services** (not plain Next.js).
2. **Root directory (critical):** In Vercel → your project → **Settings** → **General** → **Root Directory**, use the **repository root**. The UI may show that as **empty**, **`.`**, or **`./`** — those are all the same (repo root). It must **not** be `frontend` or `backend`. If it points at a subfolder, Vercel never reads the root `vercel.json` and you get *“no services are declared”*.
3. **Repository root** is where `vercel.json` lives (same folder as the root `package.json` with workspaces).
4. **Environment variables** (set for *Production*, *Preview*, and *Development* as needed):

| Variable | Example | Purpose |
|----------|---------|--------|
| `NEXT_PUBLIC_API_URL` | `/express/api` | Browser + static `/site` calls hit the Express service (not Next’s `/api` proxy). **If you omit this on Vercel**, the build now defaults to `/express/api` so the storefront and admin still work—override if your API lives elsewhere. |
| `BACKEND_URL` | *(optional)* `https://YOUR-APP.vercel.app/express` | Next.js **server** proxy (`app/api/[[...path]]`) if you still use `/api` server-side; often optional if all clients use `NEXT_PUBLIC_API_URL`. |
| `MONGODB_URI` | Atlas connection string | Required on **both** services (or at least on the API service). |
| `JWT_SECRET` | strong random string | Backend auth. |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` | Backend CORS / redirects. |

5. **Do not** point `NEXT_PUBLIC_API_URL` at plain `/api` on this setup if you expect traffic to reach Express: Next.js already owns `/api` for its App Router proxy. Use **`/express/api`** as above.

6. **Services feature access**: Vercel documents **Services** as a product capability; if the dashboard blocks import, your team/plan may need Services enabled.

7. After changing env vars, **redeploy** so `prebuild` runs `inject-site-api.cjs` with the new `NEXT_PUBLIC_API_URL`.

### Deployed but no products / admin broken?

1. **Open** `https://YOUR-DEPLOYMENT.vercel.app/express/health` (JSON with `mongo.connected`) and `.../express/api/products` in the browser. If those fail, the API service is not running or routing is wrong (check **Root Directory** and **Services** preset). (`/health` is not under `/api` in this codebase.)
2. **`MONGODB_URI`** (and **`MONGODB_DB_NAME`** if you use it) must be set on the **API** service (or shared across services). An empty or wrong database returns **zero products** even when the API is up.
3. **Seed production** if needed: run `npm run seed` (or your import script) against the **same** Atlas cluster the deployed API uses.
4. **`JWT_SECRET`** must be set on the backend or logins and admin tokens will fail.
