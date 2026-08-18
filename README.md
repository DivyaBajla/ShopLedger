# ShopLedger

> A lightweight financial reconciliation and accounting management
> system for small businesses.

ShopLedger is a full-stack web application designed to consolidate
day-to-day financial operations into one workspace. It brings together
sales, purchases, customers, vendors, payments, expenses, cash, bank/UPI
transactions, hotel billing, reconciliation, and financial reporting.

The project was built as an interview-focused MVP with an emphasis on a
working end-to-end workflow, a clean SaaS-style interface, and practical
financial reconciliation rather than a full ERP replacement.

------------------------------------------------------------------------

## Why ShopLedger?

Small businesses often maintain financial information across multiple
places:

-   Accounting software
-   Physical notebooks
-   Cash ledgers
-   Bank statements
-   UPI/digital payment records
-   Vendor payment records
-   Customer credit records
-   Daily hotel supply bills
-   Monthly hotel payments

This makes it difficult to answer simple questions such as:

-   How much did I sell today?
-   How much cash should I have?
-   How much money is pending from customers?
-   How much do I owe vendors?
-   How much has a hotel purchased this month?
-   How much has that hotel paid?
-   What is the remaining outstanding amount?
-   Which bank transactions have been reconciled?

ShopLedger brings these workflows into a single application.

------------------------------------------------------------------------

## Core Features

### Dashboard

Provides a financial overview including:

-   Today's sales
-   Today's purchases
-   Cash balance
-   Bank / UPI balance
-   Customer receivables
-   Vendor payables
-   Today's expenses
-   Recent transactions
-   Sales vs purchases overview

### Sales

-   Create sales invoices
-   Support multiple line items
-   Product selection
-   Quantity and rate
-   Discount and tax
-   Cash, UPI, bank transfer, card, and credit payment modes
-   Automatic customer receivable tracking for credit sales
-   Invoice/details view
-   Transaction history

### Purchases

-   Create purchase invoices
-   Multiple line items
-   Vendor selection
-   Quantity and rate
-   Discount and tax
-   Cash, UPI, bank transfer, and credit payment modes
-   Vendor payable tracking

### Customers

Track:

-   Retail customers
-   Hotel customers
-   Wholesale customers
-   Other customers

Customer information includes:

-   Name
-   Phone
-   Email
-   Address
-   Customer type
-   Opening balance
-   Credit information
-   Sales
-   Payments received
-   Outstanding balance

### Vendors

Track:

-   Vendor information
-   Purchases
-   Payments
-   Outstanding payables
-   Opening balances

### Products

Product records include:

-   Product name
-   SKU
-   Unit
-   Purchase price
-   Selling price
-   Tax rate
-   Current stock

### Payments

Supports customer receipts and vendor payments with:

-   Amount
-   Date
-   Payment mode
-   Reference number
-   Party association

### Expenses

Record business expenses with:

-   Date
-   Category
-   Description
-   Amount
-   Payment mode
-   Reference

### Cash Book

Tracks cash movement from:

-   Cash sales
-   Customer receipts
-   Vendor payments
-   Cash purchases
-   Expenses

### Bank / UPI

Provides visibility into digital transactions and supports bank
statement import workflows.

Expected bank statement fields include:

``` text
date
description
reference
debit
credit
```

### Bank Reconciliation

The reconciliation workflow is one of the key differentiators of
ShopLedger.

Imported bank transactions can be compared against recorded system
transactions using deterministic matching criteria such as:

-   Amount
-   Date proximity
-   Reference
-   Description
-   Customer/vendor information

Transactions can be classified as:

-   MATCHED
-   POSSIBLE_MATCH
-   UNMATCHED
-   DUPLICATE

The MVP intentionally uses deterministic reconciliation rules rather
than AI-based matching.

### Hotel Billing

Hotels are treated as customers with a monthly settlement workflow.

A hotel can receive goods through multiple daily bills and settle the
account later.

Example:

``` text
Hotel ABC

01 Aug   ₹8,500
02 Aug   ₹7,800
03 Aug   ₹9,200
...

Monthly sales       ₹25,500

Payments:
10 Aug               ₹10,000
25 Aug                ₹5,000

Outstanding          ₹10,500
```

The hotel workflow supports:

-   Hotel accounts
-   Daily hotel bills
-   Multi-item hotel bills
-   Payment history
-   Monthly sales
-   Payments received
-   Outstanding calculation
-   Monthly statements

The monthly statement follows:

``` text
Opening Balance
+ Daily Bills
- Payments
----------------
Closing Balance
```

### Reports

The application provides financial reporting views for areas such as:

