// Vanguard index ETFs. Verify against Vanguard's current lineup periodically;
// funds launch and close. Active ETFs (e.g. VUSB, VFMF) are intentionally excluded.
export const MARKET_PROXY = 'VTI';   // CAPM "market portfolio" proxy
export const RISK_FREE = '^IRX';     // 13-week T-bill yield (%)

const eq = (ticker, name) => ({ ticker, name, assetClass: 'equity' });
const bd = (ticker, name) => ({ ticker, name, assetClass: 'bond' });

export const FUNDS = [
  // U.S. broad / size / style
  eq('VTI', 'Total Stock Market ETF'), eq('VOO', 'S&P 500 ETF'), eq('VV', 'Large-Cap ETF'),
  eq('VO', 'Mid-Cap ETF'), eq('VB', 'Small-Cap ETF'), eq('VXF', 'Extended Market ETF'),
  eq('MGC', 'Mega Cap ETF'), eq('VUG', 'Growth ETF'), eq('VTV', 'Value ETF'),
  eq('MGK', 'Mega Cap Growth ETF'), eq('MGV', 'Mega Cap Value ETF'),
  eq('VOT', 'Mid-Cap Growth ETF'), eq('VOE', 'Mid-Cap Value ETF'),
  eq('VBK', 'Small-Cap Growth ETF'), eq('VBR', 'Small-Cap Value ETF'),
  eq('VOOG', 'S&P 500 Growth ETF'), eq('VOOV', 'S&P 500 Value ETF'),
  eq('IVOO', 'S&P Mid-Cap 400 ETF'), eq('IVOG', 'S&P Mid-Cap 400 Growth ETF'), eq('IVOV', 'S&P Mid-Cap 400 Value ETF'),
  eq('VIOO', 'S&P Small-Cap 600 ETF'), eq('VIOG', 'S&P Small-Cap 600 Growth ETF'), eq('VIOV', 'S&P Small-Cap 600 Value ETF'),
  eq('VONE', 'Russell 1000 ETF'), eq('VONG', 'Russell 1000 Growth ETF'), eq('VONV', 'Russell 1000 Value ETF'),
  eq('VTWO', 'Russell 2000 ETF'), eq('VTWG', 'Russell 2000 Growth ETF'), eq('VTWV', 'Russell 2000 Value ETF'),
  eq('VTHR', 'Russell 3000 ETF'), eq('VIG', 'Dividend Appreciation ETF'), eq('VYM', 'High Dividend Yield ETF'),
  eq('ESGV', 'ESG U.S. Stock ETF'),
  // U.S. sectors
  eq('VOX', 'Communication Services ETF'), eq('VCR', 'Consumer Discretionary ETF'), eq('VDC', 'Consumer Staples ETF'),
  eq('VDE', 'Energy ETF'), eq('VFH', 'Financials ETF'), eq('VHT', 'Health Care ETF'), eq('VIS', 'Industrials ETF'),
  eq('VGT', 'Information Technology ETF'), eq('VAW', 'Materials ETF'), eq('VNQ', 'Real Estate ETF'), eq('VPU', 'Utilities ETF'),
  // International / global
  eq('VT', 'Total World Stock ETF'), eq('VXUS', 'Total International Stock ETF'), eq('VEU', 'FTSE All-World ex-US ETF'),
  eq('VEA', 'FTSE Developed Markets ETF'), eq('VWO', 'FTSE Emerging Markets ETF'), eq('VGK', 'FTSE Europe ETF'),
  eq('VPL', 'FTSE Pacific ETF'), eq('VSS', 'FTSE All-World ex-US Small-Cap ETF'), eq('VNQI', 'Global ex-U.S. Real Estate ETF'),
  eq('VIGI', 'International Dividend Appreciation ETF'), eq('VYMI', 'International High Dividend Yield ETF'),
  eq('VSGX', 'ESG International Stock ETF'),
  // Bonds
  bd('BND', 'Total Bond Market ETF'), bd('BNDX', 'Total International Bond ETF'), bd('BNDW', 'Total World Bond ETF'),
  bd('BSV', 'Short-Term Bond ETF'), bd('BIV', 'Intermediate-Term Bond ETF'), bd('BLV', 'Long-Term Bond ETF'),
  bd('VGSH', 'Short-Term Treasury ETF'), bd('VGIT', 'Intermediate-Term Treasury ETF'), bd('VGLT', 'Long-Term Treasury ETF'),
  bd('EDV', 'Extended Duration Treasury ETF'), bd('VTIP', 'Short-Term Inflation-Protected Securities ETF'),
  bd('VCSH', 'Short-Term Corporate Bond ETF'), bd('VCIT', 'Intermediate-Term Corporate Bond ETF'),
  bd('VCLT', 'Long-Term Corporate Bond ETF'), bd('VTC', 'Total Corporate Bond ETF'),
  bd('VMBS', 'Mortgage-Backed Securities ETF'), bd('VTEB', 'Tax-Exempt Bond ETF'),
  bd('VWOB', 'Emerging Markets Government Bond ETF'),
];