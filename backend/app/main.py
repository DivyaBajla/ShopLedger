from datetime import date, datetime, timedelta
from decimal import Decimal
from io import BytesIO
import csv
import math

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .models import *
from .schemas import *
from .security import hash_password, verify_password, create_token
from .deps import current_user, admin_only


app = FastAPI(
    title="ShopLedger API",
    version="1.0.0"
)

origins = [
    x.strip()
    for x in __import__(
        "app.config",
        fromlist=["settings"]
    ).settings.cors_origins.split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Base.metadata.create_all(bind=engine)


# ============================================================
# SERIALIZATION
# ============================================================

def ser(obj):
    d = {
        c.name: getattr(obj, c.name)
        for c in obj.__table__.columns
    }

    for k, v in d.items():
        if isinstance(v, Decimal):
            d[k] = float(v)
        elif isinstance(v, (date, datetime)):
            d[k] = v.isoformat()

    return d


# ============================================================
# BALANCES
# ============================================================

def balances(db):
    cash_sales = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(Sale.payment_mode == "CASH")
        .scalar()
        or 0
    )

    cash_receipts = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.transaction_type == "RECEIPT",
            Payment.payment_mode == "CASH"
        )
        .scalar()
        or 0
    )

    cash_pays = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.transaction_type == "PAYMENT",
            Payment.payment_mode == "CASH"
        )
        .scalar()
        or 0
    )

    cash_exp = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.payment_mode == "CASH")
        .scalar()
        or 0
    )

    cash_purchases = (
        db.query(func.coalesce(func.sum(Purchase.total_amount), 0))
        .filter(Purchase.payment_mode == "CASH")
        .scalar()
        or 0
    )

    bank_sales = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(
            Sale.payment_mode.in_(
                ["UPI", "BANK_TRANSFER", "CARD"]
            )
        )
        .scalar()
        or 0
    )

    bank_receipts = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.transaction_type == "RECEIPT",
            Payment.payment_mode.in_(
                ["UPI", "BANK_TRANSFER", "CARD"]
            )
        )
        .scalar()
        or 0
    )

    bank_pays = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.transaction_type == "PAYMENT",
            Payment.payment_mode.in_(
                ["UPI", "BANK_TRANSFER", "CARD"]
            )
        )
        .scalar()
        or 0
    )

    bank_exp = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            Expense.payment_mode.in_(
                ["UPI", "BANK_TRANSFER", "CARD"]
            )
        )
        .scalar()
        or 0
    )

    bank_purchases = (
        db.query(func.coalesce(func.sum(Purchase.total_amount), 0))
        .filter(
            Purchase.payment_mode.in_(
                ["UPI", "BANK_TRANSFER", "CARD"]
            )
        )
        .scalar()
        or 0
    )

    receivables = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(
            Sale.payment_status.in_(["DUE", "PARTIAL"])
        )
        .scalar()
        or 0
    ) - (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.transaction_type == "RECEIPT")
        .scalar()
        or 0
    )

    credit_sales = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(Sale.payment_mode == "CREDIT")
        .scalar()
        or 0
    )

    receipts = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.transaction_type == "RECEIPT")
        .scalar()
        or 0
    )

    credit_purchases = (
        db.query(func.coalesce(func.sum(Purchase.total_amount), 0))
        .filter(Purchase.payment_mode == "CREDIT")
        .scalar()
        or 0
    )

    vendor_pay = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.transaction_type == "PAYMENT")
        .scalar()
        or 0
    )

    return {
        "cash": float(
            cash_sales
            + cash_receipts
            - cash_pays
            - cash_exp
            - cash_purchases
        ),
        "bank": float(
            bank_sales
            + bank_receipts
            - bank_pays
            - bank_exp
            - bank_purchases
        ),
        "receivables": float(
            max(0, credit_sales - receipts)
        ),
        "payables": float(
            max(0, credit_purchases - vendor_pay)
        )
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ============================================================
# AUTH
# ============================================================

@app.post("/api/auth/register", response_model=Token)
def register(
    p: UserCreate,
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.email == p.email).first():
        raise HTTPException(
            409,
            "Email already registered"
        )

    u = User(
        name=p.name,
        email=p.email,
        password_hash=hash_password(p.password),
        role=p.role.upper()
    )

    db.add(u)
    db.commit()
    db.refresh(u)

    return {
        "access_token": create_token(u.id),
        "user": ser(u)
    }


@app.post("/api/auth/login", response_model=Token)
def login(
    p: Login,
    db: Session = Depends(get_db)
):
    u = (
        db.query(User)
        .filter(User.email == p.email)
        .first()
    )

    if not u or not verify_password(
        p.password,
        u.password_hash
    ):
        raise HTTPException(
            401,
            "Invalid email or password"
        )

    return {
        "access_token": create_token(u.id),
        "user": ser(u)
    }


@app.get("/api/auth/me")
def me(user=Depends(current_user)):
    return ser(user)


# ============================================================
# GENERIC CRUD HELPER
# ============================================================

def crud_list(model, db):
    return [
        ser(x)
        for x in db.query(model)
        .order_by(model.id.desc())
        .all()
    ]


# ============================================================
# CUSTOMERS
# ============================================================

@app.get("/api/customers")
def customers(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    rows = crud_list(Customer, db)

    for r in rows:
        cid = r["id"]

        sales = (
            db.query(
                func.coalesce(
                    func.sum(Sale.total_amount),
                    0
                )
            )
            .filter(Sale.customer_id == cid)
            .scalar()
            or 0
        )

        rec = (
            db.query(
                func.coalesce(
                    func.sum(Payment.amount),
                    0
                )
            )
            .filter(
                Payment.party_type == "CUSTOMER",
                Payment.party_id == cid,
                Payment.transaction_type == "RECEIPT"
            )
            .scalar()
            or 0
        )

        r.update(
            total_sales=float(sales),
            total_received=float(rec),
            outstanding=float(
                max(0, sales - rec)
            )
        )

    return rows


@app.post("/api/customers")
def customer(
    p: CustomerCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    x = Customer(**p.model_dump())

    db.add(x)
    db.commit()
    db.refresh(x)

    return ser(x)


@app.get("/api/customers/{id}")
def customer_detail(
    id: int,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    x = db.get(Customer, id)

    if not x:
        raise HTTPException(
            404,
            "Customer not found"
        )

    r = ser(x)

    sales = (
        db.query(Sale)
        .filter(Sale.customer_id == id)
        .order_by(Sale.sale_date.desc())
        .all()
    )

    pays = (
        db.query(Payment)
        .filter(
            Payment.party_type == "CUSTOMER",
            Payment.party_id == id
        )
        .order_by(Payment.payment_date.desc())
        .all()
    )

    r["sales"] = [
        ser(a)
        for a in sales
    ]

    r["payments"] = [
        ser(a)
        for a in pays
    ]

    r["outstanding"] = float(
        max(
            0,
            sum(
                (a.total_amount or 0)
                for a in sales
            )
            -
            sum(
                (a.amount or 0)
                for a in pays
            )
        )
    )

    return r


# ============================================================
# VENDORS
# ============================================================

@app.get("/api/vendors")
def vendors(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    rows = crud_list(Vendor, db)

    for r in rows:
        vid = r["id"]

        pur = (
            db.query(
                func.coalesce(
                    func.sum(Purchase.total_amount),
                    0
                )
            )
            .filter(Purchase.vendor_id == vid)
            .scalar()
            or 0
        )

        pay = (
            db.query(
                func.coalesce(
                    func.sum(Payment.amount),
                    0
                )
            )
            .filter(
                Payment.party_type == "VENDOR",
                Payment.party_id == vid,
                Payment.transaction_type == "PAYMENT"
            )
            .scalar()
            or 0
        )

        r.update(
            total_purchases=float(pur),
            total_paid=float(pay),
            outstanding=float(
                max(0, pur - pay)
            )
        )

    return rows


@app.post("/api/vendors")
def vendor(
    p: VendorCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    x = Vendor(**p.model_dump())

    db.add(x)
    db.commit()
    db.refresh(x)

    return ser(x)


@app.get("/api/vendors/{id}")
def vendor_detail(
    id: int,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    x = db.get(Vendor, id)

    if not x:
        raise HTTPException(
            404,
            "Vendor not found"
        )

    r = ser(x)

    pur = (
        db.query(Purchase)
        .filter(Purchase.vendor_id == id)
        .order_by(Purchase.purchase_date.desc())
        .all()
    )

    pays = (
        db.query(Payment)
        .filter(
            Payment.party_type == "VENDOR",
            Payment.party_id == id
        )
        .order_by(Payment.payment_date.desc())
        .all()
    )

    r["purchases"] = [
        ser(a)
        for a in pur
    ]

    r["payments"] = [
        ser(a)
        for a in pays
    ]

    r["outstanding"] = float(
        max(
            0,
            sum(
                (a.total_amount or 0)
                for a in pur
            )
            -
            sum(
                (a.amount or 0)
                for a in pays
            )
        )
    )

    return r


# ============================================================
# PRODUCTS
# ============================================================

@app.get("/api/products")
def products(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    return crud_list(Product, db)


@app.post("/api/products")
def product(
    p: ProductCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    x = Product(**p.model_dump())

    db.add(x)
    db.commit()
    db.refresh(x)

    return ser(x)


# ============================================================
# SALES
# ============================================================

@app.get("/api/sales")
def sales(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    return crud_list(Sale, db)


# IMPORTANT:
# This endpoint fixes the "Not Found" error when clicking View
# on a sale/invoice.
@app.get("/api/sales/{id}")
def sale_detail(
    id: int,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    sale_obj = db.get(Sale, id)

    if not sale_obj:
        raise HTTPException(
            404,
            "Sale not found"
        )

    result = ser(sale_obj)

    # Customer details
    if sale_obj.customer_id:
        customer_obj = db.get(
            Customer,
            sale_obj.customer_id
        )
        result["customer"] = (
            ser(customer_obj)
            if customer_obj
            else None
        )
    else:
        result["customer"] = None

    # Sale items
    sale_items = (
        db.query(SaleItem)
        .filter(SaleItem.sale_id == id)
        .all()
    )

    result["items"] = []

    for item in sale_items:
        item_data = ser(item)

        product_obj = db.get(
            Product,
            item.product_id
        )

        item_data["product"] = (
            ser(product_obj)
            if product_obj
            else None
        )

        result["items"].append(item_data)

    return result


@app.post("/api/sales")
def sale(
    p: SaleCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    if (
        p.payment_mode == "CREDIT"
        and not p.customer_id
    ):
        raise HTTPException(
            400,
            "Credit sales require a customer"
        )

    try:
        subtotal = sum(
            (
                i.quantity * i.rate
                for i in p.items
            ),
            Decimal("0")
        )

        tax = sum(
            (
                i.quantity
                * i.rate
                * i.tax_rate
                / 100
                for i in p.items
            ),
            Decimal("0")
        )

        total = (
            subtotal
            + tax
            - p.discount
        )

        status = (
            "PAID"
            if p.payment_mode != "CREDIT"
            else "DUE"
        )

        x = Sale(
            invoice_number=p.invoice_number,
            customer_id=p.customer_id,
            sale_date=p.sale_date,
            subtotal=subtotal,
            tax_amount=tax,
            discount=p.discount,
            total_amount=total,
            payment_status=status,
            payment_mode=p.payment_mode,
            notes=p.notes
        )

        db.add(x)
        db.flush()

        for i in p.items:
            prod = db.get(
                Product,
                i.product_id
            )

            if not prod:
                raise HTTPException(
                    404,
                    "Product not found"
                )

            prod.current_stock = (
                (prod.current_stock or 0)
                - i.quantity
            )

            db.add(
                SaleItem(
                    sale_id=x.id,
                    product_id=i.product_id,
                    quantity=i.quantity,
                    rate=i.rate,
                    tax_rate=i.tax_rate,
                    amount=i.quantity * i.rate
                )
            )

        if (
            p.customer_id
            and p.payment_mode == "CREDIT"
        ):
            c = db.get(
                Customer,
                p.customer_id
            )

            if (
                c
                and c.credit_limit
                and float(c.credit_limit) > 0
            ):
                old = float(
                    c.opening_balance or 0
                )

                # Credit limit is informational
                # in the current MVP.
                # It does not block the demo workflow.
                _ = old

        db.commit()
        db.refresh(x)

        return ser(x)

    except Exception:
        db.rollback()
        raise


# ============================================================
# PURCHASES
# ============================================================

@app.get("/api/purchases")
def purchases(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    return crud_list(Purchase, db)


@app.post("/api/purchases")
def purchase(
    p: PurchaseCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    if (
        p.payment_mode == "CREDIT"
        and not p.vendor_id
    ):
        raise HTTPException(
            400,
            "Credit purchases require a vendor"
        )

    try:
        subtotal = sum(
            (
                i.quantity * i.rate
                for i in p.items
            ),
            Decimal("0")
        )

        tax = sum(
            (
                i.quantity
                * i.rate
                * i.tax_rate
                / 100
                for i in p.items
            ),
            Decimal("0")
        )

        total = (
            subtotal
            + tax
            - p.discount
        )

        x = Purchase(
            invoice_number=p.invoice_number,
            vendor_id=p.vendor_id,
            purchase_date=p.purchase_date,
            subtotal=subtotal,
            tax_amount=tax,
            discount=p.discount,
            total_amount=total,
            payment_status=(
                "PAID"
                if p.payment_mode != "CREDIT"
                else "DUE"
            ),
            payment_mode=p.payment_mode,
            notes=p.notes
        )

        db.add(x)
        db.flush()

        for i in p.items:
            prod = db.get(
                Product,
                i.product_id
            )

            if not prod:
                raise HTTPException(
                    404,
                    "Product not found"
                )

            prod.current_stock = (
                (prod.current_stock or 0)
                + i.quantity
            )

            db.add(
                PurchaseItem(
                    purchase_id=x.id,
                    product_id=i.product_id,
                    quantity=i.quantity,
                    rate=i.rate,
                    tax_rate=i.tax_rate,
                    amount=i.quantity * i.rate
                )
            )

        db.commit()
        db.refresh(x)

        return ser(x)

    except Exception:
        db.rollback()
        raise


# ============================================================
# PAYMENTS
# ============================================================

@app.get("/api/payments")
def payments(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    return crud_list(Payment, db)


@app.post("/api/payments")
def payment(
    p: PaymentCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    if p.transaction_type not in (
        "RECEIPT",
        "PAYMENT"
    ):
        raise HTTPException(
            400,
            "Invalid transaction type"
        )

    x = Payment(**p.model_dump())
    db.add(x)

    # Update oldest outstanding invoices
    # for status tracking.
    if (
        p.party_type == "CUSTOMER"
        and p.transaction_type == "RECEIPT"
        and p.party_id
    ):
        remaining = p.amount

        outstanding_sales = (
            db.query(Sale)
            .filter(
                Sale.customer_id == p.party_id,
                Sale.payment_mode == "CREDIT",
                Sale.payment_status.in_(
                    ["DUE", "PARTIAL"]
                )
            )
            .order_by(Sale.sale_date.asc())
            .all()
        )

        for s in outstanding_sales:
            if remaining <= 0:
                break

            paid_for = (
                db.query(
                    func.coalesce(
                        func.sum(Payment.amount),
                        0
                    )
                )
                .filter(
                    Payment.party_type == "CUSTOMER",
                    Payment.party_id == p.party_id,
                    Payment.transaction_type == "RECEIPT"
                )
                .scalar()
                or 0
            )

            s.payment_status = (
                "PARTIAL"
                if paid_for < s.total_amount
                else "PAID"
            )

    db.commit()
    db.refresh(x)

    return ser(x)


# ============================================================
# EXPENSES
# ============================================================

@app.get("/api/expenses")
def expenses(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    return crud_list(Expense, db)


@app.post("/api/expenses")
def expense(
    p: ExpenseCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    x = Expense(**p.model_dump())

    db.add(x)
    db.commit()
    db.refresh(x)

    return ser(x)


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    today = date.today()
    b = balances(db)

    ts = float(
        db.query(
            func.coalesce(
                func.sum(Sale.total_amount),
                0
            )
        )
        .filter(Sale.sale_date == today)
        .scalar()
        or 0
    )

    tp = float(
        db.query(
            func.coalesce(
                func.sum(Purchase.total_amount),
                0
            )
        )
        .filter(Purchase.purchase_date == today)
        .scalar()
        or 0
    )

    te = float(
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(Expense.expense_date == today)
        .scalar()
        or 0
    )

    monthly = []

    for i in range(5, -1, -1):
        d = (
            date.today().replace(day=1)
            - timedelta(days=30 * i)
        )

        y, m = d.year, d.month

        sales_amount = float(
            db.query(
                func.coalesce(
                    func.sum(Sale.total_amount),
                    0
                )
            )
            .filter(
                func.extract(
                    "year",
                    Sale.sale_date
                ) == y,
                func.extract(
                    "month",
                    Sale.sale_date
                ) == m
            )
            .scalar()
            or 0
        )

        purchases_amount = float(
            db.query(
                func.coalesce(
                    func.sum(Purchase.total_amount),
                    0
                )
            )
            .filter(
                func.extract(
                    "year",
                    Purchase.purchase_date
                ) == y,
                func.extract(
                    "month",
                    Purchase.purchase_date
                ) == m
            )
            .scalar()
            or 0
        )

        monthly.append(
            {
                "label": d.strftime("%b"),
                "sales": sales_amount,
                "purchases": purchases_amount
            }
        )

    recent = [
        {
            "type": "Sale",
            "date": x.sale_date.isoformat(),
            "amount": float(x.total_amount),
            "reference": x.invoice_number
        }
        for x in (
            db.query(Sale)
            .order_by(Sale.id.desc())
            .limit(6)
            .all()
        )
    ]

    return {
        "today_sales": ts,
        "today_purchases": tp,
        "today_expenses": te,
        **b,
        "monthly": monthly,
        "recent": recent
    }


# ============================================================
# CASH BOOK
# ============================================================

@app.get("/api/cash-book")
def cash_book(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    rows = []

    for x in (
        db.query(Sale)
        .filter(Sale.payment_mode == "CASH")
        .all()
    ):
        rows.append(
            {
                "date": x.sale_date.isoformat(),
                "type": "INFLOW",
                "description": f"Sale {x.invoice_number}",
                "amount": float(x.total_amount)
            }
        )

    for x in (
        db.query(Payment)
        .filter(Payment.payment_mode == "CASH")
        .all()
    ):
        rows.append(
            {
                "date": x.payment_date.isoformat(),
                "type": (
                    "INFLOW"
                    if x.transaction_type == "RECEIPT"
                    else "OUTFLOW"
                ),
                "description": (
                    x.reference_number
                    or "Payment"
                ),
                "amount": float(x.amount)
            }
        )

    for x in (
        db.query(Purchase)
        .filter(Purchase.payment_mode == "CASH")
        .all()
    ):
        rows.append(
            {
                "date": x.purchase_date.isoformat(),
                "type": "OUTFLOW",
                "description": f"Purchase {x.invoice_number}",
                "amount": float(x.total_amount)
            }
        )

    for x in (
        db.query(Expense)
        .filter(Expense.payment_mode == "CASH")
        .all()
    ):
        rows.append(
            {
                "date": x.expense_date.isoformat(),
                "type": "OUTFLOW",
                "description": (
                    x.description
                    or x.category
                ),
                "amount": float(x.amount)
            }
        )

    return {
        "opening_balance": 0,
        "transactions": sorted(
            rows,
            key=lambda x: x["date"],
            reverse=True
        ),
        "balance": balances(db)["cash"]
    }


# ============================================================
# BANK TRANSACTIONS
# ============================================================

@app.get("/api/bank-transactions")
def bank_transactions(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    return crud_list(BankTransaction, db)


@app.post("/api/bank-transactions/import")
async def bank_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    raw = await file.read()
    text = raw.decode("utf-8-sig")

    reader = csv.DictReader(
        text.splitlines()
    )

    count = 0

    for row in reader:
        try:
            credit = Decimal(
                row.get("credit") or 0
            )

            debit = Decimal(
                row.get("debit") or 0
            )

            amt = (
                credit
                if credit
                else debit
            )

            typ = (
                "CREDIT"
                if credit
                else "DEBIT"
            )

            dt = date.fromisoformat(
                (
                    row.get("date")
                    or str(date.today())
                )[:10]
            )

        except Exception:
            continue

        db.add(
            BankTransaction(
                transaction_type=typ,
                amount=amt,
                date=dt,
                reference_number=row.get(
                    "reference"
                ),
                description=row.get(
                    "description"
                ),
                source=file.filename,
                reconciliation_status="UNMATCHED"
            )
        )

        count += 1

    db.commit()

    return {
        "imported": count
    }


# ============================================================
# RECONCILIATION
# ============================================================

@app.post("/api/reconciliation/run")
def reconciliation(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    banks = (
        db.query(BankTransaction)
        .filter(
            BankTransaction.reconciliation_status
            != "MATCHED"
        )
        .all()
    )

    results = []

    for b in banks:
        candidates = []

        for s in (
            db.query(Sale)
            .filter(
                Sale.total_amount == b.amount
            )
            .all()
        ):
            score = 70

            if s.sale_date == b.date:
                score += 20

            if (
                b.reference_number
                and b.reference_number.lower()
                in s.invoice_number.lower()
            ):
                score += 10

            candidates.append(
                (
                    "SALE",
                    s.id,
                    score,
                    s.invoice_number
                )
            )

        for p in (
            db.query(Payment)
            .filter(
                Payment.amount == b.amount
            )
            .all()
        ):
            score = 75

            if p.payment_date == b.date:
                score += 20

            if (
                b.reference_number
                and p.reference_number
                and b.reference_number.lower()
                == p.reference_number.lower()
            ):
                score += 5

            candidates.append(
                (
                    "PAYMENT",
                    p.id,
                    score,
                    p.reference_number
                    or "Payment"
                )
            )

        best = max(
            candidates,
            key=lambda x: x[2],
            default=None
        )

        if best:
            status = (
                "MATCHED"
                if best[2] >= 85
                else "POSSIBLE_MATCH"
            )

            b.reconciliation_status = status

            db.add(
                Reconciliation(
                    bank_transaction_id=b.id,
                    matched_transaction_id=best[1],
                    status=status,
                    confidence=best[2],
                    notes=(
                        f"{best[0]} {best[3]}"
                    )
                )
            )

            results.append(
                {
                    "bank": ser(b),
                    "match": best,
                    "status": status
                }
            )

        else:
            results.append(
                {
                    "bank": ser(b),
                    "match": None,
                    "status": "UNMATCHED"
                }
            )

    db.commit()

    return results


# ============================================================
# HOTELS
# ============================================================

@app.get("/api/hotels")
def hotels(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    out = []

    for h in (
        db.query(HotelAccount)
        .all()
    ):
        c = db.get(
            Customer,
            h.customer_id
        )

        if not c:
            continue

        sales = (
            db.query(
                func.coalesce(
                    func.sum(Sale.total_amount),
                    0
                )
            )
            .filter(
                Sale.customer_id == c.id,
                Sale.payment_mode == "CREDIT"
            )
            .scalar()
            or 0
        )

        rec = (
            db.query(
                func.coalesce(
                    func.sum(Payment.amount),
                    0
                )
            )
            .filter(
                Payment.party_type == "CUSTOMER",
                Payment.party_id == c.id,
                Payment.transaction_type == "RECEIPT"
            )
            .scalar()
            or 0
        )

        out.append(
            {
                "id": h.id,
                "customer_id": c.id,
                "name": c.name,
                "current_outstanding": float(
                    max(0, sales - rec)
                ),
                "current_month_sales": float(
                    sales
                ),
                "payments_received": float(
                    rec
                ),
                "previous_outstanding": float(
                    h.opening_balance or 0
                )
            }
        )

    return out


@app.post("/api/hotels")
def create_hotel(
    customer_id: int,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    c = db.get(
        Customer,
        customer_id
    )

    if (
        not c
        or c.customer_type != "HOTEL"
    ):
        raise HTTPException(
            400,
            "Select a customer with HOTEL type"
        )

    if (
        db.query(HotelAccount)
        .filter(
            HotelAccount.customer_id
            == customer_id
        )
        .first()
    ):
        raise HTTPException(
            409,
            "Hotel account already exists"
        )

    h = HotelAccount(
        customer_id=customer_id
    )

    db.add(h)
    db.commit()
    db.refresh(h)

    return ser(h)


@app.get("/api/hotels/{id}/statement")
def hotel_statement(
    id: int,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    h = db.get(
        HotelAccount,
        id
    )

    if not h:
        raise HTTPException(
            404,
            "Hotel not found"
        )

    c = db.get(
        Customer,
        h.customer_id
    )

    if not c:
        raise HTTPException(
            404,
            "Hotel customer not found"
        )

    rows = []

    for s in (
        db.query(Sale)
        .filter(
            Sale.customer_id == c.id,
            Sale.payment_mode == "CREDIT"
        )
        .order_by(Sale.sale_date)
        .all()
    ):
        rows.append(
            {
                "date": s.sale_date.isoformat(),
                "type": "BILL",
                "reference": s.invoice_number,
                "amount": float(
                    s.total_amount
                )
            }
        )

    for p in (
        db.query(Payment)
        .filter(
            Payment.party_type == "CUSTOMER",
            Payment.party_id == c.id,
            Payment.transaction_type == "RECEIPT"
        )
        .order_by(Payment.payment_date)
        .all()
    ):
        rows.append(
            {
                "date": p.payment_date.isoformat(),
                "type": "PAYMENT",
                "reference": (
                    p.reference_number
                    or "Receipt"
                ),
                "amount": -float(
                    p.amount
                )
            }
        )

    rows.sort(
        key=lambda x: x["date"]
    )

    running = float(
        h.opening_balance or 0
    )

    for r in rows:
        running += r["amount"]
        r["balance"] = running

    return {
        "hotel": ser(c),
        "opening_balance": float(
            h.opening_balance or 0
        ),
        "rows": rows,
        "closing_balance": running
    }


# ============================================================
# REPORTS
# ============================================================

@app.get("/api/reports/sales")
def report_sales(
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    q = db.query(Sale)

    if start:
        q = q.filter(
            Sale.sale_date >= start
        )

    if end:
        q = q.filter(
            Sale.sale_date <= end
        )

    return [
        ser(x)
        for x in (
            q.order_by(
                Sale.sale_date.desc()
            ).all()
        )
    ]


@app.get("/api/reports/tax-summary")
def tax_summary(
    fy: str = "2026-27",
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    start_year = int(
        fy.split("-")[0]
    )

    start = date(
        start_year,
        4,
        1
    )

    end = date(
        start_year + 1,
        3,
        31
    )

    sales = (
        db.query(Sale)
        .filter(
            Sale.sale_date.between(
                start,
                end
            )
        )
        .all()
    )

    purchases = (
        db.query(Purchase)
        .filter(
            Purchase.purchase_date.between(
                start,
                end
            )
        )
        .all()
    )

    expenses = (
        db.query(Expense)
        .filter(
            Expense.expense_date.between(
                start,
                end
            )
        )
        .all()
    )

    return {
        "financial_year": fy,

        "total_sales": sum(
            float(x.total_amount)
            for x in sales
        ),

        "cash_sales": sum(
            float(x.total_amount)
            for x in sales
            if x.payment_mode == "CASH"
        ),

        "digital_sales": sum(
            float(x.total_amount)
            for x in sales
            if x.payment_mode
            in [
                "UPI",
                "BANK_TRANSFER",
                "CARD"
            ]
        ),

        "credit_sales": sum(
            float(x.total_amount)
            for x in sales
            if x.payment_mode == "CREDIT"
        ),

        "total_purchases": sum(
            float(x.total_amount)
            for x in purchases
        ),

        "cash_purchases": sum(
            float(x.total_amount)
            for x in purchases
            if x.payment_mode == "CASH"
        ),

        "digital_purchases": sum(
            float(x.total_amount)
            for x in purchases
            if x.payment_mode
            in [
                "UPI",
                "BANK_TRANSFER",
                "CARD"
            ]
        ),

        "credit_purchases": sum(
            float(x.total_amount)
            for x in purchases
            if x.payment_mode == "CREDIT"
        ),

        "total_expenses": sum(
            float(x.amount)
            for x in expenses
        ),

        "receivables": balances(db)[
            "receivables"
        ],

        "payables": balances(db)[
            "payables"
        ],

        "cash_balance": balances(db)[
            "cash"
        ],

        "bank_balance": balances(db)[
            "bank"
        ],

        "monthly_sales": [
            {
                "month": i,
                "amount": sum(
                    float(x.total_amount)
                    for x in sales
                    if x.sale_date.month == i
                )
            }
            for i in range(1, 13)
        ],

        "monthly_purchases": [
            {
                "month": i,
                "amount": sum(
                    float(x.total_amount)
                    for x in purchases
                    if x.purchase_date.month == i
                )
            }
            for i in range(1, 13)
        ],

        "monthly_expenses": [
            {
                "month": i,
                "amount": sum(
                    float(x.amount)
                    for x in expenses
                    if x.expense_date.month == i
                )
            }
            for i in range(1, 13)
        ]
    }


@app.get("/api/reports/receivables")
def receivables(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    return [
        x
        for x in customers(db, user)
        if x["outstanding"] > 0
    ]


@app.get("/api/reports/payables")
def payables(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    return [
        x
        for x in vendors(db, user)
        if x["outstanding"] > 0
    ]


# ============================================================
# EXPORTS
# ============================================================

@app.post("/api/exports/excel")
def export_excel(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    import pandas as pd

    data = [
        ser(x)
        for x in (
            db.query(Sale)
            .order_by(Sale.sale_date)
            .all()
        )
    ]

    buf = BytesIO()

    pd.DataFrame(data).to_excel(
        buf,
        index=False
    )

    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type=(
            "application/"
            "vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
                "attachment; "
                "filename=shopledger-sales.xlsx"
        }
    )


@app.post("/api/exports/csv")
def export_csv(
    db: Session = Depends(get_db),
    user=Depends(current_user)
):
    data = [
        ser(x)
        for x in (
            db.query(Sale)
            .order_by(Sale.sale_date)
            .all()
        )
    ]

    import io

    text = io.StringIO()

    fields = (
        list(data[0])
        if data
        else ["id"]
    )

    w = csv.DictWriter(
        text,
        fieldnames=fields
    )

    w.writeheader()

    if data:
        w.writerows(data)

    return StreamingResponse(
        iter(
            [
                text.getvalue()
                .encode("utf-8")
            ]
        ),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; "
                "filename=shopledger-sales.csv"
        }
    )


# ============================================================
# STARTUP SEED DATA
# ============================================================

@app.on_event("startup")
def seed():
    SessionLocal = __import__(
        "app.db",
        fromlist=["SessionLocal"]
    ).SessionLocal

    db = SessionLocal()

    try:
        if not db.query(User).first():
            db.add(
                User(
                    name="Shop Admin",
                    email="admin@shopledger.local",
                    password_hash=hash_password(
                        "Admin@123"
                    ),
                    role="ADMIN"
                )
            )

        if db.query(Customer).count() == 0:
            cs = [
                Customer(
                    name="Retail Customer A",
                    phone="9000000001",
                    customer_type="RETAIL"
                ),
                Customer(
                    name="Retail Customer B",
                    phone="9000000002",
                    customer_type="RETAIL"
                ),
                Customer(
                    name="Hotel ABC",
                    phone="9000000003",
                    customer_type="HOTEL",
                    payment_terms="Monthly"
                ),
                Customer(
                    name="Hotel XYZ",
                    phone="9000000004",
                    customer_type="HOTEL",
                    payment_terms="Monthly"
                )
            ]

            db.add_all(cs)
            db.flush()

            db.add_all(
                [
                    Vendor(
                        name="Supplier A",
                        phone="9100000001"
                    ),
                    Vendor(
                        name="Supplier B",
                        phone="9100000002"
                    ),
                    Vendor(
                        name="Supplier C",
                        phone="9100000003"
                    )
                ]
            )

            db.add_all(
                [
                    Product(
                        name="Rice",
                        sku="RICE-001",
                        unit="kg",
                        purchase_price=Decimal("55"),
                        selling_price=Decimal("70"),
                        current_stock=100
                    ),
                    Product(
                        name="Vegetables",
                        sku="VEG-001",
                        unit="kg",
                        purchase_price=Decimal("35"),
                        selling_price=Decimal("50"),
                        current_stock=80
                    ),
                    Product(
                        name="Chicken",
                        sku="CHK-001",
                        unit="kg",
                        purchase_price=Decimal("180"),
                        selling_price=Decimal("230"),
                        current_stock=50
                    ),
                    Product(
                        name="Oil",
                        sku="OIL-001",
                        unit="litre",
                        purchase_price=Decimal("130"),
                        selling_price=Decimal("155"),
                        current_stock=40
                    ),
                    Product(
                        name="Packaging",
                        sku="PKG-001",
                        unit="pcs",
                        purchase_price=Decimal("8"),
                        selling_price=Decimal("12"),
                        current_stock=200
                    )
                ]
            )

            db.flush()

            db.add_all(
                [
                    HotelAccount(
                        customer_id=cs[2].id
                    ),
                    HotelAccount(
                        customer_id=cs[3].id
                    )
                ]
            )

        db.commit()

    finally:
        db.close()