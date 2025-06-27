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

  const [inputs, setInputs] = useState(() => {
    const stored = Object.keys(defaultInputs).reduce((acc, key) => {
      acc[key] = JSON.parse(localStorage.getItem(key)) ?? defaultInputs[key];
      return acc;
    }, {});
    return stored;
  });

  const [results, setResults] = useState(null);

  useEffect(() => {
    Object.entries(inputs).forEach(([key, value]) =>
      localStorage.setItem(key, JSON.stringify(value))
    );
    calculate();
  }, [inputs]);

  const updateInput = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: key === "currency" ? value : Number(value),
    }));
  };

  const calculate = () => {
    const {
      sip,
      initial,
      startMonth,
      startYear,
      projectionYears,
      conservative,
      aggressive,
      currentAge,
      desiredFIREAge,
      desiredCoastAge,
      monthlyExpense,
      inflation,
    } = inputs;
    const totalMonths = projectionYears * 12;
    const yearsToFIRE = desiredFIREAge - currentAge;
    const yearsToCoast = desiredCoastAge - currentAge;
    const yearlyToday = monthlyExpense * 12;
    const yearlyRetirement =
      yearlyToday * Math.pow(1 + inflation / 100, yearsToFIRE);
    const leanTarget = yearlyRetirement * 15;
    const fireTarget = yearlyRetirement * 25;
    const fatTarget = yearlyRetirement * 40;

    const coastFutureValue =
      yearlyToday * 25 * Math.pow(1 + inflation / 100, yearsToFIRE);
    const coastTarget =
      coastFutureValue /
      Math.pow(1 + conservative / 100, desiredFIREAge - desiredCoastAge);

    const targets = {
      lean: leanTarget,
      coast: coastTarget,
      fire: fireTarget,
      fat: fatTarget,
    };

    const project = (rate) => {
      let portfolio = initial;
      let monthlyRate = rate / 12 / 100;
      let yearlyTotals = {};
      let year = startYear;
      let month = startMonth - 1;

      for (let i = 0; i < totalMonths; i++) {
        portfolio = portfolio * (1 + monthlyRate) + sip;
        month++;
        if (month >= 12) {
          month = 0;
          year++;
        }
        if ((i + 1) % 12 === 0 || i === totalMonths - 1) {
          yearlyTotals[year] = portfolio;
        }
      }
      return yearlyTotals;
    };

    const cons = project(conservative);
    const aggr = project(aggressive);

    setResults({ cons, aggr, targets });
  };

  const formatCurrency = (val) => {
    const currency = inputs?.currency || "INR";
    const locales = currency === "INR" ? "en-IN" : "en-US";
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${Intl.NumberFormat(locales, {
      maximumFractionDigits: 0,
    }).format(val)}`;
  };

  const getColor = (val, t) => {
    if (val >= t.fat) return "bg-cyan-300";
    if (val >= t.fire) return "bg-green-300";
    if (val >= t.coast) return "bg-blue-300";
    if (val >= t.lean) return "bg-yellow-200";
    return "bg-white";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">🔥 The Beggar Bowl: FIRE Tracker</h1>

      {/* Currency Picker */}
      <div className="mb-4">
        <label className="font-medium text-sm mr-2">Select Currency:</label>
        <select
          className="border px-2 py-1 rounded"
          value={inputs.currency}
          onChange={(e) => updateInput("currency", e.target.value)}
        >
          <option value="INR">INR (₹)</option>
          <option value="USD">USD ($)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-
