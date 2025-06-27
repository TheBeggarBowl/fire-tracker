import { useEffect, useState } from "react";

export default function App() {
  const [growthMode, setGrowthMode] = useState("conservative"); // or "aggressive"
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

  const [inputs, setInputs] = useState(() =>
    Object.keys(defaultInputs).reduce((acc, k) => {
      acc[k] = JSON.parse(localStorage.getItem(k)) ?? defaultInputs[k];
      return acc;
    }, {})
  );

  const [results, setResults] = useState(null);

  useEffect(() => {
    Object.entries(inputs).forEach(([k, v]) =>
      localStorage.setItem(k, JSON.stringify(v))
    );
    calculate();
  }, [inputs]);

  useEffect(() => {
    alert(`📢 Disclaimer:
This tool offers rough projections — not guarantees. Use it at your own discretion. The creator is not responsible for any anomalies.
If you find it helpful, spread the word and Happy Retirement! 🔥`);
  }, []);

  const update = (k, v) =>
    setInputs((prev) => ({ ...prev, [k]: isNaN(v) ? v : Number(v) }));

  const calculate = () => {
    const {
      sip,
      currentNetWorth,
      startMonth,
      startYear,
      projectionYears,
      desiredConservativeCAGR,
      desiredAggressiveCAGR,
      currentAge,
      desiredFIREAge,
      desiredCoastAge,
      monthlyExpense,
      inflation,
    } = inputs;

    const yearlyExpenses = {};
    let exp = monthlyExpense * 12;
    for (let i = 0; i <= projectionYears; i++) {
      yearlyExpenses[startYear + i] = exp;
      exp *= 1 + inflation / 100;
    }

    const expAtFIRE =
      yearlyExpenses[startYear + (desiredFIREAge - currentAge)];
    const leanTarget = expAtFIRE * 15;
    const fireTarget = expAtFIRE * 25;
    const fatTarget = expAtFIRE * 40;
    const coastFuture =
      monthlyExpense * 12 * 25 *
      Math.pow(1 + inflation / 100, desiredFIREAge - currentAge);
    const coastTarget =
      coastFuture *
      Math.pow(
        1 + desiredConservativeCAGR / 100,
        -(desiredFIREAge - desiredCoastAge)
      );

    const targets = {
      leanTarget,
      coastTarget,
      fireTarget,
      fatTarget,
    };

    const project = (rate) => {
      let port = currentNetWorth;
      const monthlyRate = rate / 12 / 100;
      let year = startYear,
        m = startMonth - 1;
      const yearlyTotals = {};
      for (let i = 0; i < projectionYears * 12; i++) {
        port = port * (1 + monthlyRate) + sip;
        m++;
        if (m >= 12) {
          m = 0;
          year++;
        }
        if ((i + 1) % 12 === 0 || i === projectionYears * 12 - 1) {
          yearlyTotals[year] = port;
        }
      }
      return yearlyTotals;
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
      return `${sym}${v.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`;
    } else {
      if (v >= 1e6) return `${sym}${(v / 1e6).toFixed(2)}M`;
      if (v >= 1e3) return `${sym}${(v / 1e3).toFixed(2)}K`;
      return `${sym}${v.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`;
    }
  };

  const calcFutureFIRE = () => {
    const portGrowth =
      growthMode === "aggressive" ? results.aggr : results.cons;
    const milestones = [
      { label: "🏋️‍♂️ Lean FIRE", target: results.targets.leanTarget },
      { label: "🦈 Coast FIRE", target: results.targets.coastTarget },
      { label: "🔥 FIRE", target: results.targets.fireTarget },
      { label: "🐋 Fat FIRE", target: results.targets.fatTarget },
    ];
    return milestones.map(({ label, target }) => {
      const found = Object.entries(portGrowth).find(
        ([, val]) => val >= target
      );
      if (!found)
        return {
          label,
          target,
          age: "-",
          year: "-",
          note: "🚧 Not in projection range",
        };
      const year = parseInt(found[0], 10);
      const age = inputs.currentAge + (year - inputs.startYear);
      return { label, target, year, age };
    });
  };

  const calcFIRE = () => {
    const milestones = [
      { label: "🏋️‍♂️ Lean FIRE", tgt: results.targets.leanTarget },
      { label: "🦈 Coast FIRE", tgt: results.targets.coastTarget },
      { label: "🔥 FIRE", tgt: results.targets.fireTarget },
      { label: "🐋 Fat FIRE", tgt: results.targets.fatTarget },
    ];

    return milestones.map(({ label, tgt }) => {
      const nw = inputs.currentNetWorth;
      const years = inputs.desiredFIREAge - inputs.currentAge;
      const cagr = inputs.desiredConservativeCAGR / 100;
      const requiredCAGR =
        nw >= tgt
          ? 0
          : ((Math.pow(tgt / nw, 1 / years) - 1) * 100).toFixed(2);
      const gap = tgt - nw;
      const need =
        gap <= 0
          ? "✅ Done"
          : requiredCAGR > 50
          ? "🚫 Unrealistic"
          : `${requiredCAGR}%`;
      return {
        label,
        tgt,
        age: inputs.desiredFIREAge,
        year: inputs.startYear + years,
        gap,
        need,
      };
    });
  };

  // ———————————————————————————————————————————————
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
      <h1 className="text-center text-3xl font-bold">
        🔥 FIRE Tracker 🔥
      </h1>

      {/* Your existing input and table code stays identical here… */}

      {/* FIRE Progress Table */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold text-lg">
          🔥 FIRE Progress (based on current net worth)
        </h2>
        <p className="text-xs text-gray-600 italic mb-2">
          🔎 This table considers only your{" "}
          <strong>current retirement corpus</strong> — monthly investments
          are not factored in here.
        </p>
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
            {results && calcFIRE().map((r, i) => (
              <tr key={i}>
                <td className="border px-2 py-1 text-base font-semibold">
                  {r.label}
                </td>
                <td className="border px-2 py-1">{fmt(r.tgt)}</td>
                <td className="border px-2 py-1">{r.age} / {r.year}</td>
                <td
                  className={`border px-2 py-1 ${
                    r.gap >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {fmt(Math.abs(r.gap))}
                </td>
                <td className="border px-2 py-1">{r.need}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Growth Mode */}
      <div className="mb-2 flex items-center gap-4">
        <label className="font-medium text-sm">Growth Mode:</label>
        <select
          value={growthMode}
          onChange={(e) => setGrowthMode(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="conservative">
            Conservative CAGR ({inputs.desiredConservativeCAGR}%)
          </option>
          <option value="aggressive">
            Aggressive CAGR ({inputs.desiredAggressiveCAGR}%)
          </option>
        </select>
      </div>

      {/* Projected Milestones with SIP */}
      <div className="bg-green-50 p-4 rounded mt-6">
        <h2 className="font-semibold text-lg">
          📈 Projected Milestone Achievements (with Monthly Investments)
        </h2>
        <p className="text-xs text-gray-600 italic mb-2">
          ✅ This table includes your monthly contributions and compound
          growth.
        </p>
        <table className="w-full text-center text-sm mt-2 border">
          <thead className="bg-green-200">
            <tr>
              <th className="border px-2 py-1">Milestone</th>
              <th className="border px-2 py-1">Target Corpus</th>
              <th className="border px-2 py-1">Achieved By Age / Year</th>
            </tr>
          </thead>
          <tbody>
            {results && calcFutureFIRE().map((r, i) => (
              <tr key={i}>
                <td className="border px-2 py-1 font-medium">{r.label}</td>
                <td className="border px-2 py-1">{fmt(r.target)}</td>
                <td className="border px-2 py-1">
                  {r.age !== "-"
                    ? `${r.age} / ${r.year}`
                    : r.note}
                </td>
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
