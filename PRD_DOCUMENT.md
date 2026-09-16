# Product Requirements Document (PRD)
## Project: Vastu Bhandar (वस्तु भंडार) — E-Commerce & Community Logistics Platform
**Domain / Live URL**: `https://panchp.in`  
**Document Version**: 1.4 (Advanced Organizational Unit Search & Filtering Edition)  
**Target Audience**: QA Engineers, Developers, Product Managers, System Administrators  
**File Location**: Project Root (`PRD_DOCUMENT.md`)  
**Last Updated**: September 2026  

---

## 1. Executive Summary & Platform Overview

**Vastu Bhandar (वस्तु भंडार)** is a multi-stakeholder e-commerce and logistics orchestration ecosystem engineered specifically for community, cultural, and organizational supplies (such as ceremonial uniforms/Ganvesh, philosophical literature, and musical Ghosh instruments).

The platform bridges certified manufacturers/suppliers (**Dealers**), regional organizational units (**Karyakartas**), field logistics personnel (**Delivery Partners**), and retail buyers (**Customers**), governed by a centralized **System Administrator**.

### Core Technical & Design Principles:
1. **Frictionless Mobile-First Onboarding**: Flexible registration requiring only mobile number or email; sign-in using either identifier in a clean 2-field form.
2. **Bulk Field Onboarding**: Admin-level spreadsheet import (.xlsx / .csv) with automatic Toli role assignment and phone-number-based default credentials.
3. **Cross-Database Case-Insensitive Catalog Search**: Unified search logic ensuring consistent behavior across local SQLite and production PostgreSQL instances.
4. **Automated Inventory Initialization**: One-time generation of the 23 standard Shakha products for verified dual-role (Dealer + Karyakarta) accounts.
5. **Precision GPS Logistics**: OpenStreetMap / Leaflet coordinate-based drop-off pinning to serve rural locations and open community grounds.
6. **Hierarchical Governance**: 6-tier administrative structure (*Kshetra ➔ Prant ➔ Vibhag ➔ Jila ➔ Nagar ➔ Shakha*).
7. **Strict Security**: Global input sanitization against XSS/HTML injection and granular Role-Based Access Control (RBAC).

---

## 2. User Roles & Permission Matrix

| Role Identifier | Display Name | Landing Route | Description & Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **`customer`** | Customer (ग्राहक) | `/` (Storefront) | Default public role. Browses catalog, pins GPS address, manages cart, places COD/Online orders, tracks delivery, cancels orders, requests returns. |
| **`dealer`** | Dealer (विक्रेता) | `/dealer/products` | Certified supplier. Manages inventory, adds/edits SKUs, fulfills orders, processes restocks on cancellations, accepts/rejects return requests. |
| **`karyakarta`** | Karyakarta (कार्यकर्ता) | `/karyakarta/dashboard` | Regional coordinator across 6 administrative tiers. Manages organizational units and tolis, views jurisdiction orders and distribution metrics. |
| **`delivery_partner`** | Delivery Partner (वितरण साथी) | `/delivery/dashboard` | Field courier. Claims unassigned orders, navigates via GPS coordinates, updates milestone statuses, and collects Cash on Delivery payments. |
| **`admin`** | Toli Admin (टोली प्रशासक) | `/admin/users` | Scoped Karyakarta administrator belonging to an organizational toli (Shakha, Nagar, Jila, Vibhag, or Kshetra). Has administrative control strictly scoped to the users, units, and resources within their toli's jurisdiction. Cannot manage superadmins or access outside units. |
| **`superadmin`** | Super Admin (मुख्य व्यवस्थापक) | `/admin/users` | Platform owner with unrestricted global authority. Manages users across all jurisdictions, manages system roles & permissions matrix (`/admin/roles`), performs imports, and configures system-wide settings. |

> [!NOTE]
> **Toli Administrator Eligibility**: The `admin` role is strictly reserved for Karyakartas who belong to an organizational toli (`shakha toli`, `nagar toli`, `jila toli`, `vibhag toli`, or `kshetra toli`). Non-toli accounts (e.g. basic customers) cannot be granted the `admin` role without assigning a toli jurisdiction or toli membership.
>
> **Dual-Role Combination (Dealer + Karyakarta)**: Users holding both `dealer` and `karyakarta` roles are granted inventory management privileges with an exclusive one-time button to populate all 23 standard Shakha products into their catalog.

