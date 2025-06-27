import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

const formatCurrency = (value, currency) => {
  const symbol = currency === "INR" ? "₹" : "$";
  return symbol + value.toLocaleString();
};

export default function App() {
  const [monthlyExpense, setMonthlyExpense] = useState(105000);
  const [currentAge, setCurrentAge] = useState(42);
  const [desiredFIREAge, setDesiredFIREAge] = useState(51);
  const [desiredCoastAge, setDesiredCoastAge] = useState(47);
  const [inflation, setInflation] = useState(6);
  const [initial, setInitial] = useState(12873744);
  const [sip, setSip] = useState(0);
  const [conservative, setConservative] = useState(8);
  const [aggressive, setAggressive] = useState(12);
  const [currency, setCurrency] = useState("INR");
  const [showChart, setShowChart] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    calculate();
  }, [monthlyExpense, currentAge, desiredFIREAge, desiredCoastAge, inflation, initial, sip, conservative, aggressive, currency]);

  const calculate = () => {
    if (desiredCoastAge >= desiredFIREAge) {
      setResults(null);
      return;
    }

    const yearlyToday = monthlyExpense * 12;
    const yearsToFIRE = desiredFIREAge - currentAge;
    const yearlyAtFIRE = yearlyToday * Math.pow(1 + inflation / 100, yearsToFIRE);

    const lean = yearlyAtFIRE * 15;
    const fire = yearlyAtFIRE * 25;
    const fat = yearlyAtFIRE * 40;

    const yearsToCoast = desiredCoastAge - currentAge;
    let coast;
    if (sip === 0) {
      coast = yearlyAtFIRE * 18;
    } else {
      const rateM = conservative / 100 / 12;
      const totalM = (desiredCoastAge - currentAge) * 12;
      const fv = initial * Math.pow(1 + rateM, totalM) + sip * (Math.pow(1 + rateM, totalM) - 1) / rateM * (1 + rateM);
      coast = fv / Math.pow(1 + aggressive / 100, (desiredFIREAge - desiredCoastAge));
    }

    // Now simulate yearly portfolio
    const consYearly = {};
    const aggrYearly = {};
    const chartData = [];
    let portCons = initial;
    let portAggr = initial;
    let mRateC = conservative / 100 / 12, mRateA = aggressive / 100 / 12;
    const totalMonths = yearsToFIRE * 12;
    for (let i = 1; i <= totalMonths; i++) {
      portCons = portCons * (1 + mRateC) + sip;
      portAggr = portAggr * (1 + mRateA) + sip;
      if (i % 12 === 0) {
        const year = currentAge + i/12;
        consYearly[year] = portCons;
        aggrYearly[year] = portAggr;
        chartData.push({ year, Conservative: portCons, Aggressive: portAggr });
      }
    }

    setResults({ cons: consYearly, aggr: aggrYearly, targets: { lean, coast, fire, fat }, chartData });
  };

  const getFIREColor = (value, targets) => {
    if (value >= targets.fat) return "bg-cyan-200";
    if (value >= targets.fire) return "bg-green-300";
    if (value >= targets.coast) return "bg-sky-300";
    if (value >= targets.lean) return "bg-yellow-200";
    return "";
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 800, margin: "auto" }}>
      <h1>The Beggar Bowl: FIRE Tracker</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Monthly Expenses", state: monthlyExpense, setter: setMonthlyExpense },
          { label: "Current Age", state: currentAge, setter: setCurrentAge },
          { label: "FIRE Age", state: desiredFIREAge, setter: setDesiredFIREAge },
          { label: "Coast FIRE Age", state: desiredCoastAge, setter: setDesiredCoastAge },
          { label: "Inflation %", state: inflation, setter: setInflation },
          { label: "Initial Portfolio", state: initial, setter: setInitial },
          { label: "Monthly SIP", state: sip, setter: setSip },
          { label: "Conservative %", state: conservative, setter: setConservative },
          { label: "Aggressive %", state: aggressive, setter: setAggressive },
        ].map((fld, idx) => (
          <div key={idx}>
            <label style={{ fontSize: 12 }}>{fld.label}</label><br/>
            <input
              type="number"
              value={fld.state}
              onChange={e => fld.setter(+e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 12 }}>Currency</label><br/>
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: "100%" }}>
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
          </select>
        </div>
      </div>

      {results ? (
        <>
          <div style={{ marginTop: 20 }}>
            <label><input type="checkbox" checked={showChart} onChange={() => setShowChart(!showChart)} /> Show Chart</label>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: "10px" }}>
              {["Lean FIRE", "Coast FIRE", "FIRE", "Fat FIRE"].map(label => (
                <div key={label} style={{ display: "flex", alignItems: "center", fontSize: 14 }}>
                  <span style={{
                    display: "inline-block", width: 12, height: 12,
                    backgroundColor: label === "Lean FIRE" ? "#FEF3C7" :
                                     label === "Coast FIRE" ? "#E0F2FE" :
                                     label === "FIRE" ? "#BBF7D0" :
                                     "#CFFAFE",
                    marginRight: 4
                  }} />
                  {label}
                </div>
              ))}
            </div>
            <table border="1" width="100%" cellPadding="4" style={{ marginTop: 10, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f3f3" }}>
                  <th>Age</th><th>Conservative</th><th>Aggressive</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(results.cons).map(age => (
                  <tr key={age}>
                    <td>{age}</td>
                    <td style={{ backgroundColor: getFIREColor(results.cons[age], results.targets) }}>
                      {formatCurrency(results.cons[age], currency)}
                    </td>
                    <td style={{ backgroundColor: getFIREColor(results.aggr[age], results.targets) }}>
                      {formatCurrency(results.aggr[age], currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
              <div><strong>Lean FIRE</strong>: basic needs covered</div>
              <div><strong>Coast FIRE</strong>: no more saving needed</div>
              <div><strong>FIRE</strong>: comfortable lifestyle</div>
              <div><strong>Fat FIRE</strong>: luxury lifestyle</div>
            </div>
          </div>

          {showChart && (
            <div style={{ height: 300, marginTop: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.chartData}>
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={val => formatCurrency(val, currency)} />
                  <Tooltip formatter={val => formatCurrency(val, currency)} />
                  <Legend />
                  <Line type="monotone" dataKey="Conservative" stroke="#8884d8" />
                  <Line type="monotone" dataKey="Aggressive" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: 20, color: "red" }}>⚠️ Make sure Coast FIRE Age is less than FIRE Age.</div>
      )}
    </div>
  );
}
