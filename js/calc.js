/*
 * Smart Finance Calculator - calculation engine.
 * Pure functions, no DOM. Works in the browser (window.FinCalc) and in Node (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FinCalc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- formatting ---------- */

  /* Currency: symbol, number locale, compact style and a size factor relative to INR (k), used to
     scale example amounts so defaults feel normal in each currency (k = 1 means the INR defaults). */
  var CURRENCIES = {
    USD: { sym: '$', loc: 'en-US', style: 'intl', k: 0.04, name: 'US dollar' },
    EUR: { sym: '€', loc: 'en-IE', style: 'intl', k: 0.04, name: 'Euro' },
    GBP: { sym: '£', loc: 'en-GB', style: 'intl', k: 0.03, name: 'British pound' },
    INR: { sym: '₹', loc: 'en-IN', style: 'indian', k: 1, name: 'Indian rupee' },
    AUD: { sym: 'A$', loc: 'en-AU', style: 'intl', k: 0.06, name: 'Australian dollar' },
    CAD: { sym: 'C$', loc: 'en-CA', style: 'intl', k: 0.05, name: 'Canadian dollar' },
    SGD: { sym: 'S$', loc: 'en-SG', style: 'intl', k: 0.05, name: 'Singapore dollar' },
    AED: { sym: 'AED\u00a0', loc: 'en-AE', style: 'intl', k: 0.15, name: 'UAE dirham' },
    ZAR: { sym: 'R', loc: 'en-ZA', style: 'intl', k: 0.7, name: 'South African rand' },
    JPY: { sym: '¥', loc: 'ja-JP', style: 'intl', k: 5, name: 'Japanese yen' },
    PKR: { sym: 'Rs\u00a0', loc: 'en-IN', style: 'indian', k: 3, name: 'Pakistani rupee' },
    BDT: { sym: '৳', loc: 'en-IN', style: 'indian', k: 1.5, name: 'Bangladeshi taka' }
  };
  var cur = 'USD';
  function setCurrency(code) { if (CURRENCIES[code]) cur = code; return cur; }
  function getCurrency() { return cur; }
  function symbol() { return CURRENCIES[cur].sym; }
  function factor(code) { return (CURRENCIES[code] || CURRENCIES.USD).k; }

  function num(x, digits) {
    var d = digits == null ? 0 : digits;
    var loc = CURRENCIES[cur].loc === 'ja-JP' ? 'en-US' : CURRENCIES[cur].loc;
    return Number(x).toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /** $12,345 / ₹12,34,567 */
  function inr(x) {
    var v = Math.round(Number(x) || 0);
    return (v < 0 ? '-' : '') + symbol() + num(Math.abs(v));
  }

  /** ₹1.25 Cr / ₹12.50 L   or   $1.25 M / $2.10 B   or the full number when small */
  function short(x) {
    var v = Number(x) || 0;
    var a = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    var S = symbol();
    if (CURRENCIES[cur].style === 'indian') {
      if (a >= 1e7) return sign + S + (a / 1e7).toFixed(2) + ' Cr';
      if (a >= 1e5) return sign + S + (a / 1e5).toFixed(2) + ' L';
    } else {
      if (a >= 1e12) return sign + S + (a / 1e12).toFixed(2) + ' T';
      if (a >= 1e9) return sign + S + (a / 1e9).toFixed(2) + ' B';
      if (a >= 1e6) return sign + S + (a / 1e6).toFixed(2) + ' M';
    }
    return inr(v);
  }

  /** Words for an amount shown under inputs: "12.5 lakh" or "12.5 million". */
  function words(x) {
    var a = Math.abs(Number(x) || 0);
    if (CURRENCIES[cur].style === 'indian') {
      if (a >= 1e7) return trim(a / 1e7) + ' crore';
      if (a >= 1e5) return trim(a / 1e5) + ' lakh';
    } else {
      if (a >= 1e12) return trim(a / 1e12) + ' trillion';
      if (a >= 1e9) return trim(a / 1e9) + ' billion';
      if (a >= 1e6) return trim(a / 1e6) + ' million';
    }
    if (a >= 1e3) return trim(a / 1e3) + ' thousand';
    return String(Math.round(a));
  }
  function trim(n) {
    return String(Number(n.toFixed(2)));
  }

  /** "1 yr 6 mo" from a month count */
  function duration(months) {
    var y = Math.floor(months / 12);
    var m = months % 12;
    var out = [];
    if (y) out.push(y + (y === 1 ? ' yr' : ' yrs'));
    if (m) out.push(m + (m === 1 ? ' mo' : ' mos'));
    return out.length ? out.join(' ') : '0 mo';
  }

  /* ---------- EMI ---------- */

  function emi(principal, annualRate, months) {
    if (!(principal > 0) || !(months > 0)) return 0;
    var r = annualRate / 1200;
    if (r === 0) return principal / months;
    var g = Math.pow(1 + r, months);
    return (principal * r * g) / (g - 1);
  }

  /**
   * Month-by-month reducing-balance schedule.
   * `extra` is an optional fixed prepayment added to every EMI.
   */
  function loan(opts) {
    var principal = opts.principal;
    var rate = opts.rate;
    var months = Math.round(opts.months);
    var extra = opts.extra || 0;
    var r = rate / 1200;
    var payment = emi(principal, rate, months);
    var rows = [];
    var bal = principal;
    var totalInterest = 0;
    var m = 0;
    while (bal > 0.005 && m < 1200) {
      m++;
      var interest = bal * r;
      var principalPart = payment + extra - interest;
      if (principalPart >= bal || (extra === 0 && m === months)) principalPart = bal;
      bal -= principalPart;
      if (bal < 0.005) bal = 0;
      totalInterest += interest;
      rows.push({ month: m, principal: principalPart, interest: interest, payment: principalPart + interest, balance: bal });
    }
    return {
      emi: payment,
      rows: rows,
      months: rows.length,
      principal: principal,
      totalInterest: totalInterest,
      totalPayment: principal + totalInterest
    };
  }

  function loanSummary(opts) {
    var withExtra = loan(opts);
    var base = opts.extra ? loan({ principal: opts.principal, rate: opts.rate, months: opts.months, extra: 0 }) : withExtra;
    withExtra.interestSaved = base.totalInterest - withExtra.totalInterest;
    withExtra.monthsSaved = base.months - withExtra.months;
    return withExtra;
  }

  /** Group monthly rows into years. */
  function yearlyLoan(rows) {
    var out = [];
    rows.forEach(function (row) {
      var y = Math.ceil(row.month / 12);
      var cur = out[y - 1];
      if (!cur) cur = out[y - 1] = { year: y, principal: 0, interest: 0, balance: 0 };
      cur.principal += row.principal;
      cur.interest += row.interest;
      cur.balance = row.balance;
    });
    return out;
  }

  /* ---------- SIP ---------- */

  /**
   * Monthly SIP, instalment invested at the start of each month,
   * monthly rate = annual rate / 12. Optional lump sum, annual step-up and inflation.
   */
  function sip(opts) {
    var monthly = opts.monthly;
    var i = opts.rate / 1200;
    var n = Math.round(opts.years * 12);
    var stepUp = opts.stepUp || 0;
    var bal = opts.lumpsum || 0;
    var invested = opts.lumpsum || 0;
    var m = monthly;
    var yearly = [];
    for (var k = 1; k <= n; k++) {
      bal = (bal + m) * (1 + i);
      invested += m;
      if (k % 12 === 0 || k === n) {
        yearly.push({ year: Math.ceil(k / 12), invested: invested, value: bal, gains: bal - invested });
      }
      if (k % 12 === 0) m = m * (1 + stepUp / 100);
    }
    var inflation = opts.inflation || 0;
    var real = bal / Math.pow(1 + inflation / 100, n / 12);
    return {
      months: n,
      invested: invested,
      value: bal,
      gains: bal - invested,
      realValue: real,
      yearly: yearly
    };
  }

  /* ---------- Compound interest / FD ---------- */

  /**
   * Compound growth with optional month-end deposits.
   * `freq` = compounding periods per year (1, 2, 4, 12, 365).
   * Growth is converted to an equivalent monthly rate so deposits and compounding agree.
   */
  function compound(opts) {
    var principal = opts.principal;
    var freq = opts.freq || 1;
    var monthly = opts.monthly || 0;
    var n = Math.round(opts.years * 12);
    var im = Math.pow(1 + opts.rate / 100 / freq, freq / 12) - 1;
    var bal = principal;
    var invested = principal;
    var yearly = [];
    for (var k = 1; k <= n; k++) {
      bal = bal * (1 + im) + monthly;
      invested += monthly;
      if (k % 12 === 0 || k === n) {
        yearly.push({ year: Math.ceil(k / 12), invested: invested, value: bal, gains: bal - invested });
      }
    }
    var eay = Math.pow(1 + opts.rate / 100 / freq, freq) - 1;
    var doubling = eay > 0 ? Math.log(2) / Math.log(1 + eay) : Infinity;
    return {
      months: n,
      invested: invested,
      value: bal,
      gains: bal - invested,
      effectiveRate: eay * 100,
      doublingYears: doubling,
      yearly: yearly
    };
  }

  /** Fixed deposit (cumulative). Indian banks usually compound quarterly. */
  function fd(opts) {
    return compound({ principal: opts.principal, rate: opts.rate, years: opts.months / 12, freq: opts.freq || 4, monthly: 0 });
  }

  return {
    num: num,
    currencies: CURRENCIES,
    setCurrency: setCurrency,
    getCurrency: getCurrency,
    symbol: symbol,
    factor: factor,
    inr: inr,
    short: short,
    words: words,
    duration: duration,
    emi: emi,
    loan: loan,
    loanSummary: loanSummary,
    yearlyLoan: yearlyLoan,
    sip: sip,
    compound: compound,
    fd: fd
  };
});