---

## 3. Detailed Feature Specifications & Acceptance Criteria

### Module 1: Authentication & Flexible Registration

#### 1.1 Dual-Identifier Sign-In (`/login`)
- **UI Design**: The login screen maintains exactly **two** input fields:
  1. `User ID` (Label: *Email Address or Mobile Number / ईमेल या मोबाइल नंबर*)
  2. `Password` (Label: *Password / पासवर्ड*)
- **Behavior**:
  - The system accepts an email address (e.g. `user@example.com`), a 10-digit mobile number (`9876543210`), or phone numbers with country code/formatting (`+91 98765-43210`, `09876543210`).
  - Lookup is case-insensitive for email addresses.
  - For phone numbers, spaces, hyphens, parentheses, and leading `+91` / `0` prefixes are normalized and matched against stored numbers.
- **Acceptance Criteria**:
  - `AC-AUTH-01`: User can authenticate using their registered email and password.
  - `AC-AUTH-02`: User can authenticate using their 10-digit mobile number and password.
  - `AC-AUTH-03`: User can authenticate using mobile number formatted with `+91` or spaces.
  - `AC-AUTH-04`: Inactive or suspended accounts (`status = 'inactive'|'suspended'`) are blocked from logging in with an appropriate error message.

#### 1.2 Flexible Sign-Up (`/register`)
- **Policy**: Public registration strictly and exclusively provisions accounts with the `customer` role. Specialized roles can only be granted by the Administrator.
- **Validation Rules**:
  - Full Name: Required, max 255 characters, sanitized against HTML tags.
  - Email: Optional if Mobile Number is provided; required if Mobile Number is empty. Must be valid email format and unique when present.
  - Mobile Number: Optional if Email is provided; required if Email is empty. Must contain at least 10 digits and be unique when present.
  - Password & Confirmation: Required, minimum 8 characters.
- **Acceptance Criteria**:
  - `AC-AUTH-05`: Registration succeeds when providing Mobile Number only (email left blank).
  - `AC-AUTH-06`: Registration succeeds when providing Email only (phone left blank).
  - `AC-AUTH-07`: Registration fails with validation error if neither Email nor Mobile Number is provided.
  - `AC-AUTH-08`: Role submitted in payload is disregarded; user is guaranteed `customer` role.

---

### Module 2: Admin User Management & Spreadsheet Import

#### 2.1 User Management & Multi-Role Assignment (`/admin/users`)
- Administrators can search users by name, email, or phone number, filter by role (including dedicated tabs for `Superadmin`, `Dealer`, `Customer`, `Karyakarta`, `Delivery Partner`, `Admin`), toggle active/inactive status, and configure organizational jurisdictions.
- **Superadmin Authority**: The `superadmin` role has unrestricted global authority across all 6 administrative tiers and all system modules. Only superadmins can access `/admin/roles` (Roles & Rights Matrix), onboard/modify other superadmins, or view users across the entire nation.
- **Toli-Scoped Admin Role**: The `admin` role is an organizational administrator role exclusively available to Karyakartas who belong to an organizational toli (`shakha toli`, `nagar toli`, `jila toli`, `vibhag toli`, or `kshetra toli`). All administrative actions (user management, organizational units, orders) are strictly bounded to the geographical jurisdiction of their assigned toli. Toli admins cannot view, edit, or delete superadmin accounts, nor can they manage resources outside their toli boundaries.
- **Toli Admin Assignment Validation**: Assigning the `admin` role requires that the target user has an organizational unit assigned, holds a toli karyakarta role, or has explicit toli membership checkboxes checked (`is_shakha_toli_member`, `is_nagar_toli_member`, `is_jila_toli_member`, `is_vibhag_toli_member`, `is_kshetra_toli_member`). Attempts to assign `admin` to unaffiliated customers are strictly rejected.
- **Customer to Dealer Promotion**: Administrators can edit any customer account and assign the `dealer` role using 1-click **Quick Role Shortcuts** (`Make Dealer (विक्रेता बनाएं)`), the Primary Role selector (`🏪 Dealer (विक्रेता / डीलर)`), or the Multi-Role checkboxes.
- **Mobile-Only User Editing**: Supports editing accounts registered without email (mobile only) without encountering email required validation errors.
- **System Role Guarantee**: Core roles (`superadmin`, `admin`, `dealer`, `customer`, `delivery_partner`, `karyakarta`) are guaranteed via automated database migrations and seeders.
- Users can be assigned multiple roles simultaneously (e.g., `dealer` + `jila_karyakarta`).

