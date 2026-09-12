# Vastu Bhandar (वस्तु भंडार) — User Manual & Feature Guide

Welcome to the **Vastu Bhandar (वस्तु भंडार)** platform user manual. This guide is designed to help customers, dealers, delivery partners, organizational karyakartas, and administrators navigate and utilize all features of the application effectively.

---

## 📖 Table of Contents
1. [Platform Overview & Key Highlights](#1-platform-overview--key-highlights)
2. [Language & Localization](#2-language--localization)
3. [User Roles & Access Levels](#3-user-roles--access-levels)
4. [Customer / Buyer Guide](#4-customer--buyer-guide)
   - [Registration & Login](#41-registration--login)
   - [Browsing & Searching Products](#42-browsing--searching-products)
   - [Managing Delivery Locations (Map Pinning)](#43-managing-delivery-locations-map-pinning)
   - [Shopping Cart & Checkout](#44-shopping-cart--checkout)
   - [Tracking Orders & Order Lifecycle](#45-tracking-orders--order-lifecycle)
   - [Order Cancellation & Returns](#46-order-cancellation--returns)
5. [Dealer Portal Guide](#5-dealer-portal-guide)
   - [Inventory & Product Management](#51-inventory--product-management)
   - [Category Management](#52-category-management)
   - [Managing Orders & Restock Confirmation](#53-managing-orders--restock-confirmation)
   - [Handling Customer Return Requests](#54-handling-customer-return-requests)
6. [Delivery Partner Guide](#6-delivery-partner-guide)
   - [Claiming Available Orders](#61-claiming-available-orders)
   - [Navigating to Delivery Addresses](#62-navigating-to-delivery-addresses)
   - [Updating Delivery Status](#63-updating-delivery-status)
7. [Karyakarta (Organization Management) Guide](#7-karyakarta-organization-management-guide)
   - [Organizational Hierarchy Overview](#71-organizational-hierarchy-overview)
   - [Managing Organizational Units (CRUD)](#72-managing-organizational-units-crud)
   - [Tracking Unit-Level Orders & Analytics](#73-tracking-unit-level-orders--analytics)
8. [System Administrator Guide](#8-system-administrator-guide)
   - [User Management](#81-user-management)
   - [Role-Based Access Control (RBAC) & Rights](#82-role-based-access-control-rbac--rights)
9. [Frequently Asked Questions (FAQ)](#9-frequently-asked-questions-faq)

---

## 1. Platform Overview & Key Highlights

**Vastu Bhandar (वस्तु भंडार)** is a specialized e-commerce and logistics management platform tailored for cultural, organizational, and community supplies (such as ceremonial dress/Ganvesh, philosophical literature, and musical Ghosh instruments).

### Key Architectural Highlights:
- **Bilingual Interface**: Seamless instant switching between English and Hindi.
- **Precise GPS Location Pinning**: Integrated Leaflet/OpenStreetMap coordinate picker to eliminate address confusion.
- **Hierarchical Organizational Mapping**: Native support for community structures (Kshetra ➔ Prant ➔ Vibhag ➔ Jila ➔ Nagar ➔ Shakha).
- **Multi-Role Workflows**: Distinct workspaces for Customers, Independent Dealers, Delivery Partners, Organizational Karyakartas, and System Admins.
- **Full Order Lifecycle Management**: Supports inventory reservation, Cash on Delivery (COD), Stripe online payments, automated restocking upon cancellation, and return request processing.

---

## 2. Language & Localization

You can switch the interface language at any time from anywhere on the platform:
1. Locate the language switch button in the **top navigation bar** (showing **"हिन्दी"** or **"English"** with a globe icon).
2. Click the button to toggle the language.
3. The platform instantly updates all navigation menus, forms, badges, status labels, buttons, and system messages into your selected language.

---

## 3. User Roles & Access Levels

| Role | Key Permissions | Workspace / Primary URL |
| :--- | :--- | :--- |
| **Customer** | Browse catalog, manage saved GPS addresses, place orders, track shipments, request returns/cancellations. | Storefront (`/`) |
| **Dealer** | Manage product inventory (SKUs, pricing, stock), manage categories, confirm restocks, resolve return requests. | Dealer Portal (`/dealer/products`) |
| **Delivery Partner** | View unassigned orders, claim delivery assignments, update delivery milestones (Out for Delivery, Delivered, Failed). | Delivery Dashboard (`/delivery/dashboard`) |
| **Karyakarta** | Manage 6-tier organizational structure (units), inspect orders affiliated with specific Shakhas/Nagars, review analytics. | Karyakarta Panel (`/karyakarta/dashboard`) |
| **Administrator** | Full system control: Manage users, activate/deactivate accounts, configure RBAC roles & permissions. | Admin Panel (`/admin/users`) |

---

## 4. Customer / Buyer Guide

### 4.1 Registration & Login
1. Click **"Sign In"** or **"Register"** in the top navigation bar.
2. Enter your Name, Email, Phone Number, and Password.
3. Upon registration, you are immediately authenticated as a **Customer** with full shopping and order privileges.
> **Note on Roles**: Public registration only allows the creation of Customer accounts. All specialized roles (*Dealers*, *Delivery Partners*, *Karyakartas*, and *Admins*) are assigned and managed directly by administrators via the Admin Panel (`/admin/users`).

### 4.2 Browsing & Searching Products
- **Homepage Catalog (`/`)**: Displays all active items grouped or filterable by category:
  - **Ganvesh (गणवेश)**: Ceremonial uniform sets, shirts, trousers, caps, belts.
  - **Books (पुस्तकें)**: Historical, philosophical, and moral literature.
  - **Ghosh (घोष)**: Authentic musical items (Aanaka drums, Vamshi flutes, Shankha).
- **Search Bar**: Search by product name, description keywords, or exact SKU.
- **Product Details (`/products/{id}`)**: Shows high-resolution imagery, pricing, remaining stock, verified dealer information, and COD eligibility.

### 4.3 Managing Delivery Locations (Map Pinning)
Accurate delivery requires precise GPS coordinates.
1. Go to **"Saved Locations" (`/locations`)** from the header dropdown.
2. Click **"Add New Location"**.
3. Fill in:
   - **Label**: (e.g., "Home", "Office", "Shakha Ground").
   - **Recipient Name & Phone Number**.
   - **Street Address, City, State, and Postal Code**.
4. **Interactive Map**:
   - An interactive Leaflet map allows you to click your exact physical location or drag the pin.
   - You can also click **"Use My Current Location"** to automatically detect your coordinates via GPS.
5. Check **"Set as Default Address"** if this is your primary address, then click **Save**.

### 4.4 Shopping Cart & Checkout
1. Click **"Add to Cart"** on any product card or details page.
2. Click the **Cart** icon in the navbar to open `/cart`.
3. Adjust item quantities using the `+` / `-` buttons, or remove items.
4. Click **"Proceed to Checkout" (`/checkout`)**.
5. Select your delivery address from your saved locations (or add a new one on the fly).
6. Choose your **Payment Method**:
   - **Cash on Delivery (COD)**: Pay when the delivery partner brings your parcel.
   - **Online Payment (Stripe)**: Pay securely using debit/credit card.
7. Click **"Place Order"**.

### 4.5 Tracking Orders & Order Lifecycle
- Navigate to **"My Orders" (`/orders`)**.
- Click **"View Details"** on any order to inspect:
  - Item breakdown and total amount.
  - Payment status (**Pending**, **Paid**, **Failed**).
  - Current delivery status:
    - 🟡 **Pending**: Order placed; awaiting dealer review/stock confirmation.
    - 🔵 **Confirmed / Processing**: Dealer packed the order; ready for pickup.
    - 🟣 **Out for Delivery**: Claimed by a delivery partner and currently en route.
    - 🟢 **Delivered**: Parcel received and verified.
    - 🔴 **Cancelled**: Order cancelled prior to delivery.

### 4.6 Order Cancellation & Returns
- **Order Cancellation**:
  - Customers can cancel an order directly from the Order Details page before it is marked as *Delivered*.
  - When cancelled, the ordered items are safely placed in restock-hold status for dealer verification.
- **Return Requests**:
  - For delivered orders eligible for return, click **"Request Return"** on the Order Details page.
  - Specify the reason (e.g., sizing mismatch, damaged item) and submit.
  - You can track whether the dealer has **Accepted**, **Rejected**, or **Fulfilled** your request.

---

## 5. Dealer Portal Guide

Dealers can supply and manage their own catalog inventory.

### 5.1 Inventory & Product Management
- Access the portal at **`/dealer/products`**.
- **Add Product (`/dealer/products/create`)**:
  - Enter Product Name, Category, SKU (Stock Keeping Unit), Price (₹), and Stock Quantity.
  - Add an Image URL and detailed description.
- **Edit / Delete**: Update stock levels or price anytime. Deleting an item removes it from public storefront display.

### 5.2 Category Management
- Navigate to **`/dealer/categories`**.
- Create, rename, or update category slugs, descriptions, and banner images.

### 5.3 Managing Orders & Restock Confirmation
- Visit **`/dealer/orders`** to see orders containing your products.
- Inspect recipient names, shipping addresses, and items ordered.
- **Restock Confirmation**: If a customer cancels an order, it appears in your restock alert queue. Click **"Confirm Restock"** to return those items back into your active available stock.

### 5.4 Handling Customer Return Requests
- Under **`/dealer/orders`**, customer return requests appear with the stated customer reason.
- Actions available to Dealer:
  - **Accept**: Approves the return request.
  - **Reject**: Declines the return request with explanation.
  - **Fulfill**: Confirms replacement delivery or refund completion.

---

## 6. Delivery Partner Guide

Delivery agents use the streamlined mobile-friendly partner dashboard.

### 6.1 Claiming Available Orders
1. Go to **`/delivery/dashboard`**.
2. Under **"Available Orders for Pickup"**, review pending deliveries.
3. Click **"Claim Order"** to assign the parcel to yourself.

### 6.2 Navigating to Delivery Addresses
1. Under **"My Active Deliveries"**, click on an assigned order.
2. View the recipient's phone number and the exact **Latitude & Longitude** coordinates selected by the customer on the map.
3. Click the map pin or address link to open direct directions in your GPS navigation app.

### 6.3 Updating Delivery Status
Update the delivery milestone in real-time:
- **Out for Delivery**: When the parcel is in transit.
- **Delivered**: When the parcel has been handed over and COD payment (if applicable) collected.
- **Failed / Returned**: If the recipient is unavailable or address is unreachable.

---

## 7. Karyakarta (Organization Management) Guide

The Karyakarta module facilitates regional community structure management and supply distribution analytics.

### 7.1 Organizational Hierarchy Overview
The platform supports a 6-tier administrative hierarchy:
```
1. Kshetra (क्षेत्र) - Zonal Region
   └── 2. Prant (प्रान्त) - State / Province Tier
       └── 3. Vibhag (विभाग) - Division Tier
           └── 4. Jila (जिला) - District Tier
               └── 5. Nagar (नगर) - City / Town Tier
                   └── 6. Shakha (शाखा) - Local Community Unit
```

### 7.2 Managing Organizational Units (CRUD)
- Go to **`/karyakarta/units`**.
- Select the tier (e.g., *Jila*, *Nagar*, or *Shakha*).
- **Add New Unit**: Enter unit name, code, and parent unit link (e.g., assign a new Nagar to its respective Jila).
- **Edit / Delete**: Maintain existing unit records.

### 7.3 Tracking Unit-Level Orders & Analytics
- Visit **`/karyakarta/dashboard`**.
- Inspect visual metrics:
  - Total community order count.
  - Gross merchandise value.
  - Orders grouped by Nagar and Shakha units to ensure remote units are well-supplied.

---

## 8. System Administrator Guide

Admins have holistic operational governance over the entire platform.

### 8.1 User Management (`/admin/users`)
- **View All Users**: Filter users by role (*Admin, Dealer, Delivery Partner, Karyakarta, Customer*) or account status (*Active / Suspended*).
- **Create User (`/admin/users/create`)**: Manually onboard personnel, assign telephone numbers, and designate roles.
- **Toggle Status**: Instantly enable or suspend access for any account with one click.
- **Edit / Delete Users**: Maintain user records and assign custom profile attributes.

### 8.2 Role-Based Access Control (RBAC) & Rights (`/admin/roles`)
- Access **"Roles & Rights"** under the Admin panel.
- Inspect system permissions (e.g., `products.create`, `orders.claim`, `units.manage`, `users.manage`).
- Create customized roles or adjust granular permission bindings for operational flexibility.

---

## 9. Frequently Asked Questions (FAQ)

**Q1: How do I switch languages?**
> Click on the language switcher button (**"हिन्दी"** / **"English"**) in the top navigation bar. Your selection is remembered throughout your session.

**Q2: Why does the address require a map pin?**
> Physical locations for community grounds, Shakhas, and rural delivery spots often lack formal street numbers. The interactive GPS map pin allows delivery agents to navigate directly to your exact coordinates.

**Q3: Can I change my delivery address after placing an order?**
> If your order is still in **Pending** status, contact customer support or cancel the order and place a new one with your updated address.

**Q4: How does Cash on Delivery (COD) work for delivery partners?**
> The delivery partner dashboard shows the exact order total. When handing over the items, collect the cash amount and mark the order status as **Delivered** in the dashboard.

**Q5: Who can add new Shakhas or Nagars to the system?**
> Users with the **Karyakarta** or **Administrator** role can add, modify, or reorganize units under the **Organizational Units** panel (`/karyakarta/units`).
