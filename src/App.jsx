import { useEffect, useState, useMemo } from "react";

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
  desiredAggressiveCAGR: "Aggressive Growth Rate (%)",
  retirementTaxRate: "Tax at Retirement (%)"
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

// Pure function to determine milestone state for a given value and targets
const getMilestoneState = (val, targets) => {
  const lean = val >= targets.leanTarget;
  const coast = val >= targets.coastTarget;
  const fire = val >= targets.fireTarget;
  const fat = val >= targets.fatTarget;
  return { lean, coast, fire, fat };
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
    retirementTaxRate: 0,
  };

  const [inputs, setInputs] = useState(() => {
    return Object.keys(defaultInputs).reduce((a, k) => {
      a[k] = JSON.parse(localStorage.getItem(k)) ?? defaultInputs[k];
      return a;
    }, {});
  });

  const [results, setResults] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return JSON.parse(savedMode);
    }
    return false;
  });

  useEffect(() => {
    Object.entries(inputs).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  }, [inputs]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    alert(
      `📢 Disclaimer:
This tool offers rough projections and no guaranteed returns - Use it at your own discretion. The creator is not responsible for any anomalies.
Good luck on your FIRE journey! 🔥`
    );
  }, []);

  const update = (k, v) => {
    const numericKeys = [
      "monthlyExpense", "sip", "currentNetWorth", "inflation",
      "projectionYears", "desiredConservativeCAGR",
      "desiredAggressiveCAGR", "currentAge", "desiredFIREAge",
      "desiredCoastAge", "retirementTaxRate"
    ];
    const cleanedValue = typeof v === "string" ? v.replace(/,/g, "") : v;

    setInputs(prev => ({
      ...prev,
      [k]: numericKeys.includes(k) ? Number(cleanedValue) : cleanedValue
    }));
  };

  const validationMessages = useMemo(() => {
    const messages = {};
    if (inputs.currentAge < 0) messages.currentAge = "Age cannot be negative.";
    if (inputs.desiredFIREAge <= inputs.currentAge) messages.desiredFIREAge = "FIRE Age must be greater than Current Age.";
    if (inputs.desiredCoastAge <= inputs.currentAge || inputs.desiredCoastAge >= inputs.desiredFIREAge) {
      messages.desiredCoastAge = "Coast Age must be between Current Age and FIRE Age.";
    }
    if (inputs.monthlyExpense <= 0) messages.monthlyExpense = "Monthly expenses must be positive.";
    if (inputs.inflation < 0) messages.inflation = "Inflation cannot be negative.";
    if (inputs.currentNetWorth < 0) messages.currentNetWorth = "Current corpus cannot be negative.";
    if (inputs.sip < 0) messages.sip = "Monthly SIP cannot be negative.";
    if (inputs.projectionYears <= 0) messages.projectionYears = "Projection years must be positive.";
    if (inputs.desiredConservativeCAGR < 0) messages.desiredConservativeCAGR = "CAGR cannot be negative.";
    if (inputs.desiredAggressiveCAGR < 0) messages.desiredAggressiveCAGR = "CAGR cannot be negative.";
    if (inputs.retirementTaxRate < 0 || inputs.retirementTaxRate >= 100) messages.retirementTaxRate = "Tax rate must be between 0% and 99.9%.";
    
    return messages;
  }, [inputs]);

  const hasValidationErrors = Object.keys(validationMessages).length > 0;

  useEffect(() => {
    if (hasValidationErrors) {
      setResults(null);
      return;
    }

    const {
      sip, currentNetWorth, startMonth, startYear,
      projectionYears, desiredConservativeCAGR,
      desiredAggressiveCAGR, currentAge, desiredFIREAge,
      desiredCoastAge, monthlyExpense, inflation,
      retirementTaxRate
    } = inputs;

    const yearlyExpenses = {};
    let exp = monthlyExpense * 12;
    for (let i = 0; i <= projectionYears; i++) {
      yearlyExpenses[startYear + i] = exp;
      exp *= 1 + inflation / 100;
    }

    let expenseMultiplierDueToTax = 1;
    if (retirementTaxRate < 100) {
      expenseMultiplierDueToTax = 1 / (1 - (retirementTaxRate / 100));
    }

    const targetYearFIRE = startYear + (desiredFIREAge - currentAge);
    const expAtFIRE = yearlyExpenses[targetYearFIRE];

    const leanTarget = expAtFIRE * expenseMultiplierDueToTax * 15;
    const fireTarget = expAtFIRE * expenseMultiplierDueToTax * 25;
    const fatTarget = expAtFIRE * expenseMultiplierDueToTax * 40;

    const yearsBetweenCoastAndFire = desiredFIREAge - desiredCoastAge;
    const coastTarget = (yearsBetweenCoastAndFire > 0) ? fireTarget / Math.pow(1 + desiredConservativeCAGR / 100, yearsBetweenCoastAndFire) : fireTarget;

    const targets = { leanTarget, coastTarget, fireTarget, fatTarget };

    // --- DIAGNOSTIC LOG: Check target values ---
    console.log("Calculated FIRE Targets (Lean, Coast, FIRE, Fat):", {
        lean: leanTarget,
        coast: coastTarget,
        fire: fireTarget,
        fat: fatTarget
    });
    // ------------------------------------------

    const project = (rate, currentAge, desiredFIREAge) => {
      let port = currentNetWorth;
      const monthlyRate = rate / 12 / 100;
      let currentProjectionYear = startYear;
      let currentMonthInProjection = startMonth - 1;

      const yearlyTotals = {};

      for (let m = currentMonthInProjection; m < 12; m++) {
          const projectedMonthAge = currentAge + (currentProjectionYear - startYear);
          const sipForThisMonth = (projectedMonthAge < desiredFIREAge) ? sip : 0;
          port = port * (1 + monthlyRate) + sipForThisMonth;
      }
      yearlyTotals[`${currentProjectionYear}`] = port;

      for (let i = 1; i < projectionYears; i++) {
        currentProjectionYear++;
        const projectedYearAge = currentAge + (currentProjectionYear - startYear);
        const sipForThisYear = (projectedYearAge < desiredFIREAge) ? sip : 0;

        for (let m = 0; m < 12; m++) {
          port = port * (1 + monthlyRate) + sipForThisYear;
        }
        yearlyTotals[`${currentProjectionYear}`] = port;
      }
      return yearlyTotals;
    };

    const consProjections = project(desiredConservativeCAGR, currentAge, desiredFIREAge);
    const aggrProjections = project(desiredAggressiveCAGR, currentAge, desiredFIREAge);

    const findFirstAchievementYear = (projections, milestoneType, targets) => {
      const targetValue = targets[milestoneType];
      for (const yearStr in projections) {
        if (projections[yearStr] >= targetValue) {
          return parseInt(yearStr);
        }
      }
      return null;
    };

    const firstAchievementYears = {
      conservative: {
        lean: findFirstAchievementYear(consProjections, 'leanTarget', targets),
        coast: findFirstAchievementYear(consProjections, 'coastTarget', targets),
        fire: findFirstAchievementYear(consProjections, 'fireTarget', targets),
        fat: findFirstAchievementYear(consProjections, 'fatTarget', targets),
      },
      aggressive: {
        lean: findFirstAchievementYear(aggrProjections, 'leanTarget', targets),
        coast: findFirstAchievementYear(aggrProjections, 'coastTarget', targets),
        fire: findFirstAchievementYear(aggrProjections, 'fireTarget', targets),
        fat: findFirstAchievementYear(aggrProjections, 'fatTarget', targets),
      }
    };

    setResults({
      yearlyExpenses,
      targets,
      cons: consProjections,
      aggr: aggrProjections,
      firstAchievementYears
    });

  }, [
    inputs.sip, inputs.currentNetWorth, inputs.startMonth, inputs.startYear,
    inputs.projectionYears, inputs.desiredConservativeCAGR,
    inputs.desiredAggressiveCAGR, inputs.currentAge, inputs.desiredFIREAge,
    inputs.desiredCoastAge, inputs.monthlyExpense, inputs.inflation,
    inputs.retirementTaxRate, hasValidationErrors
  ]);

  const fmt = (v) => {
    const cur = inputs.currency;
    const sym = cur === "INR" ? "₹" : "$";
    if (v === Infinity || isNaN(v)) return "N/A";

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
    if (!results || !results.targets) return [];

    const currentCorpus = inputs.currentNetWorth;
    const { leanTarget, coastTarget, fireTarget, fatTarget } = results.targets;

    const data = [
      ["🏋️‍♂️ Lean FIRE", leanTarget, inputs.desiredFIREAge],
      ["🦈 Coast FIRE", coastTarget, inputs.desiredCoastAge],
      ["🔥 FIRE", fireTarget, inputs.desiredFIREAge],
      ["🐋 Fat FIRE", fatTarget, inputs.desiredFIREAge],
    ];

    return data.map(([label, tgt, age]) => {
      const gap = currentCorpus - tgt;
      let need;

      const effectiveYears = age - inputs.currentAge;

      if (gap >= 0) {
        need = "Achieved ✅";
      } else if (effectiveYears <= 0 || currentCorpus <= 0 || tgt <= 0) {
        need = "N/A";
      } else {
        const base = tgt / currentCorpus;
        if (base < 0) {
          need = "N/A (Corpus Sign Mismatch)";
        } else if (base === 0) {
          need = "Achieved ✅ (Target is 0)";
        }
        else {
          need = `${((Math.pow(base, 1 / effectiveYears) - 1) * 100).toFixed(1)}%`;
        }
      }
      return { label, tgt, age, year: inputs.startYear + (age - inputs.currentAge), gap, need };
    });
  };

  if (!results && !hasValidationErrors) return null;

  const getMilestoneStatus = (val, targets, pathType, currentYearInProjection, firstAchievementYears) => {
    const { lean, coast, fire, fat } = getMilestoneState(val, targets);
    const pathAchievements = firstAchievementYears[pathType];

    if (pathAchievements.fat && currentYearInProjection >= pathAchievements.fat) {
        return "🎉 Happy Retirement!";
    }

    if (fat) {
        return "🐋 Fat FIRE Achieved";
    }
    if (fire) {
        return "🔥 FIRE Achieved";
    }
    if (coast) {
        return "🦈 Coast FIRE Achieved";
    }
    if (lean) {
        return "🏋️‍♂️ Lean FIRE Achieved";
    }

    if (pathAchievements.fire && currentYearInProjection > pathAchievements.fire) {
        return "🔥 FIRE Achieved (earlier)";
    }
    if (pathAchievements.coast && currentYearInProjection > pathAchievements.coast) {
        return "🦈 Coast FIRE Achieved (earlier)";
    }
    if (pathAchievements.lean && currentYearInProjection > pathAchievements.lean) {
        return "🏋️‍♂️ Lean FIRE Achieved (earlier)";
    }
    
    return "🧭 Keep going!";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans bg-white text-gray-900 dark:bg-gray-800 dark:text-white min-h-screen transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-center text-3xl font-bold flex-grow">
          🔥 Financial Independence and Retire Early (FIRE) Calculator 🔥
        </h1>
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
                className={`mt-1 block w-full border rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${validationMessages[k] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
            ) : (
              <input
                type="number"
                value={inputs[k]}
                onChange={e => update(k, e.target.value)}
                className={`mt-1 block w-full border rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${validationMessages[k] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
            )}
            {validationMessages[k] && (
              <p className="text-red-500 text-xs mt-1">{validationMessages[k]}</p>
            )}
          </div>
        ))}
        <div className="col-span-full text-right mt-4 sm:mt-0">
            <button
                onClick={() => setInputs({ ...defaultInputs })}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
            >
                Reset to Default
            </button>
        </div>
      </div>
      
      {hasValidationErrors && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          <strong>🚫 Input Errors:</strong> Please correct the highlighted fields to proceed with calculations.
        </div>
      )}

      {results && (
        <>
          <div className="bg-gray-100 p-4 rounded dark:bg-gray-700">
            <h2 className="font-semibold text-lg">🔥 FIRE Progress (based on current retirement corpus)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm mt-2 border border-gray-300 dark:border-gray-600 min-w-[600px]">
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
          </div>

          <div className="bg-gray-100 p-4 rounded dark:bg-gray-700">
            <h2 className="font-semibold text-lg">📈 Projected Milestone Achievements (Year milestones are first met) </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm mt-2 border border-gray-300 dark:border-gray-600 min-w-[500px]">
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

                    const yearCons = results.firstAchievementYears.conservative[fireType] ?? "❌";
                    const yearAggr = results.firstAchievementYears.aggressive[fireType] ?? "❌";

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
          </div>

          <h2 className="font-semibold text-lg">📊 Projection Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-2 text-center border border-gray-300 dark:border-gray-600 min-w-[700px]">
              <thead className="bg-gray-200 dark:bg-gray-600">
                <tr>
                  <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Year</th>
                  <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Age</th>
                  <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Expenses</th>
                  <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Conservative Growth</th>
                  <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">FIRE Status (Cons)</th>
                  <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">Aggressive Growth</th>
                  <th className="border px-2 py-1 border-gray-300 dark:border-gray-600">FIRE Status (Aggr)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results.cons).sort(([yrA], [yrB]) => parseInt(yrA) - parseInt(yrB)).map(([yr, consVal]) => {
                  const aggrVal = results.aggr[yr];
                  const currentAgeAtProjection = inputs.currentAge + (parseInt(yr) - inputs.startYear);
                  const currentYearInProjection = parseInt(yr);

                  return (
                    <tr key={yr} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-750">
                      <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{yr}</td>
                      <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{currentAgeAtProjection}</td>
                      <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{fmt(results.yearlyExpenses[yr] || 0)}</td>
                      <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{fmt(consVal)}</td>
                      <td className="border px-2 py-1 text-sm text-left border-gray-300 dark:border-gray-600">
                        {getMilestoneStatus(consVal, results.targets, 'conservative', currentYearInProjection, results.firstAchievementYears)}
                      </td>
                      <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{fmt(aggrVal)}</td>
                      <td className="border px-2 py-1 text-sm text-left border-gray-300 dark:border-gray-600">
                        {getMilestoneStatus(aggrVal, results.targets, 'aggressive', currentYearInProjection, results.firstAchievementYears)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
