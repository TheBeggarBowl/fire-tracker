import { useEffect, useState } from "react";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fireIcons = { lean: "🏋️‍♂️", coast: "🦈", fire: "🔥", fat: "🐋" };

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
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
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
    // Initialize inputs from localStorage or default values
    return Object.keys(defaultInputs).reduce((a, k) => {
      a[k] = JSON.parse(localStorage.getItem(k)) ?? defaultInputs[k];
      return a;
    }, {});
  });

  const [results, setResults] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  // States to track achieved milestones for *display logic per path*
  const [conservativeMilestonesAchieved, setConservativeMilestonesAchieved] = useState({
    lean: false,
    coast: false,
    fire: false,
    fat: false,
    all: false, // To track if all FIRE types are achieved for "Happy Retirement!"
  });

  const [aggressiveMilestonesAchieved, setAggressiveMilestonesAchieved] = useState({
    lean: false,
    coast: false,
    fire: false,
    fat: false,
    all: false, // To track if all FIRE types are achieved for "Happy Retirement!"
  });

  // Effect to save inputs to localStorage and recalculate on input change
  useEffect(() => {
    Object.entries(inputs).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
    calculate();
    // Reset milestone achievement flags when inputs change,
    // so the new projection starts fresh.
    setConservativeMilestonesAchieved({ lean: false, coast: false, fire: false, fat: false, all: false });
    setAggressiveMilestonesAchieved({ lean: false, coast: false, fire: false, fat: false, all: false });
  }, [inputs]);

  // Effect to show disclaimer alert on initial load
  useEffect(() => {
    alert(
      `📢 Disclaimer:
This tool offers rough projections and no guaranteed returns - Use it at your own discretion. The creator is not responsible for any anomalies.
Good luck on your FIRE journey! 🔥`
    );
  }, []);

  // Handler to update input state
  const update = (k, v) => {
    const numericKeys = ["monthlyExpense", "sip", "currentNetWorth", "inflation", "projectionYears", "desiredConservativeCAGR", "desiredAggressiveCAGR", "currentAge", "desiredFIREAge", "desiredCoastAge"];
    const cleanedValue = typeof v === "string" ? v.replace(/,/g, "") : v;

    setInputs(prev => ({
      ...prev,
      [k]: numericKeys.includes(k) ? Number(cleanedValue) : cleanedValue
    }));
  };

  // Core calculation logic
  const calculate = () => {
    const {
      sip, currentNetWorth, startMonth, startYear,
      projectionYears, desiredConservativeCAGR,
      desiredAggressiveCAGR, currentAge, desiredFIREAge,
      desiredCoastAge, monthlyExpense, inflation
    } = inputs;

    // Calculate yearly expenses with inflation
    const yearlyExpenses = {};
    let exp = monthlyExpense * 12; // Annual expenses in the start year
    for (let i = 0; i <= projectionYears; i++) {
      yearlyExpenses[startYear + i] = exp;
      exp *= 1 + inflation / 100; // Inflate for the next year
    }

    // Calculate FIRE targets
    const targetYearFIRE = startYear + (desiredFIREAge - currentAge);
    const expAtFIRE = yearlyExpenses[targetYearFIRE]; // Expenses at target FIRE age

    // Targets based on multiples of annual expenses at FIRE age
    const leanTarget = expAtFIRE * 15;
    const fireTarget = expAtFIRE * 25;
    const fatTarget = expAtFIRE * 40;

    // Coast FIRE target: Calculate future FIRE target and discount it back to Coast FIRE age
    const futureFireCorpus = (monthlyExpense * 12) * 25 * Math.pow(1 + inflation / 100, desiredFIREAge - currentAge);
    const coastTarget = futureFireCorpus / Math.pow(1 + desiredConservativeCAGR / 100, desiredFIREAge - desiredCoastAge);

    const targets = { leanTarget, coastTarget, fireTarget, fatTarget };

    // Function to project portfolio growth
    const project = (rate) => {
      let port = currentNetWorth;
      const monthlyRate = rate / 12 / 100;
      let year = startYear, m = startMonth - 1; // monthNames is 0-indexed, startMonth is 1-indexed
      const yearlyTotals = {};
      yearlyTotals[`${year}`] = port; // Initial portfolio at the start of the first year

      for (let i = 0; i < projectionYears * 12; i++) {
        port = port * (1 + monthlyRate) + sip;
        m++;
        if (m >= 12) { // End of a year
          m = 0; // Reset month for next year
          year++;
          yearlyTotals[`${year}`] = port; // Store year-end balance
        }
      }
      return yearlyTotals;
    };

    // Set calculated results
    setResults({
      yearlyExpenses,
      targets,
      cons: project(desiredConservativeCAGR),
      aggr: project(desiredAggressiveCAGR)
    });
  };

  // Formatter for currency display
  const fmt = (v) => {
    const cur = inputs.currency;
    const sym = cur === "INR" ? "₹" : "$";
    if (cur === "INR") {
      // Indian numbering system (Lakhs and Crores)
      if (v >= 1e7) return `${sym}${(v / 1e7).toFixed(2)} Cr`;
      if (v >= 1e5) return `${sym}${(v / 1e5).toFixed(2)} L`;
      return `${sym}${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    } else {
      // US numbering system (Thousands and Millions)
      if (v >= 1e6) return `${sym}${(v / 1e6).toFixed(2)}M`;
      if (v >= 1e3) return `${sym}${(v / 1e3).toFixed(2)}K`;
      return `${sym}${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
  };

  // Calculates current FIRE progress
  const calcFIRE = () => {
    const currentCorpus = inputs.currentNetWorth;
    const yearsToFIRE = inputs.desiredFIREAge - inputs.currentAge;
    const { leanTarget, coastTarget, fireTarget, fatTarget } = results.targets; // Assumes results is not null here

    // Data for the current progress table
    const data = [
      ["🏋️‍♂️ Lean FIRE", leanTarget, inputs.desiredFIREAge],
      ["🦈 Coast FIRE", coastTarget, inputs.desiredCoastAge],
      ["🔥 FIRE", fireTarget, inputs.desiredFIREAge],
      ["🐋 Fat FIRE", fatTarget, inputs.desiredFIREAge],
    ];

    return data.map(([label, tgt, age]) => {
      const gap = currentCorpus - tgt; // Surplus (+) or deficit (-)
      let need;
      if (gap >= 0) {
        need = "Achieved ✅";
      } else if (currentCorpus <= 0) { // Avoid division by zero or negative currentCorpus
        need = "N/A"; // Or some other appropriate message
      }
      else {
        // Calculate required CAGR to reach target in yearsToFIRE
        // Formula: ((Target / Current)^(1/Years) - 1) * 100
        // Ensure yearsToFIRE is positive to avoid issues
        const effectiveYears = age - inputs.currentAge; // Years to target age for this specific milestone
        need = effectiveYears > 0 ? `${((Math.pow(tgt / currentCorpus, 1 / effectiveYears) - 1) * 100).toFixed(1)}%` : "N/A";
      }
      return { label, tgt, age, year: inputs.startYear + (age - inputs.currentAge), gap, need };
    });
  };

  // Render nothing until results are calculated
  if (!results) return null;

  // Function to determine and display FIRE status for each projected year
  const getMilestoneStatus = (val, targets, pathType) => {
    let currentMilestones;
    let setMilestones;

    // Select the correct state and setter based on the path (conservative/aggressive)
    if (pathType === 'conservative') {
      currentMilestones = conservativeMilestonesAchieved;
      setMilestones = setConservativeMilestonesAchaged;
    } else { // aggressive
      currentMilestones = aggressiveMilestonesAchieved;
      setMilestones = setAggressiveMilestonesAchieved;
    }

    // If "Happy Retirement!" (all milestones) has already been reached for this path,
    // continue to display that for all subsequent years.
    if (currentMilestones.all) {
      return "🎉 Happy Retirement!";
    }

    const achievedThisYear = []; // Stores milestones newly achieved in THIS specific year
    let updatedMilestones = { ...currentMilestones }; // Create a mutable copy of the current state

    // Check for each milestone. If value meets target AND it hasn't been achieved yet,
    // mark it as achieved for this year and update the persistent flags.
    if (val >= targets.leanTarget && !updatedMilestones.lean) {
      achievedThisYear.push("🏋️‍♂️ Lean FIRE");
      updatedMilestones.lean = true;
    }
    if (val >= targets.coastTarget && !updatedMilestones.coast) {
      achievedThisYear.push("🦈 Coast FIRE");
      updatedMilestones.coast = true;
    }
    if (val >= targets.fireTarget && !updatedMilestones.fire) {
      achievedThisYear.push("🔥 FIRE");
      updatedMilestones.fire = true;
    }
    if (val >= targets.fatTarget && !updatedMilestones.fat) {
      achievedThisYear.push("🐋 Fat FIRE");
      updatedMilestones.fat = true;
    }

    // After checking all individual milestones, check if all are now achieved.
    // This is for the "Happy Retirement!" condition.
    if (updatedMilestones.lean && updatedMilestones.coast && updatedMilestones.fire && updatedMilestones.fat && !updatedMilestones.all) {
        achievedThisYear.push("🎉 Happy Retirement!"); // Add to current year's achievements
        updatedMilestones.all = true; // Mark all as achieved persistently
    }

    // Update the state for the current path if there's any change in achievement flags
    if (JSON.stringify(currentMilestones) !== JSON.stringify(updatedMilestones)) {
      setMilestones(updatedMilestones);
    }

    // Determine the message to display for this year based on what was achieved
    if (achievedThisYear.length > 0) {
      // If new milestones were achieved this year, display them
      return achievedThisYear.join(", ");
    } else {
      // If no new milestones were achieved this year,
      // display the highest level of FIRE already achieved,
      // or "Keep going!" if none have been achieved yet.
      if (currentMilestones.all) return "🎉 Happy Retirement!"; // Redundant, but good for clarity
      if (currentMilestones.fat) return "🐋 Fat FIRE Achieved";
      if (currentMilestones.fire) return "🔥 FIRE Achieved";
      if (currentMilestones.coast) return "🦈 Coast FIRE Achieved";
      if (currentMilestones.lean) return "🏋️‍♂️ Lean FIRE Achieved";
      return "🧭 Keep going!";
    }
  };


  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
      <h1 className="text-center text-3xl font-bold">
        🔥 Financial Independence and Retire Early (FIRE) Calculator 🔥
      </h1>

      {showIntro && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded relative text-sm">
          <strong>📖 Read This First:</strong> FIRE stands for <em>Financial Independence, Retire Early</em>. This calculator helps you estimate milestones for different scenarios with which you can retire early - 🏋️‍♂️ Lean FIRE – Early retirement with frugal lifestyle , 🦈 Coast FIRE – Save early, let investments grow, work only to cover expenses until retirement, 🔥 FIRE – Early retirement with comfortable standard of living and 🐋 Fat FIRE – Early retirement with luxurious lifestyle. These are rough projections and not financial advice.
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
        {/* Input fields */}
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
      <div className="text-right mt-4">
        <button
          onClick={() => setInputs({ ...defaultInputs })}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reset to Default
        </button>
      </div>

      {/* FIRE Progress Table (based on current net worth) */}
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
            {calcFIRE().map((r, i) =>
              <tr key={i}>
                <td className="border px-2 py-1 text-lg">{r.label}</td>
                <td className="border px-2 py-1">{fmt(r.tgt)}</td>
                <td className="border px-2 py-1">{r.age} / {r.year}</td>
                <td className={`border px-2 py-1 ${r.gap >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {fmt(Math.abs(r.gap))}
                </td>
                <td className="border px-2 py-1">{r.need}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Projection Milestone Achievement Table (Year milestone is first met) */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold text-lg">📈 Projected Milestone Achievements (Year milestones are first met) </h2>
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
              // Extract icon and label from the key
              const labelParts = key.replace("Target", "").split(/(?=[A-Z])/); // Splits "leanTarget" into ["lean", "Target"] etc.
              const fireType = labelParts[0].toLowerCase(); // "lean", "coast", "fire", "fat"
              const label = fireIcons[fireType] + " " + fireType.toUpperCase();

              const tgt = results.targets[key]; // Get the target value from results

              // Helper to find the first year a target is met in a given projection data
              const findYear = (data) =>
                Object.entries(data).find(([, val]) => val >= tgt)?.[0] ?? "❌";

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

      {/* Projection Summary Table (Detailed yearly breakdown) */}
      <h2 className="font-semibold text-lg">📊 Projection Summary</h2>
      <table className="w-full text-sm mt-2 text-center border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-2 py-1">Year</th>
            <th className="border px-2 py-1">Expenses</th>
            <th className="border px-2 py-1">Conservative Growth</th>
            <th className="border px-2 py-1">FIRE Status (Cons)</th>
            <th className="border px-2 py-1">Aggressive Growth</th>
            <th className="border px-2 py-1">FIRE Status (Aggr)</th>
          </tr>
        </thead>
        <tbody>
          {/* Map over conservative results (assuming both have the same years) */}
          {Object.entries(results.cons).map(([yr, consVal]) => {
            const aggrVal = results.aggr[yr]; // Get aggressive value for the same year

            return (
              <tr key={yr}>
                <td className="border px-2 py-1">{yr}</td>
                <td className="border px-2 py-1">{fmt(results.yearlyExpenses[yr] || 0)}</td>
                <td className="border px-2 py-1">{fmt(consVal)}</td>
                <td className="border px-2 py-1 text-sm text-left">
                  {getMilestoneStatus(consVal, results.targets, 'conservative')}
                </td>
                <td className="border px-2 py-1">{fmt(aggrVal)}</td>
                <td className="border px-2 py-1 text-sm text-left">
                  {getMilestoneStatus(aggrVal, results.targets, 'aggressive')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