-   Sales
-   Purchases
-   Expenses
-   Cash
-   Bank
-   Customer receivables
-   Vendor payables
-   Hotel statements
-   Tax/financial summaries

### CA / Tax Summary

The CA / Tax Summary is intended as an accountant-support report.

It summarizes recorded transactions such as:

-   Total sales
-   Cash sales
-   Digital sales
-   Credit sales
-   Total purchases
-   Expenses
-   Receivables
-   Payables
-   Cash balance
-   Bank balance
-   Monthly financial figures

> **Important:** ShopLedger is not an official income-tax filing system
> and does not replace professional tax advice. The financial summary is
> intended to support a CA/accountant.

### Authentication

The backend uses JWT-based authentication.

Supported roles include:

-   `ADMIN`
-   `STAFF`

Backend API endpoints are protected using authenticated requests.

------------------------------------------------------------------------

## Technology Stack

### Frontend

-   React
-   Vite
-   TypeScript
-   Tailwind CSS
-   React Router
-   Axios
-   Recharts
-   Lucide React

### Backend

-   Python
-   FastAPI
-   SQLAlchemy
-   Pydantic
-   Alembic
-   JWT authentication
-   Password hashing

### Database

-   PostgreSQL

### Infrastructure

-   Docker
-   Docker Compose

------------------------------------------------------------------------

## Architecture

``` text
┌──────────────────────────────┐
│        React + Vite          │
│      TypeScript Frontend     │
└──────────────┬───────────────┘
               │ REST / Axios
               ▼
┌──────────────────────────────┐
│          FastAPI             │
│        REST Backend          │
│                              │
│ Authentication              │
│ Business Operations         │
│ Financial Calculations      │
│ Reconciliation              │
└──────────────┬───────────────┘
               │ SQLAlchemy
               ▼
┌──────────────────────────────┐
│         PostgreSQL           │
│       Persistent Data        │
└──────────────────────────────┘
```

Docker Compose runs the three main services:

``` text
Frontend
Backend
PostgreSQL
```

------------------------------------------------------------------------

## Project Structure

``` text
ShopLedger/
│
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── deps.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.*
│
├── docker-compose.yml
├── sample_bank_statement.csv
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## Running the Application

### Prerequisites

Install:

-   Docker Desktop
-   Git

Docker Compose is included with current Docker Desktop installations.

Verify:

``` bash
docker --version
docker compose version
git --version
```

------------------------------------------------------------------------

## Run with Docker Compose

Clone the repository:

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ShopLedger
```

Start the application:

``` bash
docker compose up --build
```

The first build may take a few minutes because Docker needs to build the
frontend and backend images and pull PostgreSQL.

Once the containers are ready:

### Frontend

``` text
http://localhost:5173
```

### Backend API

``` text
http://localhost:8000
```

### PostgreSQL

``` text
localhost:5432
```

Stop the application:

``` bash
docker compose down
```

> Do not use `docker compose down -v` unless you intentionally want to
> remove the PostgreSQL volume and its stored data.

------------------------------------------------------------------------

## Environment Configuration

The Docker Compose configuration provides the required development
environment variables.

Typical backend configuration:

``` text
DATABASE_URL=postgresql+psycopg2://shopledger:shopledger@db:5432/shopledger
JWT_SECRET=<development-secret>
CORS_ORIGINS=http://localhost:5173
```

Frontend:

``` text
VITE_API_URL=http://localhost:8000/api
```

For real deployments:

-   Use a strong random JWT secret.
-   Store secrets outside Git.
-   Use environment-specific configuration.
-   Never commit `.env` files containing credentials or secrets.

------------------------------------------------------------------------

## Demo Data

The backend can initialize development/demo records when the database is
first created.

The seeded dataset includes examples such as:

### Customers

-   Retail Customer A
-   Retail Customer B
-   Hotel ABC
-   Hotel XYZ

### Vendors

-   Supplier A
-   Supplier B
-   Supplier C

### Products

-   Rice
-   Vegetables
-   Chicken
-   Oil
-   Packaging

This provides a starting point for testing the financial workflows.

For security, demo credentials should be treated as development-only
credentials and changed before any production deployment.

------------------------------------------------------------------------

## API Overview

The backend exposes REST endpoints under `/api`.

Representative endpoints include:

