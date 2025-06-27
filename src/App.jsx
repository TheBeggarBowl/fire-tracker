import { useState, useEffect } from "react";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    setInputs((prev) => ({ ...prev, [key]: isNaN(value) ? value : Number(value) }));
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
    const yearlyRetirement = yearlyToday * Math.pow(1 + inflation / 100, yearsToFIRE);
    const leanTarget = yearlyRetirement * 15;
    const fireTarget = yearlyRetirement * 25;
    const fatTarget = yearlyRetirement * 40;

    const coastFutureValue = yearlyToday * 25 * Math.pow(1 + inflation / 100, yearsToFIRE);
    const coastTarget = coastFutureValue / Math.pow(1 + 10 / 100, desiredFIREAge - desiredCoastAge);

    const targets = {
      lean: { value: leanTarget, year: startYear + yearsToFIRE },
      coast: { value: coastTarget, year: startYear + yearsToCoast },
      fire: { value: fireTarget, year: startYear + yearsToFIRE },
      fat: { value: fatTarget, year: startYear + yearsToFIRE },
    };

    const project = (rate) => {
      let portfolio = initial;
      let monthlyRate = rate / 12 / 100;
      let yearlyTotals = {};
      let expenses = {};
      let year = startYear;
      let month = startMonth - 1;
      let expense = monthlyExpense * 12;

      for (let i = 0; i < totalMonths; i++) {
        portfolio = portfolio * (1 + monthlyRate) + sip;
        month++;
        if (month >= 12) {
          month = 0;
          expenses[year] = expense;
          yearlyTotals[year] = portfolio;
          year++;
          expense *= 1 + inflation / 100;
        }
      }
      return { yearlyTotals, expenses };
    };

    const cons = project(conservative);
    const aggr = project(aggressive);

    setResults({ cons: cons.yearlyTotals, aggr: aggr.yearlyTotals, expenses: cons.expenses, targets });
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
    if (val >= t.fat.value) return "bg-cyan-300";
    if (val >= t.fire.value) return "bg-green-300";
    if (val >= t.coast.value) return "bg-blue-300";
    if (val >= t.lean.value) return "bg-yellow-200";
    return "bg-white";
  };

  const fireProgress = () => {
    const networth = results?.cons?.[inputs.startYear] ?? inputs.initial;
    const { lean, coast, fire, fat } = results.targets;

    const neededGrowthRate = (target) => {
      const yearsLeft = target.year - inputs.startYear;
      return (
        100 *
        (Math.pow(target.value / networth, 1 / yearsLeft) - 1)
      ).toFixed(2);
    };

    const milestone = [fat, fire, coast, lean].find((t) => networth >= t.value);
    const nextMilestone = [lean, coast, fire, fat].find((t) => networth < t.value);

    return (
      <>
        <p>
          Current Net Worth: <strong>{formatCurrency(networth)}</strong>
        </p>
        {milestone ? (
          <p className="mt-1">🎉 You have achieved <strong>{Object.keys(results.targets).find(key => results.targets[key] === milestone).toUpperCase()}</strong> milestone!</p>
        ) : (
          nextMilestone && (
            <>
              <p className="mt-1">Next target: <strong>{formatCurrency(nextMilestone.value)}</strong> by {nextMilestone.year}</p>
              <p className="mt-1 text-sm text-gray-600">Required CAGR from now: <strong>{neededGrowthRate(nextMilestone)}%</strong></p>
            </>
          )
        )}
      </>
    );
  };

  const labelMap = {
    initial: "Current Net Worth",
    sip: "Monthly Investment",
    conservative: "Desired Conservative CAGR (in %)",
    aggressive: "Desired Aggressive CAGR (in %)",
    startMonth: "Start Month",
    startYear: "Start Year",
    projectionYears: "Projection Period (Years)",
    currency: "Currency (INR/USD)",
    currentAge: "Current Age",
    desiredFIREAge: "Desired FIRE Age",
    desiredCoastAge: "Desired Coast FIRE Age",
    inflation: "Inflation (%)",
    monthlyExpense: "Current Monthly Expenses",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      <h1 className="text-2xl font-bold">🔥 The Beggar Bowl's FIRE Tracker</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(defaultInputs).map(([key, def]) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium">{labelMap[key]}</label>
            {key === "currency" ? (
              <select
                value={inputs[key]}
                onChange={(e) => updateInput(key, e.target.value)}
                className="w-full px-2 py-1 border rounded"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            ) : key === "startMonth" ? (
              <select
                value={inputs[key]}
                onChange={(e) => updateInput(key, e.target.value)}
                className="w-full px-2 py-1 border rounded"
              >
                {monthNames.map((month, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {month}
                  </option>
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
          <div className="mt-6 p-4 bg-gray-100 rounded border">
            <h2 className="font-semibold text-lg">🔥 FIRE Progress</h2>
            <div className="text-sm mt-1">{fireProgress()}</div>
          </div>

          <div className="mt-4 text-sm text-gray-800 bg-blue-50 border border-blue-200 rounded p-4">
            <strong className="text-blue-900">FIRE Milestone Descriptions</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Lean FIRE</strong>: Basic living expenses, minimal lifestyle</li>
              <li><strong>Coast FIRE</strong>: You can stop investing and still retire comfortably at your desired age <span className="text-gray-500 italic">(assumes 10% annual return until FIRE age)</span></li>
              <li><strong>FIRE</strong>: Comfortable retirement with standard lifestyle</li>
              <li><strong>Fat FIRE</strong>: Luxurious retirement with high-end spending</li>
            </ul>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">Projection Summary</h2>
            <table className="w-full mt-2 text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Year</th>
                  <th className="border px-2 py-1">Yearly Expenses</th>
                  <th className="border px-2 py-1">Conservative</th>
                  <th className="border px-2 py-1">Aggressive</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(results.cons).map((year) => (
                  <tr key={year}>
                    <td className="border px-2 py-1">{year}</td>
                    <td className="border px-2 py-1 text-gray-600">{formatCurrency(results.expenses[year])}</td>
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
