import { useState, useEffect } from "react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FIRE_DESCRIPTIONS = {
  lean: "Lean FIRE: Basic living expenses, minimal lifestyle",
  coast: "Coast FIRE: Invested enough to retire at traditional age without further saving (assumes 10% return)",
  fire: "FIRE: Comfortable retirement with standard lifestyle",
  fat: "Fat FIRE: Luxurious retirement with high spending"
};

export default function App() {
  const defaultInputs = {
    initial: 500000,
    sip: 10000,
    conservative: 8,
    aggressive: 12,
    startMonth: "Jun",
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
    const isNumber = key !== "currency" && key !== "startMonth";
    setInputs((prev) => ({ ...prev, [key]: isNumber ? Number(value) : value }));
  };

  const calculate = () => {
    const {
      sip, initial, startMonth, startYear, projectionYears,
      conservative, aggressive, currentAge, desiredFIREAge,
      desiredCoastAge, monthlyExpense, inflation
    } = inputs;

    const totalMonths = projectionYears * 12;
    const yearsToFIRE = desiredFIREAge - currentAge;
    const yearlyToday = monthlyExpense * 12;
    const yearlyRetirement = yearlyToday * Math.pow(1 + inflation / 100, yearsToFIRE);
    const leanTarget = yearlyRetirement * 15;
    const fireTarget = yearlyRetirement * 25;
    const fatTarget = yearlyRetirement * 40;

    const coastFutureValue = yearlyToday * 25 * Math.pow(1 + inflation / 100, yearsToFIRE);
    const coastTarget = coastFutureValue / Math.pow(1 + conservative / 100, desiredFIREAge - desiredCoastAge);

    const targets = { lean: leanTarget, coast: coastTarget, fire: fireTarget, fat: fatTarget };

    const project = (rate) => {
      let portfolio = initial;
      let monthlyRate = rate / 12 / 100;
      let yearlyTotals = {};
      let year = startYear;
      let month = MONTHS.indexOf(startMonth);

      for (let i = 0; i < totalMonths; i++) {
        portfolio = portfolio * (1 + monthlyRate) + sip;
        if (!yearlyTotals[year]) yearlyTotals[year] = 0;
        yearlyTotals[year] = portfolio;
        month++;
        if (month >= 12) {
          month = 0;
          year++;
        }
      }
      return yearlyTotals;
    };

    setResults({
      cons: project(conservative),
      aggr: project(aggressive),
      targets
    });
  };

  const formatCurrency = (val) => {
    const currency = inputs?.currency || "INR";
    const locales = currency === "INR" ? "en-IN" : "en-US";
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${Intl.NumberFormat(locales, { maximumFractionDigits: 0 }).format(val)}`;
  };

  const getColor = (val, t) => {
    if (val >= t.fat) return "bg-cyan-300";
    if (val >= t.fire) return "bg-green-300";
    if (val >= t.coast) return "bg-blue-300";
    if (val >= t.lean) return "bg-yellow-200";
    return "bg-white";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
      <h1 className="text-2xl font-bold">🔥 The Beggar Bowl: FIRE Tracker</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(defaultInputs).map(([key, def]) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium capitalize">
              {key.replace(/([A-Z])/g, " $1")}
            </label>
            {key === "currency" ? (
              <select
                className="w-full px-2 py-1 border rounded"
                value={inputs[key]}
                onChange={(e) => updateInput(key, e.target.value)}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            ) : key === "startMonth" ? (
              <select
                className="w-full px-2 py-1 border rounded"
                value={inputs[key]}
                onChange={(e) => updateInput(key, e.target.value)}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                className="w-full px-2 py-1 border rounded"
                value={inputs[key]}
                onChange={(e) => updateInput(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {results && (
        <>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">FIRE Milestone Descriptions</h2>
            <ul className="text-sm text-gray-700 space-y-1">
              {Object.entries(FIRE_DESCRIPTIONS).map(([key, text]) => (
                <li key={key}>
                  <strong className="capitalize">{key}:</strong> {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 text-sm text-gray-700">
            <strong>Legend:</strong>
            <div className="flex gap-4 mt-2">
              <span className="bg-yellow-200 px-2 py-1 rounded">Lean FIRE</span>
              <span className="bg-blue-300 px-2 py-1 rounded">Coast FIRE</span>
              <span className="bg-green-300 px-2 py-1 rounded">FIRE</span>
              <span className="bg-cyan-300 px-2 py-1 rounded">FAT FIRE</span>
            </div>
            <p className="mt-2 italic">* Coast FIRE assumes stopping contributions and 10% return until FIRE age.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mt-6">Projection Summary</h2>
            <table className="w-full mt-2 text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Year</th>
                  <th className="border px-2 py-1">Conservative</th>
                  <th className="border px-2 py-1">Aggressive</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(results.cons).map((year) => (
                  <tr key={year}>
                    <td className="border px-2 py-1">{year}</td>
                    <td className={`border px-2 py-1 ${getColor(results.cons[year], results.targets)}`}>
                      {formatCurrency(results.cons[year])}
                    </td>
                    <td className={`border px-2 py-1 ${getColor(results.aggr[year], results.targets)}`}>
                      {formatCurrency(results.aggr[year])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
