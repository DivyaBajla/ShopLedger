from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List

class ORM(BaseModel):
    model_config=ConfigDict(from_attributes=True)
class Login(BaseModel): email: str; password: str
class Token(BaseModel): access_token:str; token_type:str='bearer'; user:dict
class UserCreate(BaseModel): name:str; email:str; password:str; role:str='ADMIN'
class PartyBase(BaseModel): name:str; phone:Optional[str]=None; email:Optional[str]=None; address:Optional[str]=None
class CustomerCreate(PartyBase): customer_type:str='RETAIL'; credit_limit:Decimal=0; payment_terms:Optional[str]=None; opening_balance:Decimal=0
class VendorCreate(PartyBase): payment_terms:Optional[str]=None; opening_balance:Decimal=0
class ProductCreate(BaseModel): name:str; sku:Optional[str]=None; unit:str='pcs'; purchase_price:Decimal=0; selling_price:Decimal=0; tax_rate:Decimal=0; current_stock:Decimal=0
class ItemIn(BaseModel): product_id:int; quantity:Decimal=Field(gt=0); rate:Decimal=Field(gt=0); tax_rate:Decimal=0
class SaleCreate(BaseModel): invoice_number:str; customer_id:Optional[int]=None; sale_date:date; discount:Decimal=0; payment_mode:str; notes:Optional[str]=None; items:List[ItemIn]
class PurchaseCreate(BaseModel): invoice_number:str; vendor_id:Optional[int]=None; purchase_date:date; discount:Decimal=0; payment_mode:str; notes:Optional[str]=None; items:List[ItemIn]
class PaymentCreate(BaseModel): transaction_type:str; party_type:str; party_id:Optional[int]=None; amount:Decimal=Field(gt=0); payment_date:date; payment_mode:str; reference_number:Optional[str]=None; notes:Optional[str]=None
class ExpenseCreate(BaseModel): category:str; description:Optional[str]=None; amount:Decimal=Field(gt=0); expense_date:date; payment_mode:str; reference_number:Optional[str]=None; notes:Optional[str]=None
class BankImport(BaseModel): rows:List[dict]
