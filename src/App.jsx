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

  // --- Dark Mode State ---
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode from localStorage or system preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      return JSON.parse(savedMode);
    }
    // Check system preference (prefers-color-scheme)
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  // -----------------------

  // States to track achieved milestones for *display logic per path*
  const [conservativeMilestonesAchieved, setConservativeMilestonesAchieved] = useState({
    lean: false,
    coast: false,
    fire: false,
    fat: false,
    all: false,
  });

  const [aggressiveMilestonesAchieved, setAggressiveMilestonesAchieved] = useState({
    lean: false,
    coast: false,
    fire: false,
    fat: false,
    all: false,
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

  // --- Dark Mode Effect ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  // -----------------------

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
      setMilestones = setConservativeMilestonesAchieved;
    } else { // aggressive
      currentMilestones = aggressiveMilestonesAchieved;
      setMilestones = setAggressiveMilestonesAchieved;
    }

    // If "Happy Retirement!" (all milestones) has already been reached for this path,
    // continue to display that for all subsequent years. This is the highest priority.
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
      achievedThisYear.push("🎉 Happy Retirement!"); // Add to current year's achievements for display
      updatedMilestones.all = true; // Mark all as achieved persistently for future years
    }

    // Update the state for the current path if there's any change in achievement flags
    // This prevents unnecessary re-renders if no new milestones were achieved for that year
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
      // Order matters here to show the "highest" achieved status.
      if (currentMilestones.fat) return "🐋 Fat FIRE Achieved";
      if (currentMilestones.fire) return "🔥 FIRE Achieved";
      if (currentMilestones.coast) return "🦈 Coast FIRE Achieved";
      if (currentMilestones.lean) return "🏋️‍♂️ Lean FIRE Achieved";
      return "🧭 Keep going!";
    }
  };


  return (
    // Apply Tailwind's dark mode classes based on the 'dark' class on the html element
    // The bg-white and text-gray-900 are default light mode, dark:bg-gray-800 and dark:text-white are for dark mode
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans bg-white text-gray-900 dark:bg-gray-800 dark:text-white min-h-screen transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-center text-3xl font-bold flex-grow">
          🔥 Financial Independence and Retire Early (FIRE) Calculator 🔥
        </h1>
        {/* Dark Mode Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.325 3.325l-.707.707M6.364 6.364l-.707-.707m12.728 0l-.707-.707M6.364 17.636l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>


      {showIntro && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded relative text-sm dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200">
          <strong>📖 Read This First:</strong> FIRE stands for <em>Financial Independence, Retire Early</em>. This calculator helps you estimate milestones for different scenarios with which you can retire early - 🏋️‍♂️ Lean FIRE – Lean FIRE – Early retirement with frugal lifestyle , 🦈 Coast FIRE – Save early, let investments grow, work only to cover expenses until retirement, 🔥 FIRE – Early retirement with comfortable standard of living and 🐋 Fat FIRE – Early retirement with luxurious lifestyle. These are rough projections and not financial advice.
          <button
            className="absolute top-1 right-2 text-xl text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100"
            onClick={() => setShowIntro(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200">
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
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            ) : (
              <input
                type="number"
                value={inputs[k]}
                onChange={e => update(k, e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-right mt-4">
        <button
          onClick={() => setInputs({ ...defaultInputs })}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
        >
          Reset to Default
        </button>
      </div>

      {/* FIRE Progress Table (based on current net worth) */}
      <div className="bg-gray-100 p-4 rounded dark:bg-gray-700">
        <h2 className="font-semibold text-lg">🔥 FIRE Progress (based on current retirement corpus)</h2>
        <table className="w-full text-center text-sm mt-2 border border-gray-300 dark:border-gray-600">
          <thead className="bg-gray-200 dark:bg-gray-600">
            <tr>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Milestone</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Target</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Target Age / Year</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Gap / Surplus</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Required CAGR</th>
            </tr>
          </thead>
          <tbody>
            {calcFIRE().map((r, i) =>
              <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-750">
                <td className="border px-2 py-1 text-lg border-gray-300 dark:border-gray-600">{r.label}</td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{fmt(r.tgt)}</td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{r.age} / {r.year}</td>
                <td className={`border px-2 py-1 ${r.gap >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} border-gray-300 dark:border-gray-600`}>
                  {fmt(Math.abs(r.gap))}
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{r.need}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Projection Milestone Achievement Table (Year milestone is first met) */}
      <div className="bg-gray-100 p-4 rounded dark:bg-gray-700">
        <h2 className="font-semibold text-lg">📈 Projected Milestone Achievements (Year milestones are first met) </h2>
        <table className="w-full text-center text-sm mt-2 border border-gray-300 dark:border-gray-600">
          <thead className="bg-gray-200 dark:bg-gray-600">
            <tr>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Milestone</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Target</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Conservative Year</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Aggressive Year</th>
            </tr>
          </thead>
          <tbody>
            {["leanTarget", "coastTarget", "fireTarget", "fatTarget"].map((key, i) => {
              const labelParts = key.replace("Target", "").split(/(?=[A-Z])/);
              const fireType = labelParts[0].toLowerCase();
              const label = fireIcons[fireType] + " " + fireType.toUpperCase();

              const tgt = results.targets[key];

              const findYear = (data) =>
                Object.entries(data).find(([, val]) => val >= tgt)?.[0] ?? "❌";

              const yearCons = findYear(results.cons);
              const yearAggr = findYear(results.aggr);

              return (
                <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-750">
                  <td className="border px-2 py-1 text-lg border-gray-300 dark:border-gray-600">{label}</td>
                  <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{fmt(tgt)}</td>
                  <td className={`border px-2 py-1 ${yearCons === "❌" ? "text-red-600 dark:text-red-400" : ""} border-gray-300 dark:border-gray-600`}>{yearCons}</td>
                  <td className={`border px-2 py-1 ${yearAggr === "❌" ? "text-red-600 dark:text-red-400" : ""} border-gray-300 dark:border-gray-600`}>{yearAggr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Projection Summary Table (Detailed yearly breakdown) */}
      <h2 className="font-semibold text-lg">📊 Projection Summary</h2>
      <table className="w-full text-sm mt-2 text-center border border-gray-300 dark:border-gray-600">
        <thead className="bg-gray-200 dark:bg-gray-600">
          <tr>
            <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Year</th>
            <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Age</th> {/* Added Age Column Header */}
            <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Expenses</th>
            <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Conservative Growth</th>
            <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">FIRE Status (Cons)</th>
            <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Aggressive Growth</th>
            <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">FIRE Status (Aggr)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(results.cons).map(([yr, consVal]) => {
            const aggrVal = results.aggr[yr];
            // Calculate age for the current projection year
            const currentAgeAtProjection = inputs.currentAge + (parseInt(yr) - inputs.startYear);

            return (
              <tr key={yr} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-750">
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{yr}</td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{currentAgeAtProjection}</td> {/* Added Age Column Data */}
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{fmt(results.yearlyExpenses[yr] || 0)}</td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{fmt(consVal)}</td>
                <td className="border px-2 py-1 text-sm text-left border-gray-300 dark:border-gray-600">
                  {getMilestoneStatus(consVal, results.targets, 'conservative')}
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{fmt(aggrVal)}</td>
                <td className="border px-2 py-1 text-sm text-left border-gray-300 dark:border-gray-600">
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
