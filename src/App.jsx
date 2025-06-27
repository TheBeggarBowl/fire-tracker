import { useEffect, useState } from "react";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const fireIcons = {
  lean: "🏋️", coast: "🦈", fire: "🔥", fat: "🐋"
};

export default function App() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const defaultInputs = {
    currency: "INR",
    currentAge: 40,
    desiredFIREAge: 50,
    desiredCoastAge: 45,
    monthlyExpense: 100000,
    inflation: 6,
    startMonth: currentMonth,
    startYear: currentYear,
    initial: 5000000,
    sip: 100000,
    projectionYears: 20,
    conservative: 12,
    aggressive: 20,
  };

  const [inputs, setInputs] = useState(() => {
    return Object.keys(defaultInputs).reduce((acc, k) => {
      acc[k] = JSON.parse(localStorage.getItem(k)) ?? defaultInputs[k];
      return acc;
    }, {});
  });
  const [results, setResults] = useState(null);

  useEffect(() => {
    Object.entries(inputs).forEach(([k, v]) =>
      localStorage.setItem(k, JSON.stringify(v))
    );
    calculate();
  }, [inputs]);

  useEffect(() => {
    alert(
      `📢 DISCLAIMER:\n\nThis tracker was built by someone who spent their 20s and 30s partying,\nthen woke up after 40 realizing financial freedom is urgent.\n\nUse at your own discretion—these are mere projections.\nPlan to fail, don’t fail to plan!\n\nNo blame if things don’t go as shown 🫠\n\nFound it useful? Spread the word!`
    );
  }, []);

  const updateInput = (k, v) =>
    setInputs((prev) => ({ ...prev, [k]: isNaN(v) ? v : Number(v) }));

  const calculate = () => {
    const {
      sip, initial, startMonth, startYear, projectionYears,
      conservative, aggressive, currentAge,
      desiredFIREAge, desiredCoastAge,
      monthlyExpense, inflation,
    } = inputs;

    // YEARLY EXPENSES PROJECTION
    const yearlyExpenses = {};
    let exp = monthlyExpense * 12;
    for (let i = 0; i <= projectionYears; i++) {
      yearlyExpenses[startYear + i] = exp;
      exp *= 1 + inflation / 100;
    }

    // FIRE TARGETS
    const yrF = startYear + (desiredFIREAge - currentAge);
    const expAtFIRE = yearlyExpenses[yrF];
    const leanTarget = expAtFIRE * 15;
    const fireTarget = expAtFIRE * 25;
    const fatTarget = expAtFIRE * 40;
    const coastFuture = (monthlyExpense * 12) * 25
      * Math.pow(1 + inflation / 100, desiredFIREAge - currentAge);
    const coastTarget = coastFuture / Math.pow(1 + conservative / 100, desiredFIREAge - desiredCoastAge);
    const targets = { leanTarget, fireTarget, fatTarget, coastTarget };

    // PROJECTIONS
    const project = (rate) => {
      let port = initial;
      let monthlyRate = rate / 12 / 100;
      const yearlyTotals = {};
      let year = startYear, m = startMonth - 1;
      for (let i = 0; i < projectionYears * 12; i++) {
        port = port * (1 + monthlyRate) + sip;
        m++;
        if (m >= 12) { m = 0; year++; }
        if ((i + 1) % 12 === 0 || i === projectionYears * 12 - 1) {
          yearlyTotals[year] = port;
        }
      }
      return yearlyTotals;
    };

    const cons = project(conservative);
    const aggr = project(aggressive);
    setResults({ yearlyExpenses, targets, cons, aggr });
  };

  const formatCurrency = (v) => {
    const cur = inputs.currency, sym = cur === "INR" ? "₹" : "$";
    const loc = cur === "INR" ? "en-IN" : "en-US";
    return `${sym}${Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(v)}`;
  };

  const getColor = (v, t) => {
    if (v >= t.fatTarget) return "bg-cyan-300";
    if (v >= t.fireTarget) return "bg-green-300";
    if (v >= t.coastTarget) return "bg-blue-300";
    if (v >= t.leanTarget) return "bg-yellow-200";
    return "bg-white";
  };

  const calcFIRETable = () => {
    const now = inputs.initial;
    const ageYears = inputs.desiredFIREAge - inputs.currentAge;
    const { leanTarget, coastTarget, fireTarget, fatTarget } = results.targets;
    const data = [
      ["💪 Lean FIRE", leanTarget, inputs.desiredFIREAge],
      ["🦈 Coast FIRE", coastTarget, inputs.desiredCoastAge],
      ["🔥 FIRE", fireTarget, inputs.desiredFIREAge],
      ["🐋 Fat FIRE", fatTarget, inputs.desiredFIREAge],
    ];
    return data.map(([label, tgt, targetYr]) => {
      const gap = now - tgt;
      const req =
        gap >= 0
          ? "Achieved ✅"
          : `${((Math.pow(tgt / now, 1 / ageYears) - 1) * 100).toFixed(1)}%`;
      return { label, tgt, targetYr, gap, req };
    });
  };

  if (!results) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans space-y-8">
      <h1 className="text-center text-3xl font-bold">
        🔥 The Beggar Bowl's FIRE Tracker
      </h1>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm">
        <strong>FIRE Milestone Descriptions</strong>
        <ul className="ml-6 list-disc mt-2">
          <li>🏋️ <strong>Lean FIRE</strong>: Basic living expenses</li>
          <li>🦈 <strong>Coast FIRE</strong>: Stop investing, retire at FIRE age</li>
          <li>🔥 <strong>FIRE</strong>: Comfortable retirement</li>
          <li>🐋 <strong>Fat FIRE</strong>: Luxurious retirement</li>
        </ul>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(defaultInputs).map(([k]) => (
          <div key={k}>
            <label className="block text-sm font-medium">
              {k.replace(/([A-Z])/g, " $1")}
            </label>
            {k === "currency" ? (
              <select
                value={inputs[k]}
                onChange={(e) => updateInput(k, e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            ) : k === "startMonth" ? (
              <select
                value={inputs[k]}
                onChange={(e) => updateInput(k, e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              >
                {monthNames.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={inputs[k]}
                onChange={(e) => updateInput(k, e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            )}
          </div>
        ))}
      </div>

      {/* FIRE Progress Table */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold text-lg">🔥 FIRE Progress</h2>
        <table className="w-full text-center text-sm mt-2 border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Milestone</th>
              <th className="border px-2 py-1">Target</th>
              <th className="border px-2 py-1">Target Year</th>
              <th className="border px-2 py-1">Gap/Surplus</th>
              <th className="border px-2 py-1">Req. CAGR</th>
            </tr>
          </thead>
          <tbody>
            {calcFIRETable().map((r, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{r.label}</td>
                <td className="border px-2 py-1">{formatCurrency(r.tgt)}</td>
                <td className="border px-2 py-1">{r.targetYr}</td>
                <td
                  className={`border px-2 py-1 ${
                    r.gap >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {formatCurrency(Math.abs(r.gap))}
                </td>
                <td className="border px-2 py-1">{r.req}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Projection Summary */}
      <div>
        <h2 className="font-semibold text-lg">📊 Projection Summary</h2>
        <table className="w-full text-sm mt-2 text-center border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Year</th>
              <th className="border px-2 py-1">Expenses</th>
              <th className="border px-2 py-1">Conservative</th>
              <th className="border px-2 py-1">Aggressive</th>
              <th className="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(results.cons).map(([yr, val]) => (
              <tr key={yr}>
                <td className="border px-2 py-1">{yr}</td>
                <td className="border px-2 py-1">
                  {formatCurrency(results.yearlyExpenses[yr] || 0)}
                </td>
                <td className={`border px-2 py-1 ${getColor(val, results.targets)}`}>
                  {formatCurrency(val)}
                </td>
                <td className={`border px-2 py-1 ${getColor(results.aggr[yr], results.targets)}`}>
                  {formatCurrency(results.aggr[yr])}
                </td>
                <td className="border px-2 py-1">
                  {val >= results.targets.fatTarget
                    ? fireIcons.fat
                    : val >= results.targets.fireTarget
                    ? fireIcons.fire
                    : val >= results.targets.coastTarget
                    ? fireIcons.coast
                    : val >= results.targets.leanTarget
                    ? fireIcons.lean
                    : "🧭 Keep going!"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
