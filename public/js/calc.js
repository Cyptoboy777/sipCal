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

  function num(x, digits) {
    var d = digits == null ? 0 : digits;
    return Number(x).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /** ₹12,34,567 */
  function inr(x) {
    var v = Math.round(Number(x) || 0);
    return (v < 0 ? '-' : '') + '₹' + num(Math.abs(v));
  }

  /** ₹1.25 Cr / ₹12.50 L / ₹45,000 */
  function short(x) {
    var v = Number(x) || 0;
    var a = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (a >= 1e7) return sign + '₹' + (a / 1e7).toFixed(2) + ' Cr';
    if (a >= 1e5) return sign + '₹' + (a / 1e5).toFixed(2) + ' L';
    return inr(v);
  }

  /** Words for an amount: "twelve lakh" style helper used under inputs. */
  function words(x) {
    var a = Math.abs(Number(x) || 0);
    if (a >= 1e7) return trim(a / 1e7) + ' crore';
    if (a >= 1e5) return trim(a / 1e5) + ' lakh';
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
