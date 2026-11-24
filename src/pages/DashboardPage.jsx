import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useCollection } from "../hooks/useCollection";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { FiUsers, FiDollarSign, FiAlertTriangle, FiCalendar, FiLoader } from "react-icons/fi";
import { TrendingUp, TrendingDown } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const parseAmount = (str) => parseInt((str || "0").replace(/[^0-9]/g, ""), 10) || 0;

function buildRevenueData(billing) {
  const totals = {};
  DAYS.forEach((d) => { totals[d] = 0; });
  billing.filter((b) => b.status === "Paid").forEach((b) => {
    if (b.date) {
      const day = DAYS[new Date(b.date).getDay()];
      if (day) totals[day] += parseAmount(b.amount);
    }
  });
  return DAYS.map((name) => ({ name, value: totals[name] }));
}

const PIE_COLORS = ["#ef4444", "#22c55e", "#f59e0b"];

const statConfigs = [
  { key: "patients",     label: "Total Patients",  trend: "+12%", up: true,  color: "blue",   icon: FiUsers },
  { key: "emergency",    label: "Critical Cases",  trend: "-3%",  up: false, color: "red",    icon: FiAlertTriangle },
  { key: "revenue",      label: "Revenue (Paid)",  trend: "+18%", up: true,  color: "green",  icon: FiDollarSign },
  { key: "appointments", label: "Appointments",    trend: "+6%",  up: true,  color: "indigo", icon: FiCalendar },
];

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-500",   ring: "ring-blue-100" },
  red:    { bg: "bg-red-50",    icon: "text-red-500",    ring: "ring-red-100" },
  green:  { bg: "bg-emerald-50",icon: "text-emerald-500",ring: "ring-emerald-100" },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-500", ring: "ring-indigo-100" },
};

function StatusBadge({ status }) {
  const styles = {
    Critical:    "bg-red-100 text-red-600",
    Stable:      "bg-green-100 text-green-600",
    Checkup:     "bg-amber-100 text-amber-600",
    Observation: "bg-amber-100 text-amber-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { data: patients,     loading: pLoading } = useCollection("patients");
  const { data: appointments, loading: aLoading } = useCollection("appointments");
  const { data: billing,      loading: bLoading } = useCollection("billing");

  const loading = pLoading || aLoading || bLoading;

  const critical    = patients.filter((p) => p.status === "Critical").length;
  const stable      = patients.filter((p) => p.status === "Stable").length;
  const other       = patients.filter((p) => !["Critical", "Stable"].includes(p.status)).length;
  const revenue     = billing.filter((b) => b.status === "Paid").reduce((s, b) => s + parseAmount(b.amount), 0);
  const revenueData = buildRevenueData(billing);

  const statValues = {
    patients:     patients.length,
    emergency:    critical,
    revenue,
    appointments: appointments.length,
  };

  const patientPieData = [
    { name: "Critical",  value: critical || 1 },
    { name: "Stable",    value: stable   || 1 },
    { name: "Other",     value: other    || 1 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <FiLoader className="animate-spin" /> Loading live data...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statConfigs.map((item) => {
          const Icon = item.icon;
          const c = colorMap[item.color];
          const val = statValues[item.key];
          return (
            <motion.div
              key={item.key}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {item.key === "revenue"
                    ? `$${val >= 1000 ? Math.round(val / 1000) + "K" : val}`
                    : <CountUp end={val} duration={1.4} />}
                </h2>
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${item.up ? "text-emerald-600" : "text-red-500"}`}>
                  {item.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {item.trend} this week
                </div>
              </div>
              <div className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`${c.icon} text-lg`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Revenue Area Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-700">Revenue Analytics</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">This Week</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                  labelStyle={{ color: "#475569", fontWeight: "600" }}
                />
                <Area dataKey="value" stroke="#6366f1" fill="url(#revenueGradient)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
            <span className="text-xs text-slate-400">{patients.length + appointments.length} events</span>
          </div>
          <div className="space-y-3">
            {patients.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                  {p.name?.[0] || "P"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.status} · {p.doctor}</p>
                </div>
              </div>
            ))}
            {appointments.slice(0, 2).map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs flex-shrink-0">📅</div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{a.patient}</p>
                  <p className="text-xs text-slate-400">Dr. {a.doctor} · {a.time}</p>
                </div>
              </div>
            ))}
            {patients.length === 0 && appointments.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Patient Status + Table Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Patient Status Pie */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Patient Status</h3>
          <p className="text-xs text-slate-400 mb-4">Distribution by condition</p>
          <ResponsiveContainer height={200}>
            <PieChart>
              <Pie data={patientPieData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {patientPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} strokeWidth={0} />)}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {["Critical", "Stable", "Other"].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Patients Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent Patients</h3>
            <span className="text-xs text-slate-400">{patients.length} total</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left px-6 py-3 font-medium">Patient</th>
                <th className="text-left py-3 font-medium">Doctor</th>
                <th className="text-center py-3 font-medium">Room</th>
                <th className="text-center py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                        {p.name?.[0] || "P"}
                      </div>
                      <span className="font-medium text-slate-700">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-500">{p.doctor}</td>
                  <td className="py-3 text-center text-slate-500">{p.room}</td>
                  <td className="py-3 text-center"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No patient records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
