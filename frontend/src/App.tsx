import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
} from 'react-router-dom';

import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Users,
  Truck,
  Building2,
  WalletCards,
  Receipt,
  Landmark,
  GitCompare,
  FileBarChart,
  FileSpreadsheet,
  Settings,
  LogOut,
  Search,
  Menu,
  Package,
  IndianRupee,
} from 'lucide-react';

import { Dashboard, Login, Customers, Vendors, Products, Transactions, Hotels, Reconciliation, Reports, SettingsPage } from './pages';

const nav = [
  ['/','Dashboard',LayoutDashboard],
  ['/sales','Sales',ShoppingCart],
  ['/purchases','Purchases',ShoppingBag],
  ['/customers','Customers',Users],
  ['/vendors','Vendors',Truck],

  // Products added here
  ['/products','Products',Package],

  ['/hotels','Hotels',Building2],
  ['/payments','Payments',WalletCards],
  ['/expenses','Expenses',Receipt],
  ['/cash','Cash Book',IndianRupee],
  ['/bank','Bank / UPI',Landmark],
  ['/reconciliation','Reconciliation',GitCompare],
  ['/reports','Reports',FileBarChart],
  ['/tax','CA / Tax Summary',FileSpreadsheet],
  ['/settings','Settings',Settings],
] as const;

function Shell() {
  const [open, setOpen] = useState(true);
  const navg = useNavigate();

  const logout = () => {
    localStorage.clear();
    navg('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#f5f7fb]">

      {/* Sidebar */}
      <aside
        className={`${
          open ? 'w-64' : 'w-20'
        } transition-all bg-[#101827] text-white p-4 hidden md:flex flex-col`}
      >

        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white text-[#101827] flex items-center justify-center font-black">
            SL
          </div>

          {open && (
            <div>
              <div className="font-bold">
                ShopLedger
              </div>

              <div className="text-xs text-slate-400">
                Reconciliation OS
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">

          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                  isActive
                    ? 'bg-white text-[#101827] font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />

              {open && label}
            </NavLink>
          ))}

        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex gap-3 items-center px-3 py-2.5 text-slate-300 hover:text-white"
        >
          <LogOut size={18} />

          {open && 'Sign out'}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">

        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-5 sticky top-0 z-10">

          <div className="flex items-center gap-3">

            <button
              className="hidden md:block p-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setOpen(!open)}
            >
              <Menu size={20} />
            </button>

            <div className="font-semibold text-slate-800">
              Financial workspace
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-500">
              <Search size={15} />
              Search
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
              SA
            </div>

          </div>

        </header>

        {/* Page content */}
        <div className="p-5 md:p-8 max-w-[1600px] mx-auto">

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/customers"
              element={<Customers />}
            />

            <Route
              path="/vendors"
              element={<Vendors />}
            />

            <Route
              path="/products"
              element={<Products />}
            />

            <Route
              path="/sales"
              element={<Transactions kind="sales" />}
            />

            <Route
              path="/purchases"
              element={<Transactions kind="purchases" />}
            />

            <Route
              path="/payments"
              element={<Transactions kind="payments" />}
            />

            <Route
              path="/expenses"
              element={<Transactions kind="expenses" />}
            />

            <Route
              path="/hotels"
              element={<Hotels />}
            />

            <Route
              path="/cash"
              element={<Reports mode="cash" />}
            />

            <Route
              path="/bank"
              element={<Reports mode="bank" />}
            />

            <Route
              path="/reconciliation"
              element={<Reconciliation />}
            />

            <Route
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="/tax"
              element={<Reports mode="tax" />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

          </Routes>

        </div>

      </main>

    </div>
  );
}

export default function App() {

  const [ok, setOk] = useState(
    !!localStorage.getItem('shopledger_token')
  );

  useEffect(() => {

    const h = () => {
      setOk(
        !!localStorage.getItem('shopledger_token')
      );
    };

    window.addEventListener('storage', h);

    return () => {
      window.removeEventListener('storage', h);
    };

  }, []);

  return ok ? <Shell /> : <Login />;
}