#### 2.2 Bulk User Import via Excel (.xlsx) / CSV (`/admin/users/import`)
- **Endpoint**: `POST /admin/users/import` (File upload up to 5MB, accepts `.xlsx` and `.csv`).
- **Template Download**: `GET /admin/users/import-template` provides a pre-formatted template with UTF-8 BOM.
- **Template Columns**:
  1. `name`: Full name of the user (Mandatory).
  2. `mobile`: 10-digit contact mobile number (Mandatory).
  3. `Is Shakha Toli Member`: `Yes` / `No` (or `1` / `0`).
  4. `Is Nagar Toli Member`: `Yes` / `No` (or `1` / `0`).
  5. `Is Jila Toli Member`: `Yes` / `No` (or `1` / `0`).
- **Processing Logic**:
  - **Password Default**: The account password is automatically hashed from the user's raw mobile number.
  - **Role Resolution**:
    - If `Is Jila Toli Member` = Yes ➔ Assigns `jila_karyakarta` role.
    - If `Is Nagar Toli Member` = Yes ➔ Assigns `nagar_karyakarta` role.
    - If `Is Shakha Toli Member` = Yes ➔ Assigns `shakha_karyakarta` role.
    - If any Toli flag is affirmative, base role is set to `karyakarta`.
    - If no Toli flags are affirmative, defaults to `customer` role.
  - **Update vs. Create**: If a user with the mobile number already exists, their name and roles are updated without altering their existing password.
- **Acceptance Criteria**:
  - `AC-IMP-01`: Admin can download the sample CSV template with appropriate headers.
  - `AC-IMP-02`: Uploading valid CSV or Excel file creates new users with password = mobile number.
  - `AC-IMP-03`: Toli membership flags correctly assign corresponding Karyakarta roles.
  - `AC-IMP-04`: Rows with invalid mobile numbers (< 10 digits) or missing names are safely reported as errors without failing the entire batch.

---

### Module 3: Catalog, Search & Shakha Products

#### 3.1 Case-Insensitive Product Search (`/`)
- The storefront search query matches against `Product.name`, `Product.description`, and `Product.sku`.
- Search queries are converted to lowercase using SQL `LOWER()` across all database adapters (SQLite in local testing and PostgreSQL on AWS EC2 production).
- **Acceptance Criteria**:
  - `AC-CAT-01`: Searching for "dhwaj", "DHWAJ", or "DhWaJ" returns identical search results.
  - `AC-CAT-02`: Searching for SKU with lowercase "flg-lrg" correctly matches product with SKU "FLG-LRG-01".

#### 3.2 Dual-Role Dealer + Karyakarta Shakha Products Generator
- **Location**: Dealer Inventory page (`/dealer/products`).
- **Eligibility**: User must hold **both** `dealer` AND `karyakarta` roles.
- **One-Time Facility**:
  - When eligible and not yet executed (`has_seeded_shakha_products == false`), a prominent "Create All Shakha Products (शाखा उत्पाद जोड़ें)" button is displayed.
  - Clicking triggers `POST /dealer/products/seed-shakha`.
  - Exactly 23 official Shakha products are inserted into the dealer's catalog.
  - The user profile flag `has_seeded_shakha_products` is set to `true`.
  - Once generated, the button permanently disappears from the interface.
- **Acceptance Criteria**:
  - `AC-SHK-01`: Button is visible only to users holding both Dealer and Karyakarta roles.
  - `AC-SHK-02`: Clicking generates all 23 products and redirects with confirmation message.
  - `AC-SHK-03`: Button disappears immediately after products are generated.
  - `AC-SHK-04`: Subsequent POST attempts are rejected with error message preventing duplication.

#### 3.3 Official Shakha Products Master Catalog

