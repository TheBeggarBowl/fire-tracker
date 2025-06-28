import { useEffect, useState } from "react";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fireIcons = { lean:"🏋️‍♂️", coast:"🦈", fire:"🔥", fat:"🐋" };

const labelMap = {
  currency: "Currency",
  currentAge: "Your Current Age",
  desiredFIREAge: "Target Age for Retirement (FIRE)",
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

const formatNumberWithCommas = (value, currency) => {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  const number = Number(value.toString().replace(/,/g, ""));
  if (isNaN(number)) return "";
  return number.toLocaleString(locale);
};

const parseFormattedNumber = (str) => {
  return Number(str.toString().replace(/,/g, ""));
};

export default function App() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const defaultInputs = {
    currency: "INR",
    currentAge: 40,
    desiredFIREAge: 50,
    desiredCoastAge: 45,
    monthlyExpense: 100000,
    inflation: 6,
    startMonth: currentMonth,
    startYear: currentYear,
    currentNetWorth: 5000000,
    sip: 100000,
    projectionYears: 20,
    desiredConservativeCAGR: 12,
    desiredAggressiveCAGR: 20,
  };

  const [inputs, setInputs] = useState(() => {
    return Object.keys(defaultInputs).reduce((a,k)=> {
      a[k] = JSON.parse(localStorage.getItem(k)) ?? defaultInputs[k];
      return a;
    }, {});
  });

  const [results, setResults] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    Object.entries(inputs).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
    calculate();
  }, [inputs]);

  useEffect(() => {
    alert(
`📢 Disclaimer:
This tool offers rough projections and no guaranteed returns - Use it at your own discretion. The creator is not responsible for any anomalies.
Good luck on your FIRE journey! 🔥`
    );
  }, []);

  const update = (k, v) => {
  const numericKeys = ["monthlyExpense", "sip", "currentNetWorth", "inflation", "projectionYears", "desiredConservativeCAGR", "desiredAggressiveCAGR", "currentAge", "desiredFIREAge", "desiredCoastAge"];
  const cleanedValue = typeof v === "string" ? v.replace(/,/g, "") : v;

  setInputs(prev => ({
    ...prev,
    [k]: numericKeys.includes(k) ? Number(cleanedValue) : cleanedValue
  }));
};

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
      exp *= 1 + inflation/100;
    }

    const targetYearFIRE = startYear + (desiredFIREAge - currentAge);
    const expAtFIRE = yearlyExpenses[targetYearFIRE];
    const leanTarget = expAtFIRE * 15;
    const fireTarget = expAtFIRE * 25;
    const fatTarget = expAtFIRE * 40;
    const coastFuture = (monthlyExpense*12)*25 * Math.pow(1 + inflation/100, desiredFIREAge - currentAge);
    const coastTarget = coastFuture / Math.pow(1 + desiredConservativeCAGR/100, desiredFIREAge - desiredCoastAge);

    const targets = { leanTarget, coastTarget, fireTarget, fatTarget };

    const project = (rate) => {
      let port = currentNetWorth;
      const monthlyRate = rate / 12 / 100;
      let year = startYear, m = startMonth - 1;
      const yearlyTotals = {};
      yearlyTotals[`${year}`] = port;
      for (let i = 0; i < projectionYears * 12; i++) {
        port = port * (1 + monthlyRate) + sip;
        m++;
        if (m >= 12) {
          m = 0;
          year++;
        }
        if (m === 11 || i === projectionYears * 12 - 1) {
          yearlyTotals[`${year}`] = port;
        }
      }
      return yearlyTotals;
    };

    setResults({
      yearlyExpenses,
      targets,
      cons: project(desiredConservativeCAGR),
      aggr: project(desiredAggressiveCAGR)
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
    const now = inputs.currentNetWorth;
    const yearsToFIRE = inputs.desiredFIREAge - inputs.currentAge;
    const { leanTarget, coastTarget, fireTarget, fatTarget } = results.targets;
    const data = [
      ["🏋️‍♂️ Lean FIRE", leanTarget, inputs.desiredFIREAge],
      ["🦈 Coast FIRE", coastTarget, inputs.desiredCoastAge],
      ["🔥 FIRE", fireTarget, inputs.desiredFIREAge],
      ["🐋 Fat FIRE", fatTarget, inputs.desiredFIREAge],
    ];
    return data.map(([label,tgt,age]) => {
      const gap = now - tgt;
      const need = gap>=0 ? "Achieved ✅" : `${((Math.pow(tgt/now,1/yearsToFIRE)-1)*100).toFixed(1)}%`;
      return { label, tgt, age, year: inputs.startYear + (age - inputs.currentAge), gap, need };
    });
  };

  if (!results) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
      <h1 className="text-center text-3xl font-bold">
        🔥 Financial Independence and Retire Early (FIRE) Calculator 🔥
      </h1>

      {showIntro && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded relative text-sm">
          <strong>📖 Read This First:</strong> FIRE stands for <em>Financial Independence, Retire Early</em>. This calculator helps you estimate milestones for different scenarios with which you can retire early - 🏋️‍♂️ Lean FIRE – Lean FIRE – Early retirement with frugal lifestyle , 🦈 Coast FIRE – Save early, let investments grow, work only to cover expenses until retirement, 🔥 FIRE – Early retirement with comfortable standard of living and 🐋 Fat FIRE – Early retirement with luxurious lifestyle. These are rough projections and not financial advice.
          <button
            className="absolute top-1 right-2 text-xl text-yellow-700 hover:text-yellow-900"
            onClick={() => setShowIntro(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm">
        <strong>FIRE Milestone Descriptions</strong>
        <ul className="ml-6 list-disc mt-2">
          <li>🏋️‍♂️ Lean FIRE – Early retirement with frugal lifestyle </li>
          <li>🦈 Coast FIRE – Save early, let investments grow, work only to cover expenses until retirement.</li>
          <li>🔥 FIRE – Early retirement with comfortable standard of living</li>
          <li>🐋 Fat FIRE – Early retirement with luxurious lifestyle</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(defaultInputs).map(([k]) => (
          <div key={k}>
            <label className="block text-sm font-medium">{labelMap[k]}</label>
            {(k === "currency" || k === "startMonth") ? (
              <select
                value={inputs[k]}
                onChange={e => update(k, e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              >
                {k === "currency" ? (
                  <>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </>
                ) : (
                  monthNames.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))
                )}
              </select>
            ) : ["monthlyExpense", "sip", "currentNetWorth"].includes(k) ? (
              <input
                type="text"
                value={formatNumberWithCommas(inputs[k], inputs.currency)}
                onChange={e => update(k, parseFormattedNumber(e.target.value))}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            ) : (
              <input
                type="number"
                value={inputs[k]}
                onChange={e => update(k, e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold text-lg">🔥 FIRE Progress (based on current retirement corpus)</h2>
        <table className="w-full text-center text-sm mt-2 border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Milestone</th>
              <th className="border px-2 py-1">Target</th>
              <th className="border px-2 py-1">Target Age / Year</th>
              <th className="border px-2 py-1">Gap / Surplus</th>
              <th className="border px-2 py-1">Required CAGR</th>
            </tr>
          </thead>
          <tbody>
            {calcFIRE().map((r,i)=>
              <tr key={i}>
                <td className="border px-2 py-1 text-lg">{r.label}</td>
                <td className="border px-2 py-1">{fmt(r.tgt)}</td>
                <td className="border px-2 py-1">{r.age} / {r.year}</td>
                <td className={`border px-2 py-1 ${r.gap>=0 ? "text-green-600" : "text-red-600"}`}>
                  {fmt(Math.abs(r.gap))}
                </td>
                <td className="border px-2 py-1">{r.need}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
{/* Projection Milestone Achievement Table */}
<div className="bg-gray-100 p-4 rounded">
  <h2 className="font-semibold text-lg">📈 Projected Milestone Achievements (based on current retirement corpus + projected returns) </h2>
  <table className="w-full text-center text-sm mt-2 border">
    <thead className="bg-gray-200">
      <tr>
        <th className="border px-2 py-1">Milestone</th>
        <th className="border px-2 py-1">Target</th>
        <th className="border px-2 py-1">Conservative Year</th>
        <th className="border px-2 py-1">Aggressive Year</th>
      </tr>
    </thead>
    <tbody>
      {["leanTarget", "coastTarget", "fireTarget", "fatTarget"].map((key, i) => {
        const label = Object.entries(fireIcons).find(([k]) => key.includes(k))?.[1] + " " + key.replace("Target", "").toUpperCase();
        const tgt = results.targets[key];

        const findYear = (data) =>
          Object.entries(data).find(([yr, val]) => val >= tgt)?.[0] ?? "❌";

        const yearCons = findYear(results.cons);
        const yearAggr = findYear(results.aggr);

        return (
          <tr key={i}>
            <td className="border px-2 py-1 text-lg">{label}</td>
            <td className="border px-2 py-1">{fmt(tgt)}</td>
            <td className={`border px-2 py-1 ${yearCons === "❌" ? "text-red-600" : ""}`}>{yearCons}</td>
            <td className={`border px-2 py-1 ${yearAggr === "❌" ? "text-red-600" : ""}`}>{yearAggr}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

      <div>
        <h2 className="font-semibold text-lg">📊 Projection Summary</h2>
        <table className="w-full text-sm mt-2 text-center border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Year</th>
              <th className="border px-2 py-1">Expenses</th>
              <th className="border px-2 py-1">Conservative Growth </th>
              <th className="border px-2 py-1">FIRE Status (Cons growth)</th>
              <th className="border px-2 py-1">Aggressive Growth </th>
              <th className="border px-2 py-1">FIRE Status (Agrressive Growth)</th>
  </tr>
          </thead>
          <tbody>
            {Object.entries(results.cons).map(([yr, consVal]) => {
    const aggrVal = results.aggr[yr];
    const year = parseInt(yr);

    const milestoneCheck = (val) => {
  const statuses = [];
  if (val >= results.targets.leanTarget) statuses.push("🏋️‍♂️ Lean FIRE");
  if (val >= results.targets.coastTarget) statuses.push("🦈 Coast FIRE");
  if (val >= results.targets.fireTarget) statuses.push("🔥 FIRE");
  if (val >= results.targets.fatTarget) statuses.push("🐋 Fat FIRE");

  return statuses.length > 0 ? statuses.join(", ") : "🧭 Keep going!";
};

    const consDone = consVal >= results.targets.fatTarget && consVal >= results.targets.fireTarget;
    const aggrDone = aggrVal >= results.targets.fatTarget && aggrVal >= results.targets.fireTarget;

    return (
      <tr key={yr}>
        <td className="border px-2 py-1">{yr}</td>
        <td className="border px-2 py-1">{fmt(results.yearlyExpenses[yr] || 0)}</td>
        <td className="border px-2 py-1">{fmt(consVal)}</td>
        <td className="border px-2 py-1 text-sm text-left">
          {consDone ? (
            <span className="text-green-700 font-semibold">🎉 Happy Retirement!</span>
          ) : (
            milestoneCheck(consVal)
          )}
        </td>
        <td className="border px-2 py-1">{fmt(aggrVal)}</td>
        <td className="border px-2 py-1 text-sm text-left">
          {aggrDone ? (
            <span className="text-green-700 font-semibold">🎉 Happy Retirement!</span>
          ) : (
            milestoneCheck(aggrVal)
          )}
        </td>
      </tr>
    );
  })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
