# Vastu Bhandar (वस्तु भंडार)

> Multi-stakeholder e-commerce and community logistics orchestration platform tailored for organizational supplies, authentic uniform apparel (Ganvesh), literature, and ceremonial items.

**Production URL**: [https://panchp.in](https://panchp.in)  
**Tech Stack**: Laravel 11, Inertia.js, React 18, Tailwind CSS, PostgreSQL, Docker, Vite

---

## 📚 Project Documentation

- **[Product Requirements Document (PRD)](./PRD_DOCUMENT.md)** — Complete specification of features, user roles & RBAC matrix, database architecture, testing matrix (61 passing tests), and deployment specifications.
- **[User Manual & Feature Guide](./USER_MANUAL.md)** — Step-by-step user guide for Customers, Dealers, Delivery Partners, Karyakartas, and Administrators.
- **[Staging Environment Setup Guide (`dev.panchp.in`)](./STAGING_SETUP_GUIDE.md)** — Complete guide to setting up and deploying the isolated staging environment on AWS EC2 with BigRock DNS and free SSL.

---

## 🚀 Key Features

1. **Flexible Authentication & Dual Sign-In**:
   - Sign in using either registered Email or 10-digit Mobile Number in a clean 2-field form.
   - Public registration requiring only Mobile Number or Email (guaranteed `customer` role).
2. **Multi-Role RBAC & Governance**:
   - `superadmin`: Unrestricted global authority across all 6 administrative tiers (*Kshetra ➔ Prant ➔ Vibhag ➔ Jila ➔ Nagar ➔ Shakha*).
   - `admin`: Toli-scoped Karyakarta administrator restricted to their assigned geographical jurisdiction.
   - `dealer`: Inventory management, custom products, and one-time Shakha product batch generation.
   - `karyakarta`: Regional unit & toli management and order monitoring.
   - `delivery_partner`: OpenStreetMap GPS coordinate navigation and Cash on Delivery (COD) collection.
   - `customer`: Storefront catalog browsing, advanced unit search, cart, and COD order placement.
3. **Advanced Organizational Unit Search & Filtering**:
   - Filter products by unit hierarchy (*Nagar*, *Jila*, *Shakha*) or keyword (e.g., *"Madhav Nagar"*).
   - Filter for verified Karyakarta dealers only.
   - Product cards display dealer name, Karyakarta badge, and Toli affiliation.
   - One-click "My Nearest Unit" shortcut for authenticated users based on their default delivery location.
4. **Bulk User Import**:
   - Admin Excel/CSV spreadsheet import with automatic Toli role assignment and phone-number-based default credentials.
5. **Interactive Map Pinning**:
   - Leaflet + OpenStreetMap coordinate pinning for precision delivery to open community grounds.

---

## 🛠️ Local Development & Testing

```bash
# Install PHP & Node dependencies
composer install
npm install

# Run database migrations and seeders
php artisan migrate --seed

# Build frontend assets
npm run build    # or npm run dev for hot reload

# Run test suite (61 tests, 303 assertions)
php artisan test
```

---

## 📄 License

Proprietary community e-commerce platform. All rights reserved.
