import { useEffect, useState } from "react";

export default function App() {
  const [growthMode, setGrowthMode] = useState("conservative");

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const labelMap = {
    currency: "Currency",
    currentAge: "Your Current Age",
    desiredFIREAge: "Target Age for FIRE",
    desiredCoastAge: "Target Age for Coast FIRE",
    monthlyExpense: "Monthly Living Expenses (Today)",
    inflation: "Expected Inflation Rate (%)",
    startMonth: "Projection Start Month",
    startYear: "Projection Start Year",
    currentNetWorth: "Current Retirement Corpus",
    sip: "Monthly Investment Contribution",
    projectionYears: "Projection Duration (Years)",
    desiredConservativeCAGR: "Conservative Growth Rate (%)",
    desiredAggressiveCAGR: "Aggressive Growth Rate (%)"
  };

  const now = new Date();
  const defaultInputs = {
    currency: "INR",
    currentAge: 40,
    desiredFIREAge: 50,
    desiredCoastAge: 45,
    monthlyExpense: 100000,
    inflation: 6,
    startMonth: now.getMonth() + 1,
    startYear: now.getFullYear(),
    currentNetWorth: 5000000,
    sip: 100000,
    projectionYears: 20,
    desiredConservativeCAGR: 12,
    desiredAggressiveCAGR: 20,
  };

  const [inputs, setInputs] = useState(() =>
    Object.fromEntries(
      Object.entries(defaultInputs).map(([k, v]) => {
        const stored = localStorage.getItem(k);
        const parsed = stored ? JSON.parse(stored) : v;
        return [k, parsed];
      })
    )
  );

  const [results, setResults] = useState(null);

  useEffect(() => {
    Object.entries(inputs).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
    calculate();
  }, [inputs]);

  useEffect(() => {
    alert(`📢 Disclaimer:
This tool offers rough projections — not guarantees. Use it at your own discretion.
If you find it helpful, spread the word and Happy Retirement! 🔥`);
  }, []);

  const update = (k, v) =>
    setInputs(prev => ({ ...prev, [k]: isNaN(v) ? v : Number(v) }));

  const calculate = () => {
    const {
      sip, currentNetWorth, startMonth, startYear,
      projectionYears, desiredConservativeCAGR,
      desiredAggressiveCAGR, currentAge, desiredFIREAge,
      desiredCoastAge, monthlyExpense, inflation
    } = inputs;

    const yearlyExpenses = {};
    let exp = monthlyExpense * 12;
    for (let i = 0; i <= projectionYears; i++) {
      yearlyExpenses[startYear + i] = exp;
      exp *= 1 + inflation / 100;
    }

    const expAtFIRE = yearlyExpenses[startYear + (desiredFIREAge - currentAge)];
    const leanTarget = expAtFIRE * 15;
    const fireTarget = expAtFIRE * 25;
    const fatTarget = expAtFIRE * 40;
    const coastFuture = monthlyExpense * 12 * 25 *
      Math.pow(1 + inflation / 100, desiredFIREAge - currentAge);
    const coastTarget = coastFuture *
      Math.pow(1 + desiredConservativeCAGR / 100, -(desiredFIREAge - desiredCoastAge));

    const targets = { leanTarget, coastTarget, fireTarget, fatTarget };

    const project = (rate) => {
      let port = currentNetWorth;
      const mr = rate / 12 / 100;
      let y = startYear, m = startMonth - 1;
      const totals = {};
      for (let i = 0; i < projectionYears * 12; i++) {
        port = port * (1 + mr) + sip;
        m++;
        if (m === 12) { m = 0; y++; }
        if ((i + 1) % 12 === 0 || i === projectionYears * 12 - 1) {
          totals[y] = port;
        }
      }
      return totals;
    };

    setResults({
      yearlyExpenses,
      targets,
      cons: project(desiredConservativeCAGR),
      aggr: project(desiredAggressiveCAGR),
    });
  };

  const fmt = (v) => {
    const cur = inputs.currency;
    const sym = cur === "INR" ? "₹" : "$";
    if (cur === "INR") {
      if (v >= 1e7) return `${sym}${(v / 1e7).toFixed(2)} Cr`;
      if (v >= 1e5) return `${sym}${(v / 1e5).toFixed(2)} L`;
      return `${sym}${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    } else {
      if (v >= 1e6) return `${sym}${(v / 1e6).toFixed(2)}M`;
      if (v >= 1e3) return `${sym}${(v / 1e3).toFixed(2)}K`;
      return `${sym}${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
  };

  const calcFIRE = () => {
    return Object.entries(results.targets).map(([key, tgt]) => {
      const age = inputs.desiredFIREAge;
      const year = inputs.startYear + (age - inputs.currentAge);
      const gap = tgt - inputs.currentNetWorth;
      const needed = gap <= 0 ? "✅ Done" : `${((Math.pow(tgt / inputs.currentNetWorth, 1 / (age - inputs.currentAge)) - 1) * 100).toFixed(2)}%`;
      return { key, tgt, age, year, gap, need: needed };
    });
  };

  const calcFutureFIRE = () => {
    const portGrowth = growthMode === "aggressive" ? results.aggr : results.cons;
    return Object.entries(results.targets).map(([key, tgt]) => {
      const found = Object.entries(portGrowth).find(([, v]) => v >= tgt);
      if (!found) return { label: key, target: tgt, age: "-", year: "-", note: "🚧 Not in range" };
      const y = +found[0];
      const a = inputs.currentAge + (y - inputs.startYear);
      return { label: key, target: tgt, year: y, age: a };
    });
  };

  if (!results) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
      <h1 className="text-center text-3xl font-bold">🔥 FIRE Tracker 🔥</h1>

      {/* FIRE Progress */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold text-lg">🔥 FIRE Progress (current net worth)</h2>
        <table className="table-auto w-full text-center text-sm mt-2 border">
          <thead>
            <tr>
              <th>Milestone</th><th>Target</th><th>Age / Year</th><th>Gap/Surplus</th><th>Required CAGR</th>
            </tr>
          </thead>
          <tbody>
            {calcFIRE().map((r, i) => (
              <tr key={i}>
                <td>{r.key}</td>
                <td>{fmt(r.tgt)}</td>
                <td>{r.age} / {r.year}</td>
                <td className={r.gap <= 0 ? "text-green-600" : "text-red-600"}>
                  {fmt(Math.abs(r.gap))}
                </td>
                <td>{r.need}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Growth Mode Switch */}
      <div className="flex items-center gap-4">
        <label>Growth Mode:</label>
        <select value={growthMode} onChange={e => setGrowthMode(e.target.value)}>
          <option value="conservative">Conservative ({inputs.desiredConservativeCAGR}%)</option>
          <option value="aggressive">Aggressive ({inputs.desiredAggressiveCAGR}%)</option>
        </select>
      </div>

      {/* Projected Milestones */}
      <div className="bg-green-50 p-4 rounded">
        <h2 className="font-semibold">📈 Projected Milestones (with SIP)</h2>
        <table className="table-auto w-full text-center text-sm mt-2 border">
          <thead>
            <tr><th>Milestone</th><th>Target</th><th>By Age / Year</th></tr>
          </thead>
          <tbody>
            {calcFutureFIRE().map((r, i) => (
              <tr key={i}>
                <td>{r.label}</td>
                <td>{fmt(r.target)}</td>
                <td>{r.age !== "-" ? `${r.age} / ${r.year}` : r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Projection Summary */}
      <div className="bg-blue-50 p-4 rounded">
        <h2 className="font-semibold">📅 Projection Summary ({growthMode === "aggressive" ? "Aggressive" : "Conservative"} Growth)</h2>
        <table className="table-auto w-full text-center text-sm mt-2 border">
          <thead>
            <tr><th>Year</th><th>Portfolio Value</th></tr>
          </thead>
          <tbody>
            {Object.entries(growthMode === "aggressive" ? results.aggr : results.cons).map(([year, value]) => (
              <tr key={year}>
                <td>{year}</td>
                <td>{fmt(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