``` text
POST   /api/auth/login

GET    /api/dashboard

GET    /api/customers
POST   /api/customers
GET    /api/customers/{id}

GET    /api/vendors
POST   /api/vendors
GET    /api/vendors/{id}

GET    /api/products
POST   /api/products

GET    /api/sales
POST   /api/sales
GET    /api/sales/{id}

GET    /api/purchases
POST   /api/purchases
GET    /api/purchases/{id}

GET    /api/payments
POST   /api/payments

GET    /api/expenses
POST   /api/expenses

GET    /api/hotels
GET    /api/hotels/{id}
GET    /api/hotels/{id}/statement

GET    /api/cash-book

GET    /api/bank-transactions
POST   /api/bank-transactions/import

POST   /api/reconciliation/run

GET    /api/reports/sales
GET    /api/reports/purchases
GET    /api/reports/expenses
GET    /api/reports/receivables
GET    /api/reports/payables

GET    /api/reports/tax-summary
```

------------------------------------------------------------------------

## Financial Workflow

### Credit Sale

``` text
Sale Created
     │
     ▼
Customer Receivable
     │
     ▼
Payment Received
     │
     ▼
Outstanding Reduced
```

### Credit Purchase

``` text
Purchase Created
     │
     ▼
Vendor Payable
     │
     ▼
Vendor Payment
     │
     ▼
Outstanding Reduced
```

### Hotel Account

``` text
Daily Hotel Bills
        │
        ▼
Monthly Sales
        │
        ▼
Payments Received
        │
        ▼
Outstanding Balance
        │
        ▼
Monthly Statement
```

### Bank Reconciliation

``` text
Bank Statement
      │
      ▼
Import Transactions
      │
      ▼
Compare with System Transactions
      │
      ├── MATCHED
      ├── POSSIBLE_MATCH
      ├── UNMATCHED
      └── DUPLICATE
```

------------------------------------------------------------------------

## Data and Financial Safety

Financial values are represented using decimal/numeric database types
rather than relying on floating-point storage for monetary amounts.

The backend validates:

-   Positive transaction amounts
-   Positive quantities
-   Valid product/customer/vendor references
-   Valid payment modes
-   Required invoice information

Database-backed financial operations are performed through SQLAlchemy
transactions.

------------------------------------------------------------------------

## Testing

Backend tests are located under:

``` text
backend/tests/
```

Run the backend test suite inside the backend environment/container as
appropriate:

``` bash
pytest
```

For an interview/demo verification, the recommended end-to-end flow is:

``` text
Login
  ↓
Create/View Customer
  ↓
Create/View Product
  ↓
Create Multi-item Sale
  ↓
Open Invoice Details
  ↓
Receive Payment
  ↓
Check Customer Outstanding
  ↓
Create Hotel Bill
  ↓
Record Hotel Payment
  ↓
Open Monthly Hotel Statement
  ↓
Check Reconciliation / Reports
```

------------------------------------------------------------------------

## Design Goals

ShopLedger was designed around five principles:

1.  **Simple transaction entry**\
    Common financial operations should require minimal steps.

2.  **Reconciliation-first workflow**\
    The system should help connect recorded transactions with actual
    cash and bank activity.

3.  **Practical hotel settlement**\
    Daily hotel supply billing and monthly settlement are treated as a
    first-class workflow.

4.  **Clear financial visibility**\
    Receivables, payables, cash, bank, and expenses should be visible
    from a single workspace.

5.  **Interview-ready UX**\
    The application uses a modern SaaS-style interface with responsive
    layouts, cards, tables, charts, modals, and clear financial
    summaries.

------------------------------------------------------------------------

## Scope

ShopLedger is an MVP and is intentionally not a complete ERP or
accounting replacement.

It does not attempt to provide:

-   Official income-tax filing
-   Full GST compliance automation
-   Payroll
-   Multi-company accounting
-   Advanced accounting standards
-   Mobile applications
-   WhatsApp integrations
-   AI-based reconciliation
-   Enterprise-grade multi-tenant infrastructure

The focus is the core financial workflow and reconciliation experience.

------------------------------------------------------------------------

## Security Notes

Before deploying outside a local/demo environment:

-   Replace the development JWT secret.
-   Do not commit `.env` files.
-   Use strong passwords.
-   Use production database credentials.
-   Configure HTTPS.
-   Restrict CORS origins.
-   Review authentication and authorization rules.
-   Use managed secrets/environment variables.
-   Back up the PostgreSQL database.

------------------------------------------------------------------------

## Author

**Divya Bajla**

Built as a full-stack interview project demonstrating:

-   Frontend development
-   REST API design
-   Database modeling
-   Authentication
-   Financial workflow implementation
-   Reconciliation logic
-   Dockerized application setup
-   Product-oriented UI/UX

------------------------------------------------------------------------

## License

This project was developed as an interview/demo application.

If this repository is shared privately for evaluation, please treat the
source code as confidential and do not redistribute it without
permission.