| # | Product Name (उत्पाद का नाम) | Category | SKU | Price (₹) | Default Stock |
| :-: | :--- | :--- | :--- | :-: | :-: |
| 1 | Shakha Dhwaj (Large) / शाखा ध्वज (बड़ा) | Shakha & Ganvesh | `SHK-FLG-LRG` | ₹150.00 | 0 |
| 2 | Shakha Dhwaj (Medium) / शाखा ध्वज (मध्यम) | Shakha & Ganvesh | `SHK-FLG-MED` | ₹100.00 | 0 |
| 3 | Bal Pant 24 / बाल पैंट 24 | Shakha & Ganvesh | `SHK-PNT-BAL24` | ₹330.00 | 0 |
| 4 | Bal Pant 26 / बाल पैंट 26 | Shakha & Ganvesh | `SHK-PNT-BAL26` | ₹350.00 | 0 |
| 5 | Bal Pant 28 / बाल पैंट 28 | Shakha & Ganvesh | `SHK-PNT-BAL28` | ₹370.00 | 0 |
| 6 | Tarun Pant 30 / तरुण पैंट 30 | Shakha & Ganvesh | `SHK-PNT-TRN30` | ₹400.00 | 0 |
| 7 | Tarun Pant 32 / तरुण पैंट 32 | Shakha & Ganvesh | `SHK-PNT-TRN32` | ₹420.00 | 0 |
| 8 | Tarun Pant 34 / तरुण पैंट 34 | Shakha & Ganvesh | `SHK-PNT-TRN34` | ₹440.00 | 0 |
| 9 | Tarun Pant 36 / तरुण पैंट 36 | Shakha & Ganvesh | `SHK-PNT-TRN36` | ₹470.00 | 0 |
| 10 | Socks Bal / मोजे (बाल) | Shakha & Ganvesh | `SHK-SOX-BAL` | ₹60.00 | 0 |
| 11 | Socks Tarun / मोजे (तरुण) | Shakha & Ganvesh | `SHK-SOX-TRN` | ₹70.00 | 0 |
| 12 | Shirt 30 / शर्ट 30 | Shakha & Ganvesh | `SHK-SHR-30` | ₹260.00 | 0 |
| 13 | Shirt 32 / शर्ट 32 | Shakha & Ganvesh | `SHK-SHR-32` | ₹280.00 | 0 |
| 14 | Shirt 34 / शर्ट 34 | Shakha & Ganvesh | `SHK-SHR-34` | ₹300.00 | 0 |
| 15 | Shirt 36 / शर्ट 36 | Shakha & Ganvesh | `SHK-SHR-36` | ₹320.00 | 0 |
| 16 | Cap / टोपी | Shakha & Ganvesh | `SHK-CAP-STD` | ₹80.00 | 0 |
| 17 | Shoes / जूते | Shakha & Ganvesh | `SHK-SHO-STD` | ₹350.00 | 0 |
| 18 | Langot / लंगोट | Shakha & Ganvesh | `SHK-LNG-STD` | ₹60.00 | 0 |
| 19 | Belt / बेल्ट | Shakha & Ganvesh | `SHK-BLT-STD` | ₹75.00 | 0 |
| 20 | Dand / दण्ड | Shakha & Ganvesh | `SHK-DND-STD` | ₹70.00 | 0 |
| 21 | Vest / बनियान | Shakha & Ganvesh | `SHK-VST-STD` | ₹80.00 | 0 |
| 22 | Knicker / निकर | Shakha & Ganvesh | `SHK-KNC-STD` | ₹150.00 | 0 |
| 23 | Whistle / सीटी | Shakha & Ganvesh | `SHK-WHS-STD` | ₹40.00 | 0 |

#### 3.4 Advanced Organizational Unit (Toli / Karyakarta Dealer) Search & Filtering
- **Problem Solved**: On the storefront catalog, multiple dealers may offer identical products (e.g. Ganvesh uniforms, literature), making it challenging for customers to identify and purchase from their local regional Karyakarta dealer or nearest organizational unit.
- **Hierarchical Unit Filtering**:
  - **Unit Type Dropdown**: Filter catalog by organizational level (`All Units`, `Nagar`, `Jila`, `Shakha`).
  - **Specific Unit Picker**: Dynamically populates with Nagars, Jilas, or Shakhas based on the selected unit type.
  - **Free-Text Unit Search**: Accepts organizational unit names (e.g., "Madhav", "Madhav Nagar", "Badrinath Jila") with intelligent keyword normalization that strips unit stop-words (`nagar`, `jila`, `shakha`, `toli`) for precise database matching.
  - **1-Click "My Nearest Unit" Shortcut**: Authenticated customers with a saved default delivery address or organizational profile can instantly apply their local unit filter with a single click (e.g., `📍 My Nearest Unit: Madhav Nagar`).
  - **Karyakarta / Toli Dealers Only Toggle**: Allows customers to view exclusively products supplied by verified Karyakarta or Toli member dealers.
  - **Active Filter Chips & Clear All**: Provides visual chips for active search terms, categories, and unit filters with 1-click removal and a "Clear Filters" reset button.
