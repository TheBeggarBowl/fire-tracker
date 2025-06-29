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

const getMilestoneState = (val, targets) => {
  const lean = val >= targets.leanTarget;
  const coast = val >= targets.coastTarget;
  const fire = val >= targets.fireTarget;
  const fat = val >= targets.fatTarget;
  return { lean, coast, fire, fat };
};

function simulateDrawdown({
  startingCorpus,
  startAge,
  inflationRate,
  annualGrowthRate,
  annualTaxRate,
  initialAnnualExpense,
  maxYears = 60
}) {
  let corpus = startingCorpus;
  let age = startAge;
  let yearsLasted = 0;
  let expense = initialAnnualExpense;

  for (let i = 0; i < maxYears; i++) {
    corpus *= 1 + annualGrowthRate / 100;
    const grossWithdrawal = expense / (1 - annualTaxRate / 100);
    corpus -= grossWithdrawal;
    if (corpus <= 0) break;
    expense *= 1 + inflationRate / 100;
    age++;
    yearsLasted++;
  }

  return { yearsLasted, endAge: age };
}

export default function App() {
  // ... rest of your code untouched

  const getMilestoneStatus = (val, targets, pathType, currentYearInProjection, firstAchievementYears) => {
    const pathAchievements = firstAchievementYears[pathType];
    const fireOrder = ['lean', 'coast', 'fire', 'fat'];
    const fireLabels = {
      lean: "🏋️‍♂️ Lean FIRE",
      coast: "🦈 Coast FIRE",
      fire: "🔥 FIRE",
      fat: "🐋 Fat FIRE"
    };

    if (pathAchievements.fat && currentYearInProjection > pathAchievements.fat) {
      return "🎉 Happy Retirement!";
    }

    const achievedThisYear = fireOrder
      .filter(type => pathAchievements[type] === currentYearInProjection)
      .map(type => `${fireLabels[type]} Achieved`);

    return achievedThisYear.length > 0 ? achievedThisYear.join(", ") : "";
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
  <>
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded relative text-sm dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200">
      <strong>📖 Read This First:</strong> FIRE stands for <em>Financial Independence, Retire Early</em>. This calculator helps you estimate key milestones on your path to early retirement. Please note these are rough projections and not financial advice.
      <button
        className="absolute top-1 right-2 text-xl text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100"
        onClick={() => setShowIntro(false)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>

    <div className="text-center mt-3 text-sm text-gray-700 dark:text-gray-300">
      If this tool saved you time or helped your FIRE planning, consider <br />
      <a
        href="https://coff.ee/thebeggarbowl"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-yellow-800 dark:text-yellow-300 hover:underline mt-1"
      >
        ☕ buying me a coffee
      </a>
      🙏
    </div>
  </>
)}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200">
        <strong>FIRE Milestone Descriptions</strong>
        <ul className="ml-6 list-disc mt-2">
          <li>🏋️‍♂️ Lean FIRE – Early retirement with frugal lifestyle </li>
          <li>🦈 Coast FIRE – Save enough early so that your portfolio can grow (at conservative returns) to meet FIRE needs without further contributions</li>
          <li>🔥 FIRE – Early retirement with comfortable standard of living</li>
          <li>🐋 Fat FIRE – Early retirement with luxurious lifestyle</li>
        </ul>
      </div>
	  <details className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-4 border dark:border-gray-700 w-full sm:w-2/3">
    <summary className="font-medium cursor-pointer text-gray-800 dark:text-gray-200">
  🧾 Key Assumptions Used in Calculations and Projections
</summary>
<ul className="list-disc list-inside mt-2 space-y-1">
  <li>
    <strong>FIRE Corpus Targets</strong>: Lean = 15X, FIRE = 25X, Fat = 40X your expected annual expenses at your desired early retirement age. 
    That’s 15–40X your yearly spending (pre-tax) to sustain retirement. "Corpus" refers to your total invested retirement portfolio.
  </li>
  <li>
    <strong>Inflation</strong>: Annual expenses are assumed to rise at {inputs.inflation}% per year.
  </li>
  <li>
    <strong>Growth Rates</strong>: Portfolio grows at {inputs.desiredConservativeCAGR}% (Conservative) or {inputs.desiredAggressiveCAGR}% (Aggressive) annually. 
    These are nominal rates (not adjusted for inflation).
  </li>
  <li>
    <strong>Monthly Investments</strong>: Contributions continue until the respective milestone is achieved — earlier for Lean and Coast FIRE, and up to your desired early retirement age for FIRE and Fat FIRE.
  </li>
  <li>
    <strong>Post-Retirement Withdrawals</strong>: Withdrawals are taxed at a flat rate of {inputs.retirementTaxRate}% which may vary depending on local tax regulations at the time of retirement. The corpus is considered depleted when funds run out or after 60 years — whichever is earlier.
  </li>
</ul>
  </details>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
 ✏️ You can update the inputs to match your age and finances — this tool will show how your path to FIRE could look, today and in the years ahead. To start over, just hit Reset to Default.
      </p>
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
				type="text"
				inputMode="numeric"
				value={rawInputs[k]}
				onChange={e => update(k, e.target.value)}
				className={`mt-1 block w-full border rounded px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${validationMessages[k] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
			/>

            )}
            {validationMessages[k] && (
              <p className="text-red-500 text-xs mt-1">{validationMessages[k]}</p>
            )}
          </div>
        ))}
	</div>
<div className="col-span-full mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
  
  <button
    onClick={() => {
      setInputs({ ...defaultInputs });
      setRawInputs(Object.keys(defaultInputs).reduce((a, k) => {
        a[k] = defaultInputs[k].toString();
        return a;
      }, {}));
      Object.entries(defaultInputs).forEach(([k, v]) =>
        localStorage.setItem(k, JSON.stringify(v))
      );
    }}
    className="self-start bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
  >
    Reset to Default
  </button>
</div>
      
      {hasValidationErrors && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          <strong>🚫 Input Errors:</strong> Please correct the highlighted fields to proceed with calculations.
        </div>
      )}
	{isLoading && (
  <div className="text-center py-6 text-blue-600 dark:text-blue-300 font-medium">
    🔄 Calculating projections...
  </div>
)}
      {results && (
        <>
          <div className="bg-gray-100 p-4 rounded dark:bg-gray-700">
            <h2 className="font-semibold text-lg">🔥 FIRE Progress (based only on your current corpus — no future contributions) </h2>
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
                      <td className={`border px-2 py-1 border-gray-300 dark:border-gray-600 ${r.gap >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
  {r.gap >= 0 ? `${fmt(Math.abs(r.gap))} Surplus` : `${fmt(Math.abs(r.gap))} Gap`}
</td>
                      <td className="border px-2 py-1 border-gray-300 dark:border-gray-600">{r.need}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded dark:bg-gray-700">
            <h2 className="font-semibold text-lg">📈 Projected Milestone Achievements (based on your current corpus, monthly contributions, and growth projections) </h2>
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
{drawdownResults && (
  <div className="mt-8">
    <h2 className="font-semibold text-lg mb-4">💡 How Long Will Your Money Last After FIRE? </h2>
    <table className="min-w-full bg-white dark:bg-gray-800 border rounded overflow-hidden text-sm">
      <thead className="bg-gray-100 dark:bg-gray-700">
        <tr>
          <th className="px-4 py-2 text-left">FIRE Type</th>
          <th className="px-4 py-2 text-left">Conservative (Age)</th>
          <th className="px-4 py-2 text-left">Aggressive (Age)</th>
        </tr>
      </thead>
      <tbody>
  {["lean", "fire", "fat"].map(type => {
    const cons = drawdownResults.conservative[type];
    const aggr = drawdownResults.aggressive[type];
    const maxYears = 60;

    const formatDuration = (years, endAge) =>
      years >= maxYears
        ? `🌱 Sustainable (till age ${endAge})`
        : `${years} yrs, until age ${endAge}`;

    return (
      <tr key={type} className="border-t dark:border-gray-600">
        <td className="px-4 py-2 capitalize">{type}</td>
        <td className="px-4 py-2">{formatDuration(cons.yearsLasted, cons.endAge)}</td>
        <td className="px-4 py-2">{formatDuration(aggr.yearsLasted, aggr.endAge)}</td>
      </tr>
    );
  })}
</tbody>

    </table>
  </div>
)}
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
    <div className="text-center mt-8 text-sm text-gray-700 dark:text-gray-300">
  If this tool saved you time or helped your FIRE planning, consider <br />
  <a
    href="https://coff.ee/thebeggarbowl"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center text-yellow-800 dark:text-yellow-300 hover:underline mt-1"
  >
    ☕ buying me a coffee
  </a>
  🙏
</div>
	    <footer className="text-center mt-6 text-xs text-gray-600 dark:text-gray-400">
  © 2025 TheBeggarBowl — Personal & non-commercial use only.{' '}
  <a
    href="https://github.com/TheBeggarBowl/fire-tracker/blob/main/License"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 dark:text-blue-400 underline"
  >
    License
  </a>
</footer>
</div>
  );
}
