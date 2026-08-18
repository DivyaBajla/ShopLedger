export type Customer={id:number;name:string;phone?:string;customer_type:string;total_sales:number;total_received:number;outstanding:number};
export type Vendor={id:number;name:string;phone?:string;total_purchases:number;total_paid:number;outstanding:number};
export type Product={id:number;name:string;sku?:string;unit:string;purchase_price:number;selling_price:number;tax_rate:number;current_stock:number};
