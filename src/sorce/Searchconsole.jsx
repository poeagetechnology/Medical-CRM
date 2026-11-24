import React, { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiSearch, FiLoader } from 'react-icons/fi';

export default function Searchconsole() {
  const { data: patients, loading: pLoad } = useCollection('patients');
  const { data: doctors, loading: dLoad } = useCollection('doctors');
  const { data: reports, loading: rLoad } = useCollection('patientReports');

  const [query, setQuery] = useState('');

  const loading = pLoad || dLoad || rLoad;

  const taggedData = [
    ...patients.map(p => ({ ...p, _type: 'Patient' })),
    ...doctors.map(d => ({ ...d, _type: 'Doctor' })),
    ...reports.map(r => ({ ...r, _type: 'Report' })),
  ];

  const results = query.trim()
    ? taggedData.filter(item =>
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const typeColors = {
    Patient: 'bg-blue-100 text-blue-600',
    Doctor: 'bg-green-100 text-green-600',
    Report: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="p-6 space-y-5">

      <div className="bg-white p-4 rounded-xl border shadow-sm relative">
        <FiSearch className="absolute top-1/2 left-7 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients, doctors, reports..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <FiLoader className="animate-spin" /> Loading data...
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">
            {query ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"` : 'Start typing to search...'}
          </h3>
          {results.length === 0 && query ? (
            <p className="text-sm text-gray-400">No results found.</p>
          ) : (
            <div className="space-y-3">
              {results.map((item, i) => (
                <div key={i} className="p-3 border rounded-lg hover:bg-gray-50 flex gap-3 items-start">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${typeColors[item._type]}`}>
                    {item._type}
                  </span>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{item.name || item.patient || '-'}</p>
                    <p className="text-xs text-gray-400">
                      {item._type === 'Patient' && `${item.status} · ${item.doctor} · ${item.room}`}
                      {item._type === 'Doctor' && `${item.dept} · ${item.status}`}
                      {item._type === 'Report' && `${item.type} · ${item.doctor} · ${item.status}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
