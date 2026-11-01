import { ExecutiveOverview } from './components/ExecutiveOverview';

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <div><p className="eyebrow">TRADING SYSTEM</p><h1>ADAMAS</h1></div>
        </div>
        <p>Treasury ledger</p>
        <p>Live backend telemetry or explicitly labeled paper-test samples. Select a mode in the header.</p>
      </aside>
      <main className="main-panel"><ExecutiveOverview /></main>
    </div>
  );
}

export default App;
