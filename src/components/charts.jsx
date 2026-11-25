// Thin wrappers around recharts so every chart looks the same.
// Axis and grid colours come from CSS (styles/index.css) to follow the theme.
import React from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from './ui';
import { HEX, toneOf } from '../utils/status';

export const SERIES = [HEX.brand, HEX.green, HEX.amber, HEX.violet, HEX.cyan, HEX.red, HEX.blue, HEX.gray];

function TooltipBox({ active, payload, label, format, name }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-surface border border-line rounded-lg shadow-pop px-3 py-2">
      <p className="text-2xs text-fg-subtle">{label || item.name}</p>
      <p className="text-sm font-bold text-fg tabular">
        {format ? format(item.value) : item.value}
        {name && <span className="font-normal text-fg-subtle"> {name}</span>}
      </p>
    </div>
  );
}

const Empty = ({ height }) => (
  <div style={{ height }} className="flex items-center justify-center">
    <EmptyState compact icon={BarChart3} title="No data for this period" />
  </div>
);

const hasData = (data) => data.some((d) => d.value > 0);

export function TrendChart({ data, format, name, color = HEX.brand, height = 260 }) {
  if (!hasData(data)) return <Empty height={height} />;
  const id = `grad-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis axisLine={false} tickLine={false} width={52} allowDecimals={false} tickFormatter={format} />
        <Tooltip content={<TooltipBox format={format} name={name} />} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${id})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ColumnChart({ data, format, name, color = HEX.brand, height = 260, xKey = 'label' }) {
  if (!hasData(data)) return <Empty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} minTickGap={8} />
        <YAxis axisLine={false} tickLine={false} width={52} allowDecimals={false} tickFormatter={format} />
        <Tooltip cursor={{ fillOpacity: 0.08 }} content={<TooltipBox format={format} name={name} />} />
        <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} maxBarSize={42} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Donut with a legend. Slices use status colours when the names are statuses.
export function DonutChart({ data, totalLabel = 'Total', height = 190, format }) {
  const rows = data.filter((d) => d.value > 0);
  if (!rows.length) return <Empty height={height} />;
  const total = rows.reduce((t, d) => t + d.value, 0);
  const colorOf = (d, i) => (toneOf(d.name) !== 'gray' ? HEX[toneOf(d.name)] : SERIES[i % SERIES.length]);

  return (
    <div>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="90%" paddingAngle={rows.length > 1 ? 2 : 0} isAnimationActive={false}>
              {rows.map((d, i) => <Cell key={d.name} fill={colorOf(d, i)} stroke="none" />)}
            </Pie>
            <Tooltip content={<TooltipBox format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-fg tabular">{format ? format(total) : total}</span>
          <span className="text-2xs text-fg-subtle">{totalLabel}</span>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {rows.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-xs text-fg-muted min-w-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorOf(d, i) }} />
            <span className="truncate">{d.name}</span>
            <span className="ml-auto font-bold text-fg tabular">{format ? format(d.value) : d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