- **Omni-Search Integration**:
  - The storefront header search bar matches product title, SKU, description, dealer name, and dealer's organizational unit (Nagar, Jila, Shakha), allowing unified searching (e.g., searching "Madhav" or "Madhav Ganvesh").
- **Product Card & Details Affiliation Badges**:
  - Every storefront product card displays the Dealer's name (`Store` icon), a `⭐ Karyakarta` badge (for verified Karyakarta dealers), and an organizational toli badge (`🏛️ Nagar Toli (Madhav)`) or location badge (`📍 Madhav Nagar`).
  - The single product details page (`/products/{id}`) renders a detailed dealer card including toli membership, business name, and full geographical jurisdiction hierarchy.
- **Acceptance Criteria**:
  - `AC-CAT-03`: Filtering by Nagar (e.g., "Madhav") displays only products from dealers assigned to Madhav Nagar or Shakhas under Madhav Nagar.
  - `AC-CAT-04`: Searching for "Madhav Nagar" in unit search or main search correctly matches dealers assigned to Madhav Nagar regardless of case or spacing.
  - `AC-CAT-05`: Filtering by Jila (e.g., "Badrinath") displays products from dealers directly in Badrinath Jila and all Nagars/Shakhas under Badrinath Jila.
  - `AC-CAT-06`: Enabling "Karyakarta Dealers Only" filters out non-karyakarta commercial dealers.
  - `AC-CAT-07`: Product cards display clear visual indicators for dealer name, karyakarta dealer status, and toli affiliation.

---

### Module 4: Delivery Location Pinning & GPS Coordinates

- **Routes**: `GET /locations`, `POST /locations`, `PUT /locations/{id}`, `DELETE /locations/{id}`
- **Interactive Map**: Integrates Leaflet + OpenStreetMap tiles. Users drag the marker or tap "Use Current Location" to store `latitude` and `longitude`.
- **Logistics Use**: Delivery partners can click the direct coordinate link in their dashboard to open turn-by-turn navigation in Google Maps / Apple Maps.
- **Cart & Checkout Navigation**: Both the top action bar and the bottom of the address list provide quick direct links to "Go to Cart" (`/cart`) and "Proceed to Checkout" (`/checkout`), allowing seamless navigation without having to click the top navbar icon.
- **Acceptance Criteria**:
  - `AC-LOC-01`: Saved delivery locations store valid latitude/longitude coordinates.
  - `AC-LOC-02`: Default location is automatically pre-selected at checkout.
  - `AC-LOC-03`: Address management screen displays convenient "Go to Cart" and "Proceed to Checkout" buttons.

---

### Module 5: Cart, Checkout & Payment Workflow

- **Routes**: `GET /cart`, `POST /cart/add/{product}`, `PUT /cart/update/{product}`, `DELETE /cart/remove/{product}`, `GET /checkout`, `POST /orders`
- **Frictionless Cart Navigation**:
  - Storefront catalog hero search includes a prominent "Go to Cart" action with a real-time item counter.
  - Each product card in the catalog includes a "Go to Cart" button right next to the "Add to Cart" button.
  - The Product Detail page (`/products/{id}`) includes a prominent "Go to Cart (कार्ट देखें)" action adjacent to the "Add to Cart" button.
  - The Checkout page (`/checkout` — Step 1: Select Delivery Location) features a top "Go Back to Cart" link, a "Go to Cart" shortcut in the address selection section header, and a prominent "Go to Cart" button placed directly below the "Confirm & Place Order" button in the Order Summary.
