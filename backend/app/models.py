from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .db import Base

class User(Base):
    __tablename__='users'
    id=Column(Integer,primary_key=True)
    name=Column(String(120),nullable=False)
    email=Column(String(255),unique=True,index=True,nullable=False)
    password_hash=Column(String(255),nullable=False)
    role=Column(String(20),default='STAFF',nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow)

class Customer(Base):
    __tablename__='customers'
    id=Column(Integer,primary_key=True); name=Column(String(160),nullable=False); phone=Column(String(40)); email=Column(String(255)); address=Column(Text); customer_type=Column(String(30),default='RETAIL'); credit_limit=Column(Numeric(14,2),default=0); payment_terms=Column(String(80)); opening_balance=Column(Numeric(14,2),default=0); created_at=Column(DateTime,default=datetime.utcnow)
    sales=relationship('Sale',back_populates='customer')

class Vendor(Base):
    __tablename__='vendors'
    id=Column(Integer,primary_key=True); name=Column(String(160),nullable=False); phone=Column(String(40)); email=Column(String(255)); address=Column(Text); payment_terms=Column(String(80)); opening_balance=Column(Numeric(14,2),default=0); created_at=Column(DateTime,default=datetime.utcnow)
    purchases=relationship('Purchase',back_populates='vendor')

class Product(Base):
    __tablename__='products'
    id=Column(Integer,primary_key=True); name=Column(String(160),nullable=False); sku=Column(String(80),unique=True); unit=Column(String(30),default='pcs'); purchase_price=Column(Numeric(14,2),default=0); selling_price=Column(Numeric(14,2),default=0); tax_rate=Column(Numeric(6,2),default=0); current_stock=Column(Numeric(14,3),default=0); created_at=Column(DateTime,default=datetime.utcnow)

class Sale(Base):
    __tablename__='sales'
    id=Column(Integer,primary_key=True); invoice_number=Column(String(80),unique=True,nullable=False); customer_id=Column(Integer,ForeignKey('customers.id')); sale_date=Column(Date,default=date.today); subtotal=Column(Numeric(14,2),nullable=False); tax_amount=Column(Numeric(14,2),default=0); discount=Column(Numeric(14,2),default=0); total_amount=Column(Numeric(14,2),nullable=False); payment_status=Column(String(20),default='PAID'); payment_mode=Column(String(30)); notes=Column(Text); created_at=Column(DateTime,default=datetime.utcnow)
    customer=relationship('Customer',back_populates='sales'); items=relationship('SaleItem',back_populates='sale',cascade='all, delete-orphan')

class SaleItem(Base):
    __tablename__='sale_items'
    id=Column(Integer,primary_key=True); sale_id=Column(Integer,ForeignKey('sales.id'),nullable=False); product_id=Column(Integer,ForeignKey('products.id'),nullable=False); quantity=Column(Numeric(14,3),nullable=False); rate=Column(Numeric(14,2),nullable=False); tax_rate=Column(Numeric(6,2),default=0); amount=Column(Numeric(14,2),nullable=False)
    sale=relationship('Sale',back_populates='items')

class Purchase(Base):
    __tablename__='purchases'
    id=Column(Integer,primary_key=True); invoice_number=Column(String(80),unique=True,nullable=False); vendor_id=Column(Integer,ForeignKey('vendors.id')); purchase_date=Column(Date,default=date.today); subtotal=Column(Numeric(14,2),nullable=False); tax_amount=Column(Numeric(14,2),default=0); discount=Column(Numeric(14,2),default=0); total_amount=Column(Numeric(14,2),nullable=False); payment_status=Column(String(20),default='PAID'); payment_mode=Column(String(30)); notes=Column(Text); created_at=Column(DateTime,default=datetime.utcnow)
    vendor=relationship('Vendor',back_populates='purchases'); items=relationship('PurchaseItem',back_populates='purchase',cascade='all, delete-orphan')

class PurchaseItem(Base):
    __tablename__='purchase_items'
    id=Column(Integer,primary_key=True); purchase_id=Column(Integer,ForeignKey('purchases.id'),nullable=False); product_id=Column(Integer,ForeignKey('products.id'),nullable=False); quantity=Column(Numeric(14,3),nullable=False); rate=Column(Numeric(14,2),nullable=False); tax_rate=Column(Numeric(6,2),default=0); amount=Column(Numeric(14,2),nullable=False)
    purchase=relationship('Purchase',back_populates='items')

class Payment(Base):
    __tablename__='payments'
    id=Column(Integer,primary_key=True); transaction_type=Column(String(20),nullable=False); party_type=Column(String(20),nullable=False); party_id=Column(Integer); amount=Column(Numeric(14,2),nullable=False); payment_date=Column(Date,default=date.today); payment_mode=Column(String(30),nullable=False); reference_number=Column(String(100)); notes=Column(Text); created_at=Column(DateTime,default=datetime.utcnow)

class Expense(Base):
    __tablename__='expenses'
    id=Column(Integer,primary_key=True); category=Column(String(60),nullable=False); description=Column(String(255)); amount=Column(Numeric(14,2),nullable=False); expense_date=Column(Date,default=date.today); payment_mode=Column(String(30),nullable=False); reference_number=Column(String(100)); notes=Column(Text); created_at=Column(DateTime,default=datetime.utcnow)

class CashTransaction(Base):
    __tablename__='cash_transactions'
    id=Column(Integer,primary_key=True); transaction_type=Column(String(20),nullable=False); amount=Column(Numeric(14,2),nullable=False); date=Column(Date,default=date.today); reference_type=Column(String(40)); reference_id=Column(Integer); description=Column(String(255))

class BankTransaction(Base):
    __tablename__='bank_transactions'
    id=Column(Integer,primary_key=True); transaction_type=Column(String(20),nullable=False); amount=Column(Numeric(14,2),nullable=False); date=Column(Date,default=date.today); reference_number=Column(String(100)); description=Column(String(500)); source=Column(String(80),default='manual'); reconciliation_status=Column(String(30),default='UNMATCHED')

class HotelAccount(Base):
    __tablename__='hotel_accounts'
    id=Column(Integer,primary_key=True); customer_id=Column(Integer,ForeignKey('customers.id'),unique=True,nullable=False); billing_cycle=Column(String(30),default='MONTHLY'); payment_terms=Column(String(80)); opening_balance=Column(Numeric(14,2),default=0)

class HotelBill(Base):
    __tablename__='hotel_bills'
    id=Column(Integer,primary_key=True); hotel_id=Column(Integer,ForeignKey('hotel_accounts.id'),nullable=False); sale_id=Column(Integer,ForeignKey('sales.id'),nullable=False); billing_date=Column(Date,default=date.today); amount=Column(Numeric(14,2),nullable=False)

class Reconciliation(Base):
    __tablename__='reconciliations'
    id=Column(Integer,primary_key=True); bank_transaction_id=Column(Integer,ForeignKey('bank_transactions.id'),nullable=False); matched_transaction_id=Column(Integer); status=Column(String(30),nullable=False); confidence=Column(Numeric(5,2),default=0); notes=Column(Text)
