import { useState, useEffect } from "react";

export default function App() {
  const defaultInputs = {
    initial: 500000,
    sip: 10000,
    conservative: 8,
    aggressive: 12,
    startMonth: 6,
    startYear: new Date().getFullYear(),
    projectionYears: 10,
    currency: "INR",
    currentAge: 42,
    desiredFIREAge: 47,
    desiredCoastAge: 45,
    inflation: 6,
    monthlyExpense: 105000,
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

  const updateInput = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: key === "currency" ? value : Number(value),
    }));
  };

  const calculate = () => {
    const {
      sip,
      initial,
      startMonth,
