import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:8000/api'});
api.interceptors.request.use(c=>{const t=localStorage.getItem('shopledger_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c});
export const money=(v:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(v||0);