- **Supported Payment Modes**:
  - **Cash on Delivery (COD)**: Order created as `pending`, payment status `pending`.
  - **Online / Card**: Order created as `confirmed`, payment status `paid`.
- **Inventory Reservation**: Placing an order atomically decrements product inventory.
- **Acceptance Criteria**:
  - `AC-CHECK-01`: Cannot order more quantity than available in active stock.
  - `AC-CHECK-02`: Multi-dealer items can be checked out in a unified cart.
  - `AC-CHECK-03`: "Go to Cart" buttons are positioned alongside "Add to Cart" on product cards/detail view, and alongside address selection and "Confirm & Place Order" on the checkout page.

---

### Module 6: Order Lifecycle, Cancellation & Restock System

#### State Transition Flow:
```
[Placed: Pending] ────> [Confirmed / Processing] ────> [Out for Delivery] ────> [Delivered]
       │
       └─ (Customer Cancels) ─> [Cancelled: restock_needed = true]
                                        │
                                        └─ (Dealer Confirms Physical Receipt) ─> [Stock Restored]
```
- **Acceptance Criteria**:
  - `AC-ORD-01`: Customer can cancel an order as long as status is not `delivered`.
  - `AC-ORD-02`: Cancellation before dispatch restores stock automatically. Cancellation after dispatch sets `restock_needed = true`, requiring dealer confirmation.
  - `AC-ORD-03`: Dealer clicks "Confirm Restock" in `/dealer/orders` to verify receipt and restock.

---

### Module 7: Return Requests & RMA Resolution

- **Routes**: `POST /orders/{order}/return-request`, `POST /dealer/return-requests/{id}/accept|reject|fulfill`
- **Acceptance Criteria**:
  - `AC-RET-01`: Customer can submit return requests only for orders with status `delivered`.
  - `AC-RET-02`: Dealer can accept, reject (with mandatory reason), or fulfill return tickets.
  - `AC-RET-03`: Once the return request fulfilled, the Ordser gets cancelled and stock gets restored.
---

### Module 8: Delivery Partner Logistics Dashboard

- **Routes**: `GET /delivery/dashboard`, `POST /delivery/claim/{order}`, `PUT /delivery/status/{order}`
- **Acceptance Criteria**:
  - `AC-DEL-01`: Unassigned orders appear in the pickup queue.
  - `AC-DEL-02`: Claiming an order locks it to the delivery partner.
  - `AC-DEL-03`: Partner updates delivery milestones (`processing` ➔ `out_for_delivery` ➔ `delivered`) and records COD cash collection.

---

### Module 9: Karyakarta 6-Tier Organizational Hierarchy

#### Hierarchy Architecture:
```
1. Kshetra (क्षेत्र - Zonal)
   └── 2. Prant (प्रान्त - State)
       └── 3. Vibhag (विभाग - Division)
           └── 4. Jila (जिला - District)
               └── 5. Nagar (नगर - City/Town)
                   └── 6. Shakha (शाखा - Local Community Unit)
```
- **Jurisdiction Scoping**: Karyakartas assigned to a specific tier (e.g. Jila Badrinath) can only view orders, toli members, and sub-units within their designated territory.
- **Acceptance Criteria**:
  - `AC-ORG-01`: Sub-units strictly cascade from their parent unit.
  - `AC-ORG-02`: Karyakarta dashboard aggregates volume and order counts within their jurisdiction.

---

### Module 10: Responsive Navigation & Mobile UI Architecture

- **Desktop Experience (>= 1024px)**:
  - **Zero Horizontal Overflow**: Header width is strictly bound with `max-w-7xl`, `flex-shrink-0` on branding and action groups, and `overflow-x-hidden` on layout root.
  - **Organized Role-Based Dropdowns**: Consolidates 11+ role-specific links into compact, color-coded dropdown menus:
    - **Admin Menu (Purple)**: User Management (`/admin/users`), Roles & Rights (`/admin/roles` for superadmins).
    - **Karyakarta Menu (Orange)**: Dashboard (`/karyakarta/dashboard`), Org Units & Tolis (`/karyakarta/units`).
    - **Dealer Menu (Amber)**: Inventory (`/dealer/products`), Categories (`/dealer/categories`), Orders (`/dealer/orders`).
    - **Delivery Agent (Emerald)**: Direct link to Delivery Panel (`/delivery`).
  - **Always-Visible Logout & Profile**: Quick direct Logout icon button in the header bar and a rich user dropdown with avatar, role badge, personal orders, saved locations, and full logout action.
