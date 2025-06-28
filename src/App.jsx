import { useEffect, useState } from "react";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fireIcons = { lean:"🏋️‍♂️", coast:"🦈", fire:"🔥", fat:"🐋" };

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

  useEffect(() => {
    Object.entries(inputs).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
    calculate();
  }, [inputs]);

  useEffect(() => {
    alert(
`📢 Disclaimer:
This tool offers rough projections and not guarantees - Use it at your own discretion. The creator is not responsible for any anomalies.
Good luck on your FIRE journey! 🔥`
    );
  }, []);

  const update = (k,v) => setInputs(prev => ({ ...prev, [k]: isNaN(v)? v : Number(v) }));

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

  // Log initial value
  yearlyTotals[`${year}`] = port;

  for (let i = 0; i < projectionYears * 12; i++) {
    port = port * (1 + monthlyRate) + sip;
    m++;
    if (m >= 12) {
      m = 0;
      year++;
    }
    // Record at end of year (Dec) or at last step
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
      <h1 className="text-center text-3xl font-bold">🔥 FInancial Independence and Retire Early (FIRE) Tracker 🔥</h1>
      {showIntro && (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded relative text-sm">
    <strong>📖 Read This First:</strong> FIRE stands for <em>Financial Independence, Retire Early</em>. This calculator helps you estimate milestones like Lean FIRE (minimalist lifestyle), Coast FIRE (no more investing), FIRE (comfortable retirement), and Fat FIRE (luxury retirement). These are rough projections and not financial advice.
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
          <li>🏋️‍♂️ Lean FIRE – Minimal lifestyle</li>
          <li>🦈 Coast FIRE – Stop investing, work for expenses</li>
          <li>🔥 FIRE – Comfortable standard of living</li>
          <li>🐋 Fat FIRE – Luxurious lifestyle</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {Object.entries(defaultInputs).map(([k]) => (
    <div key={k}>
      <label className="block text-sm font-medium">
        {labelMap[k]}
      </label>
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


      {/* FIRE Progress Table */}
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
            {Object.entries(results.cons).map(([yr,val])=>
              <tr key={yr}>
                <td className="border px-2 py-1">{yr}</td>
                <td className="border px-2 py-1">{fmt(results.yearlyExpenses[yr]||0)}</td>
                <td className="border px-2 py-1">{fmt(val)}</td>
                <td className="border px-2 py-1">{fmt(results.aggr[yr])}</td>
                <td className="border px-2 py-1 text-base font-medium">
  {val >= results.targets.fatTarget
    ? <span className="text-xl">🐋 Fat FIRE</span>
    : val >= results.targets.fireTarget
    ? <span className="text-xl">🔥 FIRE</span>
    : val >= results.targets.coastTarget
    ? <span className="text-xl">🦈 Coast</span>
    : val >= results.targets.leanTarget
    ? <span className="text-xl">🏋️‍♂️ Lean</span>
    : <span className="text-sm text-gray-600">🧭 Keep going!</span>}
</td>

              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
