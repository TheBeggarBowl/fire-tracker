import { useEffect, useState } from "react";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fireIcons = {
  lean: "🏋️",
  coast: "🦈",
  fire: "🔥",
  fat: "🐋",
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

  useEffect(() => {
    alert(
      `DISCLAIMER 🤪\n\nThis tracker was created by someone who spent their 20s and 30s partying, and suddenly woke up after 40 to realize financial freedom is the need of the hour.\n\nUse it at your own discretion. These are projections to help plan.\nPlan to fail, but don’t fail to plan!\n\nDon’t blame the creator if your life doesn’t match this tracker’s results 🙈\n\nIf you like it and find it useful, spread the word!`
    );
  }, []);

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
    const yearlyToday = monthlyExpense * 12;
    const yearsToFIRE = desiredFIREAge - currentAge;
    const yearsToCoast = desiredCoastAge - currentAge;
    const yearlyExpenses = {};
    let inflationFactor = 1;

    for (let i = 0; i <= projectionYears; i++) {
      yearlyExpenses[startYear + i] = yearlyToday * inflationFactor;
      inflationFactor *= 1 + inflation / 100;
    }

    const yearlyRetirement = yearlyExpenses[startYear + yearsToFIRE];
    const leanTarget = yearlyRetirement * 15;
    const fireTarget = yearlyRetirement * 25;
    const fatTarget = yearlyRetirement * 40;

    const coastFutureValue = yearlyToday * 25 * Math.pow(1 + inflation / 100, yearsToFIRE);
    const coastTarget = coastFutureValue / Math.pow(1 + conservative / 100, desiredFIREAge - desiredCoastAge);

    const targets = {
      lean: leanTarget,
      coast: coastTarget,
      fire: fireTarget,
      fat: fatTarget,
      leanYear: desiredFIREAge,
      coastYear: desiredCoastAge,
      fireYear: desiredFIREAge,
      fatYear: desiredFIREAge,
    };

    const project = (rate) => {
      let portfolio = initial;
      let monthlyRate = rate / 12 / 100;
      let yearlyTotals = {};
      let year = startYear;
      let month = startMonth - 1;
      for (let i = 0; i < totalMonths; i++) {
        portfolio = portfolio * (1 + monthlyRate) + sip;
        month++;
        if (month >= 12) {
          month = 0;
          year++;
        }
        if ((i + 1) % 12 === 0 || i === totalMonths - 1) {
          yearlyTotals[year] = portfolio;
        }
      }
      return yearlyTotals;
    };

    const cons = project(conservative);
    const aggr = project(aggressive);

    setResults({ cons, aggr, targets, yearlyExpenses });
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
    if (val >= t.fat) return "bg-cyan-300";
    if (val >= t.fire) return "bg-green-300";
    if (val >= t.coast) return "bg-blue-300";
    if (val >= t.lean) return "bg-yellow-200";
    return "bg-white";
  };

  const milestoneStatus = (val, t) => {
    if (val >= t.fat) return `${fireIcons.fat} Fat FIRE`;
    if (val >= t.fire) return `${fireIcons.fire} FIRE`;
    if (val >= t.coast) return `${fireIcons.coast} Coast FIRE`;
    if (val >= t.lean) return `${fireIcons.lean} Lean FIRE`;
    return "🧘‍♂️ Not there yet... keep going!";
  };

  const calculateFIREProgressTable = () => {
    const networth = inputs.initial;
    const { lean, coast, fire, fat } = results.targets;
    const { conservative, desiredFIREAge, currentAge } = inputs;

    const fireData = [
      { name: "Lean FIRE", icon: fireIcons.lean, target: lean },
      { name: "Coast FIRE", icon: fireIcons.coast, target: coast },
      { name: "FIRE", icon: fireIcons.fire, target: fire },
      { name: "Fat FIRE", icon: fireIcons.fat, target: fat },
    ];

    return fireData.map(({ name, icon, target }) => {
      const surplus = networth - target;
      const gap = target - networth;
      const yearsLeft = desiredFIREAge - currentAge;
      const reqCAGR =
        gap <= 0
          ? 0
          : ((Math.pow((target - 0.01) / networth, 1 / yearsLeft) - 1) * 100).toFixed(2); // avoid zero division

      return {
        name: `${icon} ${name}`,
        target: formatCurrency(target),
        targetYear: currentYear + yearsLeft,
        gapSurplus: surplus >= 0 ? `Surplus ${formatCurrency(surplus)}` : `Gap ${formatCurrency(gap)}`,
        requiredCAGR: surplus >= 0 ? "Achieved ✅" : `${reqCAGR}%`,
      };
    });
  };

  const labelMap = {
    currency: "Currency (INR/USD)",
    currentAge: "Current Age",
    desiredFIREAge: "Desired FIRE Age",
    desiredCoastAge: "Desired Coast FIRE Age",
    monthlyExpense: "Current Monthly Expenses",
    inflation: "Inflation (%)",
    startMonth: "Starting Month",
    startYear: "Starting Year",
    initial: "Current Net Worth",
    sip: "Monthly Investment",
    projectionYears: "Projection Period (Years)",
    conservative: "Desired Conservative CAGR (%)",
    aggressive: "Desired Aggressive CAGR (%)",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <h1 className="text-3xl font-bold text-center">🔥 The Beggar Bowl's FIRE Tracker</h1>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
        <strong className="text-blue-900">FIRE Milestone Descriptions</strong>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>🏋️ <strong>Lean FIRE</strong>: Basic living expenses, minimal lifestyle</li>
          <li>🦈 <strong>Coast FIRE</strong>: You can stop investing and still retire comfortably at FIRE age (assumes 10% growth)</li>
          <li>🔥 <strong>FIRE</strong>: Comfortable retirement with standard lifestyle</li>
          <li>🐋 <strong>Fat FIRE</strong>: Luxurious retirement with high-end spending</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(defaultInputs).map(([key]) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium">{labelMap[key]}</label>
            {key === "currency" ? (
              <select value={inputs[key]} onChange={(e) => updateInput(key, e.target.value)} className="w-full px-2 py-1 border rounded">
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            ) : key === "startMonth" ? (
              <select value={inputs[key]} onChange={(e) => updateInput(key, e.target.value)} className="w-full px-2 py-1 border rounded">
                {monthNames.map((month, idx) => (
                  <option key={idx + 1} value={idx + 1}>{month}</option>
                ))}
              </select>
            ) : (
              <input type="number" className="w-full px-2 py-1 border rounded" value={inputs[key]} onChange={(e) => updateInput(key, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      {results && (
        <>
          <div className="mt-6 p-4 bg-gray-100 rounded border">
            <h2 className="font-semibold text-lg">🔥 FIRE Progress</h2>
            <table className="w-full mt-2 text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Milestone</th>
                  <th className="border px-2 py-1">Target</th>
                  <th className="border px-2 py-1">Target Year</th>
                  <th className="border px-2 py-1">Gap / Surplus</th>
                  <th className="border px-2 py-1">Required CAGR</th>
                </tr>
              </thead>
              <tbody>
                {calculateFIREProgressTable().map((row, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{row.name}</td>
                    <td className="border px-2 py-1">{row.target}</td>
                    <td className="border px-2 py-1">{row.targetYear}</td>
                    <td className="border px-2 py-1">{row.gapSurplus}</td>
                    <td className="border px-2 py-1">{row.requiredCAGR}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">📊 Projection Summary</h2>
            <table className="w-full mt-2 text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Year</th>
                  <th className="border px-2 py-1">Expenses</th>
                  <th className="border px-2 py-1">Conservative</th>
                  <th className="border px-2 py-1">Aggressive</th>
                  <th className="border px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(results.cons).map((year) => (
                  <tr key={year}>
                    <td className="border px-2 py-1">{year}</td>
                    <td className="border px-2 py-1">{formatCurrency(results.yearlyExpenses[year])}</td>
                    <td className={`border px-2 py-1 ${getColor(results.cons[year], results.targets)}`}>
                      {formatCurrency(results.cons[year])}
                    </td>
                    <td className={`border px-2 py-1 ${getColor(results.aggr[year], results.targets)}`}>
                      {formatCurrency(results.aggr[year])}
                    </td>
                    <td className="border px-2 py-1">
                      {milestoneStatus(results.cons[year], results.targets)}
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