- **Mobile Experience (< 1024px)**:
  - **Slide-in Drawer Sheet**: Accessible via a prominent hamburger toggle button with backdrop blur.
  - **User Profile Header**: Displays user avatar, name, email/phone, and active role badge (e.g. `SUPERADMIN`, `TOLI ADMIN`).
  - **Bilingual Switcher**: Tap to seamlessly toggle between Hindi (🇮🇳) and English (🇬🇧).
  - **Categorized Sections**: General catalog & account links, followed by role-specific management panels.
  - **Dedicated Mobile Logout**: Full-width high-contrast logout button at the base of the drawer.
- **Acceptance Criteria**:
  - `AC-NAV-01`: All navigation links and administrative panels are fully visible and accessible on mobile screen viewports.
  - `AC-NAV-02`: Desktop view for superadmin never produces horizontal scrollbars, and the logout option is permanently visible.
  - `AC-NAV-03`: Menus automatically close on route changes or outside clicks.

---

## 4. QA Verification & Test Scenario Reference Matrix

All 61 automated tests are verified and passing:

| Test ID | Scenario | Verification Method / Expected Outcome | Test Suite |
| :--- | :--- | :--- | :--- |
| **TC-ADM-01** | Superadmin Global Jurisdiction Scope | Superadmin can access and edit accounts across all jurisdictions | `AdminUserManagementTest.php` |
| **TC-ADM-02** | Customer to Dealer Promotion | Admin assigns `dealer` role to customer with phone only | `AdminUserManagementTest.php` |
| **TC-ADM-03** | Toli Admin Scoped Jurisdiction Enforcement | Toli Admin restricted to users/units in their assigned Toli | `AdminUserManagementTest.php` |
| **TC-ADM-04** | Toli Admin Cannot Manage Superadmin | Toli Admin cannot view, edit, or delete Superadmin accounts | `AdminUserManagementTest.php` |
| **TC-ADM-05** | Admin Role Requires Toli Membership | Assigning `admin` without toli affiliation fails validation | `AdminUserManagementTest.php` |
| **TC-ADM-06** | Admin Role Assigned with Toli Flag | Karyakarta with `is_*_toli_member` flag promoted to Admin successfully | `AdminUserManagementTest.php` |
| **TC-ADM-07** | Shakha Product Initial Stock is 0 | All 23 authentic Shakha products initialize with `stock = 0` | `AdminUserManagementTest.php` |
| **TC-AUTH-01** | Dual Sign-In: 10-digit mobile number | User authenticates with mobile number in `email` field | `AuthTest.php` |
| **TC-AUTH-02** | Dual Sign-In: Formatted `+91 98765-43210` | Normalizes formatting and authenticates successfully | `AuthTest.php` |
| **TC-AUTH-03** | Dual Sign-In: Registered email address | Authenticates successfully | `AuthTest.php` |
| **TC-AUTH-04** | Flexible Registration: Mobile only | Account created with phone, email `null`, role `customer` | `AuthTest.php` |
| **TC-AUTH-05** | Flexible Registration: Email only | Account created with email, phone `null`, role `customer` | `AuthTest.php` |
| **TC-AUTH-06** | Flexible Registration: Omit both | Fails validation with errors on `email` and `phone` | `AuthTest.php` |
| **TC-AUTH-07** | Privilege Escalation Defense | Submitting `role=admin` on `/register` is forced to `customer` | `AuthTest.php` |
| **TC-CAT-01** | Case-Insensitive Search: Lowercase | `/?search=dhwaj` finds "Shakha Dhwaj Flag Large" | `ProductCrudTest.php` |
| **TC-CAT-02** | Case-Insensitive Search: Uppercase | `/?search=DHWAJ` finds "Shakha Dhwaj Flag Large" | `ProductCrudTest.php` |
| **TC-CAT-03** | Case-Insensitive Search: Mixed case | `/?search=sHaKhA` finds "Shakha Dhwaj Flag Large" | `ProductCrudTest.php` |
| **TC-CAT-04** | Case-Insensitive Search: SKU | `/?search=flg-lrg` finds "FLG-LRG-01" | `ProductCrudTest.php` |
| **TC-CAT-05** | Organizational Unit Filter: Nagar / Jila | `/?org_unit_type=nagar&org_unit_id=1` or `/?org_unit_search=Madhav` matches only unit dealers | `ProductCrudTest.php` |
| **TC-CAT-06** | Karyakarta Dealers Filter | `/?only_karyakarta=1` excludes commercial dealers, shows only Karyakartas | `ProductCrudTest.php` |
| **TC-IMP-01** | Template CSV Download | Streams `users_import_template.csv` with Toli headers & BOM | `AdminUserManagementTest.php` |
| **TC-IMP-02** | Bulk User CSV Import | Creates users with password = mobile number and Toli roles | `AdminUserManagementTest.php` |
| **TC-SHK-01** | Shakha Product Batch Seed: Initial | Creates 23 official Shakha items, sets `has_seeded_shakha_products` | `AdminUserManagementTest.php` |
| **TC-SHK-02** | Shakha Product Batch Seed: Duplicate | Second call rejected with error, prevents duplicate items | `AdminUserManagementTest.php` |
| **TC-SEC-01** | XSS Sanitization: Registration inputs | Rejects `<script>` and HTML injection with 422 error | `SecuritySanitizationTest.php` |
| **TC-SEC-02** | XSS Sanitization: Profile business name | Rejects `<img>` tags with validation error | `SecuritySanitizationTest.php` |
| **TC-I18N-01** | Bilingual Language Switch | Switches between `hi` and `en` without session drop | `LanguageSwitcherTest.php` |
| **TC-CART-01** | Cart Stock Validation & COD Checkout | Atomic decrement of inventory on order placement | `CartAndCheckoutTest.php` |
| **TC-ORD-01** | Customer Order Cancellation | Sets `cancelled`, triggers dealer restock workflow | `OrderCancellationAndRestockTest.php` |
| **TC-RET-01** | Return Request Workflow | Allowed only on `delivered` orders; dealer can accept/reject | `ReturnPolicyWorkflowTest.php` |
| **TC-DEL-01** | Delivery Partner Order Claim | Locks order to partner; milestones logged with timestamps | `DeliveryPartnerWorkflowTest.php` |
| **TC-ORG-01** | 6-Tier Hierarchy Cascade | Kshetra ➔ Prant ➔ Vibhag ➔ Jila ➔ Nagar ➔ Shakha integrity | `KaryakartaOrganizationUnitsTest.php` |
| **TC-RBAC-01** | Role & Jurisdiction Enforcement | Jila Karyakarta restricted to their assigned district | `RoleAndPermissionRbacTest.php` |

