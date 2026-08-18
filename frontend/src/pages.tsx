import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from './services/api';
import { ArrowUpRight, ArrowDownRight, Plus, Search, Upload, Download, CheckCircle2, Building2 } from 'lucide-react';

const Button = ({ children, onClick, secondary = false, type = 'button' }: any) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
      secondary ? 'bg-white border text-slate-700 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
);

const Input = ({ label, ...p }: any) => (
  <label className="block text-sm">
    <span className="text-slate-500 block mb-1.5">{label}</span>
    <input {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-200 bg-white" />
  </label>
);

const Select = ({ label, children, ...p }: any) => (
  <label className="block text-sm">
    <span className="text-slate-500 block mb-1.5">{label}</span>
    <select {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
      {children}
    </select>
  </label>
);

const Table = ({ headers, rows }: any) => (
  <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-slate-50 text-left text-slate-500">
          {headers.map((h: string) => (
            <th className="px-4 py-3 font-medium" key={h}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((r: any, i: number) => (
            <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
              {r.map((c: any, j: number) => (
                <td className="px-4 py-3 whitespace-nowrap" key={j}>
                  {c}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length} className="py-12 text-center text-slate-400">
              No records yet
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@shopledger.local');
  const [password, setPassword] = useState('Admin@123');
  const [err, setErr] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const r = await api.post('/auth/login', { email, password });
      localStorage.setItem('shopledger_token', r.data.access_token);
      nav('/');
      location.reload();
    } catch (e: any) {
      setErr(e.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-3xl border shadow-sm p-8">
        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black mb-5">
          SL
        </div>
        <h1 className="text-2xl font-bold">Welcome to ShopLedger</h1>
        <p className="text-slate-500 mt-2 mb-7">Simple financial reconciliation for growing shops.</p>
        <div className="space-y-4">
          <Input label="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <Button type="submit">Sign in</Button>
        </div>
        <div className="mt-5 text-xs text-slate-400">Demo: admin@shopledger.local / Admin@123</div>
      </form>
    </div>
  );
}

function Page({ title, subtitle, action }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Dashboard() {
  const [d, setD] = useState<any>();

  useEffect(() => {
    api.get('/dashboard').then((r) => setD(r.data));
  }, []);

  if (!d) return <div className="animate-pulse h-80" />;

  const cards = [
    ['Today’s Sales', d.today_sales],
    ['Today’s Purchases', d.today_purchases],
    ['Cash Balance', d.cash],
    ['Bank / UPI', d.bank],
    ['Receivables', d.receivables],
    ['Vendor Payables', d.payables],
    ['Today’s Expenses', d.today_expenses],
  ];

  return (
    <>
      <Page
        title="Dashboard"
        subtitle="A live view of your shop’s financial position."
        action={
          <div className="flex gap-2">
            <Button onClick={() => (location.href = '/sales')}>
              <Plus size={16} /> New Sale
            </Button>
            <Button secondary onClick={() => (location.href = '/payments')}>
              Receive Payment
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {cards.map(([k, v]) => (
          <div className="bg-white border rounded-2xl p-4" key={k as string}>
            <div className="text-xs text-slate-500">{k}</div>
            <div className="text-lg font-bold mt-2 num">{money(v as number)}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border rounded-2xl p-5">
          <div className="flex justify-between mb-6">
            <div>
              <div className="font-semibold">Sales vs purchases</div>
              <div className="text-xs text-slate-400">Last six months</div>
            </div>
          </div>
          <div className="h-64 flex items-end gap-4">
            {d.monthly.map((m: any) => (
              <div className="flex-1 h-full flex flex-col justify-end gap-1" key={m.label}>
                <div className="flex items-end gap-1 h-52">
                  <div
                    title={money(m.sales)}
                    className="bg-slate-900 rounded-t-lg w-1/2"
                    style={{
                      height: `${Math.max(4, (m.sales / Math.max(...d.monthly.map((x: any) => x.sales), 1)) * 100)}%`,
                    }}
                  />
                  <div
                    title={money(m.purchases)}
                    className="bg-slate-200 rounded-t-lg w-1/2"
                    style={{
                      height: `${Math.max(4, (m.purchases / Math.max(...d.monthly.map((x: any) => x.sales), 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 text-center">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs mt-4 text-slate-500">
            <span>■ Sales</span>
            <span className="text-slate-300">■ Purchases</span>
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <div className="font-semibold mb-1">Recent transactions</div>
          <div className="text-xs text-slate-400 mb-5">Latest activity</div>
          <div className="space-y-4">
            {d.recent.map((x: any) => (
              <div className="flex justify-between" key={x.reference}>
                <div>
                  <div className="text-sm font-medium">{x.reference}</div>
                  <div className="text-xs text-slate-400">{x.date}</div>
                </div>
                <div className="font-semibold text-sm">{money(x.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function Customers() {
  return <PartyPage kind="customers" />;
}

export function Vendors() {
  return <PartyPage kind="vendors" />;
}

function PartyPage({ kind }: any) {
  const isC = kind === 'customers';
  const [rows, setRows] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({ name: '', phone: '', customer_type: 'RETAIL' });

  const load = () => api.get('/' + kind).then((r) => setRows(r.data));

  useEffect(() => {
    load();
  }, []);

  const save = async (e: any) => {
    e.preventDefault();
    await api.post('/' + kind, form);
    setShow(false);
    setForm({ name: '', phone: '', customer_type: 'RETAIL' });
    load();
  };

  return (
    <>
      <Page
        title={isC ? 'Customers' : 'Vendors'}
        subtitle={
          isC
            ? 'Track sales, receipts and outstanding balances.'
            : 'Track purchases, payments and supplier balances.'
        }
        action={
          <Button onClick={() => setShow(true)}>
            <Plus size={16} /> Add {isC ? 'customer' : 'vendor'}
          </Button>
        }
      />
      <div className="bg-white border rounded-2xl p-4 mb-4 flex gap-3">
        <div className="flex-1 relative">
          <Search size={17} className="absolute left-3 top-3 text-slate-400" />
          <input placeholder="Search name or phone" className="w-full bg-slate-50 rounded-xl pl-10 py-2.5 outline-none" />
        </div>
      </div>
      <Table
        headers={
          isC
            ? ['Name', 'Type', 'Phone', 'Sales', 'Received', 'Outstanding']
            : ['Vendor', 'Phone', 'Purchases', 'Paid', 'Outstanding']
        }
        rows={rows.map((x) =>
          isC
            ? [
                <b>{x.name}</b>,
                x.customer_type,
                x.phone || '—',
                money(x.total_sales),
                money(x.total_received),
                <b>{money(x.outstanding)}</b>,
              ]
            : [
                <b>{x.name}</b>,
                x.phone || '—',
                money(x.total_purchases),
                money(x.total_paid),
                <b>{money(x.outstanding)}</b>,
              ]
        )}
      />
      {show && (
        <Modal title={`Add ${isC ? 'customer' : 'vendor'}`} close={() => setShow(false)}>
          <form onSubmit={save} className="space-y-4">
            <Input
              label="Name"
              required
              value={form.name}
              onChange={(e: any) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e: any) => setForm({ ...form, phone: e.target.value })}
            />
            {isC && (
              <Select
                label="Type"
                value={form.customer_type}
                onChange={(e: any) => setForm({ ...form, customer_type: e.target.value })}
              >
                <option>RETAIL</option>
                <option>HOTEL</option>
                <option>WHOLESALE</option>
                <option>OTHER</option>
              </Select>
            )}
            <Button type="submit">Save</Button>
          </form>
        </Modal>
      )}
    </>
  );
}

export function Products() {
  const [rows, setRows] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({ name: '', sku: '', unit: 'kg', selling_price: '', purchase_price: '' });

  const load = () => api.get('/products').then((r) => setRows(r.data));

  useEffect(() => {
    load();
  }, []);

  const save = async (e: any) => {
    e.preventDefault();
    await api.post('/products', {
      ...form,
      purchase_price: Number(form.purchase_price || 0),
      selling_price: Number(form.selling_price || 0),
      current_stock: 0,
      tax_rate: 0,
    });
    setShow(false);
    load();
  };

  return (
    <>
      <Page
        title="Products"
        subtitle="Manage items, pricing and live stock levels."
        action={
          <Button onClick={() => setShow(true)}>
            <Plus size={16} /> Add product
          </Button>
        }
      />
      <Table
        headers={['Product', 'SKU', 'Unit', 'Purchase', 'Selling', 'Stock']}
        rows={rows.map((x) => [
          <b>{x.name}</b>,
          x.sku || '—',
          x.unit,
          money(x.purchase_price),
          money(x.selling_price),
          `${x.current_stock} ${x.unit}`,
        ])}
      />
      {show && (
        <Modal title="Add product" close={() => setShow(false)}>
          <form onSubmit={save} className="space-y-4">
            <Input
              label="Product name"
              required
              value={form.name}
              onChange={(e: any) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="SKU"
              value={form.sku}
              onChange={(e: any) => setForm({ ...form, sku: e.target.value })}
            />
            <Input
              label="Unit"
              value={form.unit}
              onChange={(e: any) => setForm({ ...form, unit: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Purchase price"
                type="number"
                value={form.purchase_price}
                onChange={(e: any) => setForm({ ...form, purchase_price: e.target.value })}
              />
              <Input
                label="Selling price"
                type="number"
                value={form.selling_price}
                onChange={(e: any) => setForm({ ...form, selling_price: e.target.value })}
              />
            </div>
            <Button type="submit">Save product</Button>
          </form>
        </Modal>
      )}
    </>
  );
}

export function Transactions({ kind }: any) {
  const title = kind === 'sales' ? 'Sales' : kind === 'purchases' ? 'Purchases' : kind === 'payments' ? 'Payments' : 'Expenses';
  const endpoint = kind;
  const [rows, setRows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const load = async () => {
    const r = await api.get('/' + endpoint);
    setRows(r.data);
  };

  useEffect(() => {
    load();
    if (kind === 'sales') api.get('/customers').then((r) => setCustomers(r.data));
    if (kind === 'purchases') api.get('/vendors').then((r) => setVendors(r.data));
  }, [kind]);

  const viewSale = async (id: number) => {
    setLoadingDetails(true);
    try {
      const r = await api.get(`/sales/${id}`);
      setSelectedSale(r.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Could not load invoice details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const customerName = (id: any) => customers.find((c) => c.id === Number(id))?.name || id || 'Walk-in';
  const vendorName = (id: any) => vendors.find((v) => v.id === Number(id))?.name || id || '—';

  return (
    <>
      <Page
        title={title}
        subtitle={
          kind === 'sales'
            ? 'Record sales and update receivables automatically.'
            : kind === 'purchases'
              ? 'Record supplier purchases and payables.'
              : 'Keep every cash and digital movement traceable.'
        }
        action={
          <Button onClick={() => setShow(true)}>
            <Plus size={16} /> New {title.slice(0, -1)}
          </Button>
        }
      />

      {kind === 'payments' && (
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <Quick title="Receive from customer" text="Receipt • Customer • UPI / Bank / Cash" />
          <Quick title="Pay vendor" text="Payment • Vendor • Cash / Bank" />
        </div>
      )}

      <Table
        headers={
          kind === 'sales'
            ? ['Invoice', 'Date', 'Customer', 'Total', 'Status', 'Mode', 'Action']
            : kind === 'purchases'
              ? ['Invoice', 'Date', 'Vendor', 'Total', 'Status', 'Mode']
              : kind === 'payments'
                ? ['Type', 'Party', 'Date', 'Amount', 'Mode', 'Reference']
                : ['Category', 'Date', 'Description', 'Amount', 'Mode']
        }
        rows={rows.map((x) =>
          kind === 'sales'
            ? [
                x.invoice_number,
                x.sale_date,
                customerName(x.customer_id),
                money(x.total_amount),
                <span className="px-2 py-1 rounded-full bg-slate-100 text-xs">{x.payment_status}</span>,
                x.payment_mode,
                <Button secondary onClick={() => viewSale(x.id)}>{loadingDetails ? 'Loading...' : 'View'}</Button>,
              ]
            : kind === 'purchases'
              ? [x.invoice_number, x.purchase_date, vendorName(x.vendor_id), money(x.total_amount), x.payment_status, x.payment_mode]
              : kind === 'payments'
                ? [x.transaction_type, x.party_id || 'Other', x.payment_date, money(x.amount), x.payment_mode, x.reference_number || '—']
                : [x.category, x.expense_date, x.description || '—', money(x.amount), x.payment_mode]
        )}
      />

      {show && <TransactionModal kind={kind} close={() => setShow(false)} done={load} />}

      {selectedSale && (
        <Modal title={`${selectedSale.invoice_number || 'Invoice'} • Details`} close={() => setSelectedSale(null)}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-xs text-slate-400">Customer</div><div className="font-semibold">{selectedSale.customer_name || customerName(selectedSale.customer_id)}</div></div>
              <div><div className="text-xs text-slate-400">Date</div><div className="font-semibold">{selectedSale.sale_date}</div></div>
              <div><div className="text-xs text-slate-400">Payment</div><div className="font-semibold">{selectedSale.payment_mode}</div></div>
              <div><div className="text-xs text-slate-400">Status</div><div className="font-semibold">{selectedSale.payment_status}</div></div>
            </div>

            <div className="border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr><th className="px-4 py-3 text-left">Item</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {(selectedSale.items || []).map((item: any, i: number) => (
                    <tr key={item.id || i} className="border-t">
                      <td className="px-4 py-3">{item.product_name || item.product?.name || `Product #${item.product_id}`}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{money(item.rate)}</td>
                      <td className="px-4 py-3 text-right font-medium">{money(item.amount ?? Number(item.quantity) * Number(item.rate))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><b>{money(selectedSale.subtotal)}</b></div>
              <div className="flex justify-between"><span>Discount</span><b>{money(selectedSale.discount)}</b></div>
              <div className="flex justify-between"><span>Tax</span><b>{money(selectedSale.tax_amount)}</b></div>
              <div className="border-t pt-2 flex justify-between text-lg"><span className="font-semibold">Total</span><b>{money(selectedSale.total_amount)}</b></div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Quick({ title, text }: any) {
  return <div className="bg-white border rounded-2xl p-5"><div className="font-semibold">{title}</div><div className="text-xs text-slate-400 mt-1">{text}</div></div>;
}

function TransactionModal({ kind, close, done }: any) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({
    invoice_number: 'INV-' + Date.now(),
    sale_date: today,
    purchase_date: today,
    payment_date: today,
    expense_date: today,
    payment_mode: 'CASH',
    transaction_type: 'RECEIPT',
    party_type: 'CUSTOMER',
    amount: '',
    category: 'Electricity',
    discount: '0',
    tax_amount: '0',
    items: [],
  });

  useEffect(() => {
    Promise.all([api.get('/customers'), api.get('/vendors'), api.get('/products')]).then(([c, v, p]) => {
      setCustomers(c.data);
      setVendors(v.data);
      setProducts(p.data);
      setForm((f: any) => ({
        ...f,
        customer_id: c.data.find((x: any) => x.customer_type === 'HOTEL')?.id,
        vendor_id: v.data[0]?.id,
        items: p.data[0]
          ? [{ product_id: p.data[0].id, quantity: 1, rate: kind === 'purchases' ? p.data[0].purchase_price : p.data[0].selling_price, tax_rate: 0 }]
          : [],
      }));
    });
  }, [kind]);

  const addItem = () => {
    const first = products[0];
    if (!first) return;
    setForm((f: any) => ({
      ...f,
      items: [...f.items, { product_id: first.id, quantity: 1, rate: kind === 'purchases' ? first.purchase_price : first.selling_price, tax_rate: 0 }],
    }));
  };

  const updateItem = (index: number, patch: any) => {
    setForm((f: any) => ({
      ...f,
      items: f.items.map((item: any, i: number) => i === index ? { ...item, ...patch } : item),
    }));
  };

  const removeItem = (index: number) => {
    setForm((f: any) => ({ ...f, items: f.items.filter((_: any, i: number) => i !== index) }));
  };

  const subtotal = form.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0);
  const discount = Number(form.discount || 0);
  const tax = Number(form.tax_amount || 0);
  const total = Math.max(0, subtotal - discount + tax);

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      if (['sales', 'purchases'].includes(kind) && !form.items.length) {
        throw new Error('Add at least one product');
      }

      if (kind === 'expenses') {
        await api.post('/expenses', { ...form, amount: Number(form.amount) });
      } else if (kind === 'payments') {
        await api.post('/payments', { ...form, amount: Number(form.amount) });
      } else if (kind === 'sales') {
        await api.post('/sales', {
          ...form,
          customer_id: form.customer_id || null,
          discount,
          tax_amount: tax,
          subtotal,
          total_amount: total,
          items: form.items.map((i: any) => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), tax_rate: Number(i.tax_rate || 0) })),
        });
      } else {
        await api.post('/purchases', {
          ...form,
          vendor_id: form.vendor_id,
          discount,
          tax_amount: tax,
          subtotal,
          total_amount: total,
          items: form.items.map((i: any) => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), tax_rate: Number(i.tax_rate || 0) })),
        });
      }
      close();
      done();
    } catch (e: any) {
      alert(e.response?.data?.detail || e.message || 'Could not save transaction');
    }
  };

  return (
    <Modal title={`New ${kind.slice(0, -1)}`} close={close}>
      <form onSubmit={submit} className="space-y-5">
        {kind === 'sales' && (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Invoice number" value={form.invoice_number} onChange={(e: any) => setForm({ ...form, invoice_number: e.target.value })} />
              <Input label="Date" type="date" value={form.sale_date} onChange={(e: any) => setForm({ ...form, sale_date: e.target.value })} />
            </div>
            <Select label="Customer" value={form.customer_id || ''} onChange={(e: any) => setForm({ ...form, customer_id: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Walk-in</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.customer_type === 'HOTEL' ? '• Hotel' : ''}</option>)}
            </Select>
          </>
        )}

        {kind === 'purchases' && (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Invoice number" value={form.invoice_number} onChange={(e: any) => setForm({ ...form, invoice_number: e.target.value })} />
              <Input label="Date" type="date" value={form.purchase_date} onChange={(e: any) => setForm({ ...form, purchase_date: e.target.value })} />
            </div>
            <Select label="Vendor" value={form.vendor_id || ''} onChange={(e: any) => setForm({ ...form, vendor_id: Number(e.target.value) })}>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </>
        )}

        {['sales', 'purchases'].includes(kind) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Items</div>
              <Button secondary type="button" onClick={addItem}><Plus size={15} /> Add item</Button>
            </div>

            {!form.items.length && <div className="border border-dashed rounded-xl p-5 text-center text-sm text-slate-400">No items added yet.</div>}

            {form.items.map((item: any, index: number) => (
              <div key={index} className="border rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  {form.items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="text-sm text-red-600">Remove</button>}
                </div>
                <Select
                  label="Product"
                  value={item.product_id || ''}
                  onChange={(e: any) => {
                    const p = products.find((x: any) => x.id == e.target.value);
                    updateItem(index, { product_id: Number(e.target.value), rate: kind === 'purchases' ? Number(p?.purchase_price || 0) : Number(p?.selling_price || 0) });
                  }}
                >
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} • {money(kind === 'purchases' ? p.purchase_price : p.selling_price)}</option>)}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Quantity" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e: any) => updateItem(index, { quantity: Number(e.target.value) })} />
                  <Input label="Rate" type="number" min="0" step="0.01" value={item.rate} onChange={(e: any) => updateItem(index, { rate: Number(e.target.value) })} />
                </div>
                <div className="text-right text-sm font-semibold">Amount: {money(Number(item.quantity || 0) * Number(item.rate || 0))}</div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Discount" type="number" min="0" step="0.01" value={form.discount} onChange={(e: any) => setForm({ ...form, discount: e.target.value })} />
              <Input label="Tax amount" type="number" min="0" step="0.01" value={form.tax_amount} onChange={(e: any) => setForm({ ...form, tax_amount: e.target.value })} />
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><b>{money(subtotal)}</b></div>
              <div className="flex justify-between"><span>Discount</span><b>{money(discount)}</b></div>
              <div className="flex justify-between"><span>Tax</span><b>{money(tax)}</b></div>
              <div className="border-t pt-2 flex justify-between text-lg"><span>Total</span><b>{money(total)}</b></div>
            </div>

            <Select label="Payment mode" value={form.payment_mode} onChange={(e: any) => setForm({ ...form, payment_mode: e.target.value })}>
              <option>CASH</option>
              <option>UPI</option>
              <option>BANK_TRANSFER</option>
              {kind === 'sales' && <option>CARD</option>}
              <option>CREDIT</option>
            </Select>
          </div>
        )}

        {kind === 'payments' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Transaction" value={form.transaction_type} onChange={(e: any) => setForm({ ...form, transaction_type: e.target.value })}><option>RECEIPT</option><option>PAYMENT</option></Select>
              <Select label="Party" value={form.party_type} onChange={(e: any) => setForm({ ...form, party_type: e.target.value })}><option>CUSTOMER</option><option>VENDOR</option><option>OTHER</option></Select>
            </div>
            <Select label="Party name" value={form.party_id || ''} onChange={(e: any) => setForm({ ...form, party_id: Number(e.target.value) })}>
              {(form.party_type === 'CUSTOMER' ? customers : vendors).map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
            <Input label="Amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e: any) => setForm({ ...form, amount: e.target.value })} />
            <Select label="Payment mode" value={form.payment_mode} onChange={(e: any) => setForm({ ...form, payment_mode: e.target.value })}><option>CASH</option><option>UPI</option><option>BANK_TRANSFER</option><option>CARD</option></Select>
          </>
        )}

        {kind === 'expenses' && (
          <>
            <Select label="Category" value={form.category} onChange={(e: any) => setForm({ ...form, category: e.target.value })}>{['Rent','Electricity','Salary','Transport','Maintenance','Telephone','Internet','Office','Packaging','Miscellaneous'].map((x) => <option key={x}>{x}</option>)}</Select>
            <Input label="Description" value={form.description || ''} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
            <Input label="Amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e: any) => setForm({ ...form, amount: e.target.value })} />
            <Select label="Payment mode" value={form.payment_mode} onChange={(e: any) => setForm({ ...form, payment_mode: e.target.value })}><option>CASH</option><option>UPI</option><option>BANK_TRANSFER</option><option>CARD</option></Select>
          </>
        )}

        <Button type="submit">Save transaction</Button>
      </form>
    </Modal>
  );
}

export function Hotels() {
  const [rows, setRows] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [statement, setStatement] = useState<any>(null);
  const [showBill, setShowBill] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);

  const today = new Date().toISOString().slice(0, 10);

  const [bill, setBill] = useState<any>({
    invoice_number: 'HOTEL-' + Date.now(),
    sale_date: today,
    customer_id: '',
    discount: '0',
    tax_amount: '0',
    items: [],
  });

  const [payment, setPayment] = useState<any>({
    party_type: 'CUSTOMER',
    party_id: '',
    transaction_type: 'RECEIPT',
    amount: '',
    payment_date: today,
    payment_mode: 'BANK_TRANSFER',
    reference_number: '',
  });

  const loadHotels = async () => {
    try {
      const r = await api.get('/hotels');
      setRows(r.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Could not load hotels');
    }
  };

  const loadProducts = async () => {
    try {
      const r = await api.get('/products');
      setProducts(r.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Could not load products');
    }
  };

  useEffect(() => {
    loadHotels();
    loadProducts();
  }, []);

  const openBill = (hotel?: any) => {
    const selected = hotel || rows[0];

    if (!selected) {
      alert('Please create a customer with type HOTEL first.');
      return;
    }

    const firstProduct = products[0];

    setBill({
      invoice_number: 'HOTEL-' + Date.now(),
      sale_date: today,
      customer_id: selected.id,
      discount: '0',
      tax_amount: '0',
      items: firstProduct
        ? [{
            product_id: firstProduct.id,
            quantity: 1,
            rate: Number(firstProduct.selling_price || 0),
            tax_rate: 0,
          }]
        : [],
    });

    setShowBill(true);
  };

  const addBillItem = () => {
    const firstProduct = products[0];

    if (!firstProduct) {
      alert('Please create at least one product first.');
      return;
    }

    setBill((f: any) => ({
      ...f,
      items: [
        ...f.items,
        {
          product_id: firstProduct.id,
          quantity: 1,
          rate: Number(firstProduct.selling_price || 0),
          tax_rate: 0,
        },
      ],
    }));
  };

  const updateBillItem = (index: number, patch: any) => {
    setBill((f: any) => ({
      ...f,
      items: f.items.map((item: any, i: number) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const removeBillItem = (index: number) => {
    setBill((f: any) => ({
      ...f,
      items: f.items.filter((_: any, i: number) => i !== index),
    }));
  };

  const billSubtotal = bill.items.reduce(
    (sum: number, item: any) =>
      sum + Number(item.quantity || 0) * Number(item.rate || 0),
    0
  );

  const billDiscount = Number(bill.discount || 0);
  const billTax = Number(bill.tax_amount || 0);
  const billTotal = Math.max(0, billSubtotal - billDiscount + billTax);

  const saveBill = async (e: any) => {
    e.preventDefault();

    if (!bill.customer_id) {
      alert('Please select a hotel.');
      return;
    }

    if (!bill.items.length) {
      alert('Add at least one item.');
      return;
    }

    try {
      await api.post('/sales', {
        invoice_number: bill.invoice_number,
        sale_date: bill.sale_date,
        customer_id: Number(bill.customer_id),
        payment_mode: 'CREDIT',
        discount: billDiscount,
        tax_amount: billTax,
        subtotal: billSubtotal,
        total_amount: billTotal,
        items: bill.items.map((item: any) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          tax_rate: Number(item.tax_rate || 0),
        })),
      });

      alert('Hotel bill created successfully.');
      setShowBill(false);
      await loadHotels();
    } catch (e: any) {
      alert(e.response?.data?.detail || e.message || 'Could not create hotel bill');
    }
  };

  const openPayment = (hotel: any) => {
    setSelectedHotel(hotel);
    setPayment({
      party_type: 'CUSTOMER',
      party_id: hotel.id,
      transaction_type: 'RECEIPT',
      amount: '',
      payment_date: today,
      payment_mode: 'BANK_TRANSFER',
      reference_number: '',
    });
    setShowPayment(true);
  };

  const savePayment = async (e: any) => {
    e.preventDefault();

    if (!payment.amount || Number(payment.amount) <= 0) {
      alert('Enter a valid payment amount.');
      return;
    }

    try {
      await api.post('/payments', {
        ...payment,
        party_id: Number(payment.party_id),
        amount: Number(payment.amount),
      });

      alert('Payment recorded successfully.');
      setShowPayment(false);
      setSelectedHotel(null);
      await loadHotels();
    } catch (e: any) {
      alert(e.response?.data?.detail || e.message || 'Could not record payment');
    }
  };

  const viewStatement = async (hotel: any) => {
    try {
      const r = await api.get(`/hotels/${hotel.id}/statement`);
      setStatement(r.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Could not load hotel statement');
    }
  };

  return (
    <>
      <Page
        title="Hotels"
        subtitle="Daily supply billing with monthly settlement visibility."
        action={
          <Button onClick={() => openBill()}>
            <Plus size={16} /> New Hotel Bill
          </Button>
        }
      />

      {rows.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center">
          <Building2 size={42} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-semibold text-lg">No hotels found</h3>
          <p className="text-sm text-slate-400 mt-2">
            Add a customer with type HOTEL first.
          </p>
          <Button secondary onClick={() => (location.href = '/customers')}>
            Go to Customers
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rows.map((h) => (
            <div className="bg-white border rounded-2xl p-5" key={h.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{h.name}</div>
                  <div className="text-xs text-slate-400 mt-1">Monthly account</div>
                </div>
                <Building2 className="text-slate-400" />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <Metric k="Current sales" v={money(h.current_month_sales || 0)} />
                <Metric k="Payments" v={money(h.payments_received || 0)} />
                <Metric k="Outstanding" v={money(h.current_outstanding || 0)} />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-6">
                <Button onClick={() => openBill(h)}>
                  <Plus size={15} /> New Bill
                </Button>
                <Button secondary onClick={() => openPayment(h)}>
                  Receive Payment
                </Button>
              </div>

              <button
                type="button"
                onClick={() => viewStatement(h)}
                className="w-full mt-2 border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Monthly Statement
              </button>
            </div>
          ))}
        </div>
      )}

      {showBill && (
        <Modal title="New Hotel Bill" close={() => setShowBill(false)}>
          <form onSubmit={saveBill} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                label="Invoice number"
                required
                value={bill.invoice_number}
                onChange={(e: any) => setBill({ ...bill, invoice_number: e.target.value })}
              />
              <Input
                label="Bill date"
                type="date"
                required
                value={bill.sale_date}
                onChange={(e: any) => setBill({ ...bill, sale_date: e.target.value })}
              />
            </div>

            <Select
              label="Hotel"
              required
              value={bill.customer_id}
              onChange={(e: any) => setBill({ ...bill, customer_id: Number(e.target.value) })}
            >
              <option value="">Select hotel</option>
              {rows.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Select>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Bill Items</div>
                <Button secondary type="button" onClick={addBillItem}>
                  <Plus size={15} /> Add item
                </Button>
              </div>

              {bill.items.length === 0 && (
                <div className="border border-dashed rounded-xl p-5 text-center text-sm text-slate-400">
                  No items added yet.
                </div>
              )}

              {bill.items.map((item: any, index: number) => (
                <div key={index} className="border rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Item {index + 1}</span>
                    {bill.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBillItem(index)}
                        className="text-sm text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <Select
                    label="Product"
                    value={item.product_id || ''}
                    onChange={(e: any) => {
                      const p = products.find((x: any) => x.id == e.target.value);
                      updateBillItem(index, {
                        product_id: Number(e.target.value),
                        rate: Number(p?.selling_price || 0),
                      });
                    }}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} • {money(p.selling_price || 0)}
                      </option>
                    ))}
                  </Select>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e: any) => updateBillItem(index, { quantity: Number(e.target.value) })}
                    />
                    <Input
                      label="Rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e: any) => updateBillItem(index, { rate: Number(e.target.value) })}
                    />
                  </div>

                  <div className="text-right text-sm font-semibold">
                    Amount: {money(Number(item.quantity || 0) * Number(item.rate || 0))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Discount"
                type="number"
                min="0"
                step="0.01"
                value={bill.discount}
                onChange={(e: any) => setBill({ ...bill, discount: e.target.value })}
              />
              <Input
                label="Tax amount"
                type="number"
                min="0"
                step="0.01"
                value={bill.tax_amount}
                onChange={(e: any) => setBill({ ...bill, tax_amount: e.target.value })}
              />
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><b>{money(billSubtotal)}</b></div>
              <div className="flex justify-between"><span>Discount</span><b>{money(billDiscount)}</b></div>
              <div className="flex justify-between"><span>Tax</span><b>{money(billTax)}</b></div>
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <b>{money(billTotal)}</b>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              This bill will be added to the hotel's outstanding monthly account as a credit sale.
            </div>

            <Button type="submit">Create Hotel Bill</Button>
          </form>
        </Modal>
      )}

      {showPayment && selectedHotel && (
        <Modal
          title={`Receive Payment • ${selectedHotel.name}`}
          close={() => {
            setShowPayment(false);
            setSelectedHotel(null);
          }}
        >
          <form onSubmit={savePayment} className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-xs text-slate-500">Current outstanding</div>
              <div className="text-2xl font-bold mt-1">
                {money(selectedHotel.current_outstanding || 0)}
              </div>
            </div>

            <Input
              label="Payment amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={payment.amount}
              onChange={(e: any) => setPayment({ ...payment, amount: e.target.value })}
            />

            <Input
              label="Payment date"
              type="date"
              required
              value={payment.payment_date}
              onChange={(e: any) => setPayment({ ...payment, payment_date: e.target.value })}
            />

            <Select
              label="Payment mode"
              value={payment.payment_mode}
              onChange={(e: any) => setPayment({ ...payment, payment_mode: e.target.value })}
            >
              <option>CASH</option>
              <option>UPI</option>
              <option>BANK_TRANSFER</option>
              <option>CARD</option>
            </Select>

            <Input
              label="Reference number"
              placeholder="Optional"
              value={payment.reference_number}
              onChange={(e: any) => setPayment({ ...payment, reference_number: e.target.value })}
            />

            <Button type="submit">Record Payment</Button>
          </form>
        </Modal>
      )}

      {statement && (
        <Modal
          title={`${statement.hotel.name} • Monthly Statement`}
          close={() => setStatement(null)}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <Metric k="Opening" v={money(statement.opening_balance || 0)} />
              <Metric k="Closing" v={money(statement.closing_balance || 0)} />
              <Metric
                k="Status"
                v={Number(statement.closing_balance || 0) > 0 ? 'Outstanding' : 'Settled'}
              />
            </div>

            <div className="border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(statement.rows || []).map((r: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">{r.date}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-xs">{r.type}</span>
                      </td>
                      <td className="px-4 py-3">{r.reference || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{money(r.amount || 0)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{money(r.balance || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-5">
              <div className="text-sm text-slate-300">Closing Outstanding</div>
              <div className="text-3xl font-bold mt-1">
                {money(statement.closing_balance || 0)}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

const Metric = ({ k, v }: any) => (
  <div>
    <div className="text-xs text-slate-400">{k}</div>
    <div className="font-bold mt-1">{v}</div>
  </div>
);

export function Reconciliation() {
  const [rows, setRows] = useState<any[]>([]);
  const [imported, setImported] = useState('');

  const load = () => api.get('/bank-transactions').then((r) => setRows(r.data));

  useEffect(() => {
    load();
  }, []);

  const imp = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    const r = await api.post('/bank-transactions/import', fd);
    setImported(`${r.data.imported} transactions imported`);
    load();
  };

  const run = async () => {
    const r = await api.post('/reconciliation/run');
    alert(`Reconciliation complete: ${r.data.filter((x: any) => x.status === 'MATCHED').length} matched`);
    load();
  };

  return (
    <>
      <Page
        title="Bank reconciliation"
        subtitle="Deterministic matching by amount, date and reference — no AI required."
        action={
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <span className="px-4 py-2.5 rounded-xl border bg-white text-sm font-semibold flex gap-2 items-center">
                <Upload size={16} /> Import CSV
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={imp} />
            </label>
            <Button onClick={run}>
              <CheckCircle2 size={16} /> Run reconciliation
            </Button>
          </div>
        }
      />
      {imported && <div className="bg-slate-900 text-white rounded-xl px-4 py-3 mb-4 text-sm">{imported}</div>}
      <Table
        headers={['Date', 'Type', 'Amount', 'Reference', 'Description', 'Status']}
        rows={rows.map((x) => [
          x.date,
          x.transaction_type,
          money(x.amount),
          x.reference_number || '—',
          x.description || '—',
          <span className="px-2 py-1 rounded-full bg-slate-100 text-xs">{x.reconciliation_status}</span>,
        ])}
      />
    </>
  );
}

export function Reports({ mode }: any = {}) {
  const [data, setData] = useState<any>();

  useEffect(() => {
    if (mode === 'tax') api.get('/reports/tax-summary').then((r) => setData(r.data));
    else if (mode === 'cash') api.get('/cash-book').then((r) => setData(r.data));
    else if (mode === 'bank') api.get('/bank-transactions').then((r) => setData(r.data));
  }, [mode]);

  if (mode === 'cash')
    return (
      <>
        <Page title="Cash Book" subtitle="Expected cash movement from recorded transactions." />
        <div className="bg-white border rounded-2xl p-6 mb-5">
          <div className="text-sm text-slate-500">Current expected cash</div>
          <div className="text-3xl font-bold mt-2">{money(data?.balance)}</div>
        </div>
        <Table
          headers={['Date', 'Type', 'Description', 'Amount']}
          rows={(data?.transactions || []).map((x: any) => [x.date, x.type, x.description, money(x.amount)])}
        />
      </>
    );

  if (mode === 'bank')
    return (
      <>
        <Page title="Bank / UPI" subtitle="Imported and recorded digital transactions." />
        <Table
          headers={['Date', 'Type', 'Amount', 'Reference', 'Status']}
          rows={(data || []).map((x: any) => [
            x.date,
            x.transaction_type,
            money(x.amount),
            x.reference_number || '—',
            x.reconciliation_status,
          ])}
        />
      </>
    );

  if (mode === 'tax')
    return (
      <>
        <Page title="CA / Tax Summary" subtitle="Accountant support summary for FY 2026-27. Not an official tax filing." />
        <div className="grid md:grid-cols-4 gap-4">
          {[
            ['Total sales', data?.total_sales],
            ['Total purchases', data?.total_purchases],
            ['Expenses', data?.total_expenses],
            ['Receivables', data?.receivables],
            ['Payables', data?.payables],
            ['Cash balance', data?.cash_balance],
            ['Bank balance', data?.bank_balance],
          ].map(([k, v]) => (
            <div className="bg-white border rounded-2xl p-5" key={k as string}>
              <div className="text-xs text-slate-500">{k}</div>
              <div className="text-xl font-bold mt-2">{money(v as number)}</div>
            </div>
          ))}
        </div>
        <div className="bg-white border rounded-2xl p-5 mt-5">
          <b>Monthly sales</b>
          <div className="grid grid-cols-4 md:grid-cols-12 gap-2 mt-5">
            {data?.monthly_sales?.map((x: any) => (
              <div className="text-center" key={x.month}>
                <div className="h-28 flex items-end justify-center">
                  <div
                    className="w-5 bg-slate-900 rounded-t"
                    style={{
                      height: `${Math.max(
                        4,
                        Math.min(
                          100,
                          (x.amount / Math.max(...data.monthly_sales.map((z: any) => z.amount), 1)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-slate-400">{x.month}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-5">
          Financial summary generated from recorded transactions. Please consult your CA/accountant for tax filing and
          compliance.
        </p>
      </>
    );

  return (
    <>
      <Page title="Reports" subtitle="Sales, purchases, expenses, receivables and payables reporting." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          'Daily Sales',
          'Monthly Sales',
          'Purchases',
          'Expenses',
          'Customer Receivables',
          'Vendor Payables',
          'Profit & Loss Summary',
          'Payment Mode Summary',
          'Financial Year Summary',
        ].map((x) => (
          <div className="bg-white border rounded-2xl p-5 hover:border-slate-400" key={x}>
            <div className="font-semibold">{x}</div>
            <div className="text-xs text-slate-400 mt-1">Filter and export from recorded transactions.</div>
          </div>
        ))}
      </div>
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <Page title="Settings" subtitle="Workspace configuration and demo environment." />
      <div className="bg-white border rounded-2xl p-6 max-w-2xl">
        <h3 className="font-semibold">ShopLedger MVP</h3>
        <p className="text-sm text-slate-500 mt-2">
          Designed for interview demonstration: transaction entry, reconciliation, hotel settlement and accountant-ready
          summaries.
        </p>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-xs text-slate-400">Demo account</div>
            <div className="font-medium mt-1">admin@shopledger.local</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-xs text-slate-400">API</div>
            <div className="font-medium mt-1">FastAPI + PostgreSQL</div>
          </div>
        </div>
      </div>
    </>
  );
}

function Modal({ title, close, children }: any) {
  return (
    <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
          <b>{title}</b>
          <button onClick={close} className="text-slate-400">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}