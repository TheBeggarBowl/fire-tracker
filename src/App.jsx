import { useState, useEffect } from "react";

export default function App() {
  const defaultInputs = {
    initial: 500000,
    sip: 10000,
    conservative: 8,
    aggressive: 12,
    startMonth: 6,
    startYear: new Date().getFullYear(),
    projectionYears: 10,
    currency: "INR",
    currentAge: 42,
    desiredFIREAge: 47,
    desiredCoastAge: 45,
    inflation: 6,
    monthlyExpense: 105000,
  };

  const labels = {
    initial: "Initial Investment",
    sip: "Monthly SIP",
    conservative: "Conservative Rate (%)",
    aggressive: "Aggressive Rate (%)",
    startMonth: "Start Month (1-12)",
    startYear: "Start Year",
    projectionYears: "Projection Years",
    currency: "Currency",
    currentAge: "Your Current Age",
    desiredFIREAge: "Target FIRE Age",
    desiredCoastAge: "Target Coast Age",
    inflation: "Inflation Rate (%)",
    monthlyExpense: "Current Monthly Expense",
  };

  const [inputs, setInputs] = useState(() => {
    const stored = Object.keys(defaultInputs).reduce((acc, key) => {
      acc[key] = JSON.parse(localStorage.getItem(key)) ?? defaultInputs[key];
      return acc;
    }, {});
    return stored;
  });

  // ...

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
      <h1 className="text-2xl font-bold">🔥 The Beggar Bowl: FIRE Tracker</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(defaultInputs).map(([key, def]) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium">
              {labels[key] || key}
            </label>
            <input
              type={key === "currency" ? "text" : "number"}
              className="w-full px-2 py-1 border rounded"
              value={inputs[key]}
              onChange={(e) => updateInput(key, e.target.value)}
            />
          </div>
        ))}
      </div>
