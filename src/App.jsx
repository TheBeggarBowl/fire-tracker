import { useEffect, useState } from "react";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fireIcons = { lean:"🏋️", coast:"🦈", fire:"🔥", fat:"🐋" };

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
      `📢 DISCLAIMER:\n\nBuilt by someone who partied through their 20s & 30s,  
then woke up post-40 realizing financial freedom matters.\n\nUse at your own discretion—these are projections.\nPlan to fail, but don’t fail to plan!\n\nNo blame if things don’t match 🙈\n\nFound it useful? Share the love!`
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
      let year = startYear, m = startMonth-1;
      const yearlyTotals = {};
      for (let i = 0; i < projectionYears*12; i++) {
        port = port*(1+monthlyRate) + sip;
        m++;
        if (m>=12) { m=0; year++ }
        if ((i+1)%12===0 || i===projectionYears*12-1) {
          yearlyTotals[year] = port;
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

  const fmt = v => {
    const cur = inputs.currency;
    const sym = cur==="INR" ? "₹" : "$";
    const loc = cur==="INR" ? "en-IN" : "en-US";
    return `${sym}${Intl.NumberFormat(loc,{maximumFractionDigits:0}).format(v)}`;
  };

  const color = (v,t)=>
    v>=t.fatTarget ? "bg-cyan-300":
    v>=t.fireTarget ? "bg-green-300":
    v>=t.coastTarget? "bg-blue-300":
    v>=t.leanTarget?"bg-yellow-200":"bg-white";

  const calcFIRE = () => {
    const now = inputs.currentNetWorth;
    const yearsToFIRE = inputs.desiredFIREAge - inputs.currentAge;
    const { leanTarget, coastTarget, fireTarget, fatTarget } = results.targets;
    const data = [
      ["🏋️ Lean FIRE", leanTarget, inputs.desiredFIREAge],
      ["🦈 Coast FIRE", coastTarget, inputs.desiredCoastAge],
      ["🔥 FIRE", fireTarget, inputs.desiredFIREAge],
      ["🐋 Fat FIRE", fatTarget, inputs.desiredFIREAge],
    ];
    return data.map(([label,tgt,age]) => {
      const gap = now - tgt;
      const need = gap>=0 ? "Achieved ✅" : `${((Math.pow(tgt/now,1/yearsToFIRE)-1)*100).toFixed(1)}%`;
      return { label, tgt, age, year: currentYear + yearsToFIRE, gap, need };
    });
  };

  if (!results) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 font-sans">
      <h1 className="text-center text-3xl font-bold">
        🔥 FIRE Tracker 🔥
      </h1>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm">
        <strong>FIRE Milestone Descriptions</strong>
        <ul className="ml-6 list-disc mt-2">
          <li>🏋️ Lean FIRE: Minimalist Lifestyle | Contented retirement </li>
          <li>🦈 Stop Contributing to retirement savings | Still work through for day to day expenses until FIRE age </li>
          <li>🔥 FIRE: Moderate Lifestyle | Comfortable retirement </li>
          <li>🐋 Fat FIRE: Luxuirous Lifestyle | no financial worry </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(defaultInputs).map(([k]) => (
          <div key={k}>
            <label className="block text-sm font-medium">
              {k.replace(/([A-Z])/g, " $1")}
            </label>
            {(k==="currency"||k==="startMonth") ?
              <select
                value={inputs[k]}
                onChange={e => update(k, e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1">
                {k==="currency"?
                  <><option>₹ INR</option><option>$ USD</option></>
                :
                  monthNames.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
            :
              <input
                type="number"
                value={inputs[k]}
                onChange={e => update(k, e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            }
          </div>
        ))}
      </div>

      {/* FIRE Progress */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold text-lg">🔥 FIRE Progress (based on current net worth)</h2>
        <table className="w-full text-center text-sm mt-2 border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Milestone</th>
              <th className="border px-2 py-1">Target</th>
              <th className="border px-2 py-1">Target Age / Year</th>
              <th className="border px-2 py-1">Gap/Surplus</th>
              <th className="border px-2 py-1">Req. CAGR</th>
            </tr>
          </thead>
          <tbody>
            {calcFIRE().map((r,i)=>
              <tr key={i}>
                <td className="border px-2 py-1">{r.label}</td>
                <td className="border px-2 py-1">{fmt(r.tgt)}</td>
                <td className="border px-2 py-1">{r.age} / {r.year}</td>
                <td className={`border px-2 py-1 ${(r.gap>=0 ? "text-green-700":"text-red-700")}`}>
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
                <td className={`border px-2 py-1 ${color(val,results.targets)}`}>{fmt(val)}</td>
                <td className={`border px-2 py-1 ${color(results.aggr[yr],results.targets)}`}>{fmt(results.aggr[yr])}</td>
                <td className="border px-2 py-1">
                  { val>=results.targets.fatTarget ? fireIcons.fat
                    : val>=results.targets.fireTarget ? fireIcons.fire
                    : val>=results.targets.coastTarget? fireIcons.coast
                    : val>=results.targets.leanTarget? fireIcons.lean
                    : "🧭 Keep going!" }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
