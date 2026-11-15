"""Independent closed-form check of js/calc.js. Run: python3 tools/verify_calc.py"""
import json, subprocess, math, sys
out = json.loads(subprocess.check_output(['node', 'tools/test_calc.js']))
bad = 0
def check(name, got, want, tol=0.01):
    global bad
    ok = abs(got - want) <= tol
    print(('PASS' if ok else 'FAIL'), name, round(got, 4), round(want, 4))
    bad += not ok

P, r, n = 5_000_000, 0.085/12, 240
emi = P*r*(1+r)**n/((1+r)**n-1)
check('emi closed form', out['emi1'], emi)
check('emi known ~43391', out['emi1'], 43391.16, 0.5)
check('loan emi', out['loan']['emi'], emi)
check('loan months', out['loan']['months'], 240, 0)
check('loan interest', out['loan']['interest'], emi*n-P, 0.5)
check('loan ends at zero', out['loan']['lastBal'], 0, 0.001)
check('principal sums to loan', out['loan']['sumPrincipal'], P, 0.01)
# prepayment: simulate independently
bal, m, ti = P, 0, 0
while bal > 0.005:
    m += 1; i = bal*r; pp = emi+5000-i
    if pp >= bal: pp = bal
    bal -= pp; ti += i
check('prepay months', out['loanExtra']['months'], m, 0)
check('prepay interest', out['loanExtra']['interest'], ti, 0.5)
check('prepay saved', out['loanExtra']['saved'], (emi*n-P)-ti, 0.5)
check('prepay ends zero', out['loanExtra']['lastBal'], 0, 0.001)
check('zero rate emi', out['zeroRate'], 10000, 0.0001)

i = 0.12/12; N = 180
fv = 10000*((1+i)**N-1)/i*(1+i)
check('sip closed form', out['sip']['value'], fv, 0.5)
check('sip invested', out['sip']['invested'], 10000*N, 0)
# step-up + lumpsum + inflation independent
bal, inv, mm = 100000, 100000, 10000
for k in range(1, N+1):
    bal = (bal+mm)*(1+i); inv += mm
    if k % 12 == 0: mm *= 1.10
check('sip stepup value', out['sipStep']['value'], bal, 0.5)
check('sip stepup invested', out['sipStep']['invested'], inv, 0.5)
check('sip real value', out['sipStep']['real'], bal/(1.06**15), 0.5)

check('ci annual', out['ci']['value'], 100000*1.08**10, 0.01)
check('ci eay', out['ci']['eay'], 8.0, 1e-9)
check('ci doubling ~9.006y', out['ci']['doubling'], math.log(2)/math.log(1.08), 1e-9)
im = (1+0.08/12)**1-1
want = 100000*(1+im)**120 + 5000*((1+im)**120-1)/im
check('ci monthly + deposits', out['ciDep']['value'], want, 0.5)
check('ci invested', out['ciDep']['invested'], 100000+5000*120, 0)
check('fd quarterly', out['fd']['value'], 500000*(1+0.07/4)**20, 0.01)
check('fd eay', out['fd']['eay'], ((1+0.07/4)**4-1)*100, 1e-9)
print(out['fmt'])
exp = ['₹1,234,567'.replace('1,234,567','12,34,567'), '₹1.25 Cr', '₹2.50 L', '₹45,000', '50 lakh', '1 yr 6 mos']
check_fmt = out['fmt'] == exp
print('PASS' if check_fmt else 'FAIL', 'formatting', exp)
bad += (not check_fmt)
sys.exit(1 if bad else 0)
