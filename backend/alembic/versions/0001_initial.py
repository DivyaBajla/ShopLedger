"""initial schema"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Fast MVP migration: use SQLAlchemy metadata for first-run schema.
    from app.db import Base
    from app.models import User,Customer,Vendor,Product,Sale,SaleItem,Purchase,PurchaseItem,Payment,Expense,CashTransaction,BankTransaction,HotelAccount,HotelBill,Reconciliation
    bind=op.get_bind(); Base.metadata.create_all(bind=bind)

def downgrade():
    from app.db import Base
    bind=op.get_bind(); Base.metadata.drop_all(bind=bind)
