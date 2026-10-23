import React, { useState } from 'react';
import { X, Upload, Sparkles, FileJson, AlertCircle, Check } from 'lucide-react';

const PRESETS = [
  {
    name: 'AppointmentAPI (500 Error)',
    data: [
      {
        api_name: "AppointmentAPI",
        response_time_ms: 5500,
        status_code: 500,
        records_returned: 0
      }
    ]
  },
  {
    name: 'High Latency (>3s)',
    data: [
      {
        api_name: "PatientRecordsAPI",
        response_time_ms: 3800,
        status_code: 200,
        records_returned: 120
      }
    ]
  },
  {
    name: 'Zero Records Anomaly',
    data: [
      {
        api_name: "InventorySearchAPI",
        response_time_ms: 180,
        status_code: 200,
        records_returned: 0
      }
    ]
  },
  {
    name: 'Healthy API (No Alert)',
    data: [
      {
        api_name: "AuthService",
        response_time_ms: 95,
        status_code: 200,
        records_returned: 1
      }
    ]
  },
  {
    name: 'Multiple Batch',
    data: [
      {
        api_name: "BillingGateway",
        response_time_ms: 4500,
        status_code: 503,
        records_returned: 0
      },
      {
        api_name: "UserDirectoryAPI",
        response_time_ms: 720,
        status_code: 404,
        records_returned: 0
      },
      {
        api_name: "PaymentSyncAPI",
        response_time_ms: 3100,
        status_code: 200,
        records_returned: 25
      }
    ]
  }
];

export default function JsonInputModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [jsonText, setJsonText] = useState(
    JSON.stringify(PRESETS[0].data, null, 2)
  );
  const [parseError, setParseError] = useState(null);

  if (!isOpen) return null;

  // Validate JSON string
  const handleTextChange = (value) => {
    setJsonText(value);
    try {
      JSON.parse(value);
      setParseError(null);
    } catch (err) {
      setParseError('Invalid JSON format: ' + err.message);
    }
  };

  // Format / Prettify JSON
  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (err) {
      setParseError('Cannot prettify invalid JSON: ' + err.message);
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (presetData) => {
    setJsonText(JSON.stringify(presetData, null, 2));
    setParseError(null);
  };

  // Handle File Upload (.json)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setJsonText(content);
        try {
          JSON.parse(content);
          setParseError(null);
        } catch (err) {
          setParseError('Uploaded file contains invalid JSON: ' + err.message);
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // Submit Handler
  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setParseError(null);
      onSubmit(parsed);
    } catch (err) {
      setParseError('Please fix JSON errors before submitting: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Input API Observations for Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Send custom JSON telemetry data to POST /monitor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Test Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p.data)}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-200 text-slate-300 border border-slate-700/70 transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* JSON Textarea with toolbar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>JSON Payload</span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">
                  (object or array of objects)
                </span>
              </label>

              <div className="flex items-center gap-2">
                {/* Upload File */}
                <label className="cursor-pointer px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition">
                  <Upload className="w-3 h-3" />
                  <span>Upload .json</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Prettify */}
                <button
                  type="button"
                  onClick={handlePrettify}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Format JSON
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={jsonText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={11}
                className="w-full font-mono text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-700/90 text-indigo-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition leading-relaxed resize-y"
                placeholder='[&#10;  {&#10;    "api_name": "MyAPI",&#10;    "response_time_ms": 3200,&#10;    "status_code": 500,&#10;    "records_returned": 0&#10;  }&#10;]'
                spellCheck={false}
              />
            </div>

            {/* Error Message */}
            {parseError ? (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Valid JSON syntax ready for analysis</span>
              </div>
            )}
          </div>

          {/* Expected Fields Explanation */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Observation Fields:</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] mt-1 text-slate-400">
              <div><span className="text-indigo-400">api_name</span>: string (required)</div>
              <div><span className="text-indigo-400">response_time_ms</span>: integer (ms)</div>
              <div><span className="text-indigo-400">status_code</span>: integer (100-599)</div>
              <div><span className="text-indigo-400">records_returned</span>: integer (&ge;0)</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || Boolean(parseError)}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'Analyzing Anomaly...' : 'Run Anomaly Detection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