---

## 5. Non-Functional & Production Deployment Specifications

1. **Docker Container Stack**:
   - `web`: Nginx 1.25 Alpine serving compiled Vite assets and proxying PHP requests.
   - `app`: PHP 8.2-FPM Alpine with OPcache, BCMath, GD, ZipArchive, and PDO PostgreSQL.
   - `db`: PostgreSQL 15 Alpine with persistent volume.
   - `redis`: Redis 7 Alpine for session cache and queue management.
2. **Security Headers**:
   - `X-Frame-Options: SAMEORIGIN`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - HTTPS enforced via Let's Encrypt / Certbot SSL.
3. **Health Check**:
   - Dedicated endpoint at `GET /up` returning HTTP 200 OK.
4. **Staging Environment Architecture (`dev.panchp.in`)**:
   - **Subdomain**: `https://dev.panchp.in`
   - **Complete Data & Process Isolation**: Dedicated Docker compose stack (`docker-compose.staging.yml`), isolated PostgreSQL database (`ecommerce_staging_db`), separate Redis cache prefix (`vastu_staging_cache_*`), and isolated file storage (`storage_staging_uploads`).
   - **Host Reverse Proxy**: Nginx on Ubuntu host routes `panchp.in` -> Port 8080 and `dev.panchp.in` -> Port 8081 with automated Let's Encrypt SSL.
   - **Dedicated Deployment Script**: `./deploy-staging.sh` with automated zero-downtime container builds, queue restarts, and cache optimization.
   - **Setup Reference**: Detailed operational instructions maintained in [`STAGING_SETUP_GUIDE.md`](./STAGING_SETUP_GUIDE.md).

