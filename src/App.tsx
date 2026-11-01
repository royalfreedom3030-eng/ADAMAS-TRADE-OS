type Metrics = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
};

type Asset = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
};

type Position = {
  symbol: string;
  company: string;
  qty: number;
  price: number;
  pnl: string;
  weight: string;
};

type Order = {
  time: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  volume: string;
  status: 'Filled' | 'Pending' | 'Queued';
};

const metrics: Metrics[] = [
  { label: 'Portfolio Value', value: '$2.87M', change: '+3.48%', positive: true },
  { label: 'Daily P&L', value: '+$86,420', change: '+1.82%', positive: true },
  { label: 'Exposure', value: '64.2%', change: '-0.63%', positive: false },
  { label: 'Win Rate', value: '71.4%', change: '+4.10%', positive: true },
];

const watchlist: Asset[] = [
  { symbol: 'NVDA', name: 'NVIDIA', price: '$944.15', change: '+4.82%', volume: '32.6M', sentiment: 'Bullish' },
  { symbol: 'AAPL', name: 'Apple', price: '$222.48', change: '+1.24%', volume: '18.9M', sentiment: 'Bullish' },
  { symbol: 'TSLA', name: 'Tesla', price: '$248.36', change: '-1.37%', volume: '22.3M', sentiment: 'Bearish' },
  { symbol: 'MSFT', name: 'Microsoft', price: '$462.88', change: '+2.07%', volume: '12.4M', sentiment: 'Bullish' },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,212.40', change: '+3.14%', volume: '9.8M', sentiment: 'Bullish' },
];

const positions: Position[] = [
  { symbol: 'AAPL', company: 'Apple Inc.', qty: 420, price: 222.48, pnl: '+$14,980', weight: '18.6%' },
  { symbol: 'MSFT', company: 'Microsoft', qty: 310, price: 462.88, pnl: '+$11,640', weight: '16.4%' },
  { symbol: 'NVDA', company: 'NVIDIA', qty: 180, price: 944.15, pnl: '+$23,120', weight: '25.7%' },
  { symbol: 'AMZN', company: 'Amazon', qty: 250, price: 184.62, pnl: '+$7,540', weight: '12.8%' },
  { symbol: 'BTC', company: 'Bitcoin', qty: 6.8, price: 67486.2, pnl: '+$18,420', weight: '14.3%' },
];

const recentOrders: Order[] = [
  { time: '09:42', symbol: 'NVDA', side: 'Buy', volume: '85 sh', status: 'Filled' },
  { time: '09:18', symbol: 'AMD', side: 'Buy', volume: '220 sh', status: 'Filled' },
  { time: '08:56', symbol: 'ETH', side: 'Sell', volume: '1.2 ETH', status: 'Queued' },
  { time: '08:31', symbol: 'AAPL', side: 'Buy', volume: '60 sh', status: 'Filled' },
];

const marketSignals = [
  'Momentum remains strong in AI and semiconductor names after the Nasdaq open.',
  'Macro volatility is compressing; hedging ratios remain below 12-month average.',
  'Risk allocation is trending toward growth equity and digital asset exposure.',
];

const strategyCards = [
  { title: 'Trend Engine', value: '92%', detail: 'Signal confidence' },
  { title: 'Volatility Guard', value: '1.8x', detail: 'Risk-adjusted hedge' },
  { title: 'Execution Latency', value: '41ms', detail: 'Median fill speed' },
];

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <div>
            <p className="eyebrow">TRADING SYSTEM</p>
            <h1>ADAMAS</h1>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">Overview</button>
          <button className="nav-item">Markets</button>
          <button className="nav-item">Portfolio</button>
          <button className="nav-item">Automation</button>
          <button className="nav-item">Analytics</button>
          <button className="nav-item">Risk</button>
        </nav>

        <div className="status-panel">
          <span className="status-dot" />
          <div>
            <p className="eyebrow">System Status</p>
            <strong>Nominal</strong>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Trade Operating System</h2>
          </div>

          <div className="topbar-actions">
            <button className="ghost-button">Export</button>
            <button className="primary-button">New Order</button>
          </div>
        </header>

        <section className="metrics-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <div className="metric-header">
                <span>{metric.label}</span>
                <span className={metric.positive ? 'trend up' : 'trend down'}>{metric.change}</span>
              </div>
              <h3>{metric.value}</h3>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <div className="panel large-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">LIVE WATCHLIST</p>
                <h3>Market Pulse</h3>
              </div>
              <button className="tag-button">Filters</button>
            </div>

            <div className="watchlist">
              {watchlist.map((asset) => (
                <div key={asset.symbol} className="watch-row">
                  <div className="asset-name">
                    <strong>{asset.symbol}</strong>
                    <span>{asset.name}</span>
                  </div>
                  <div className="asset-price">{asset.price}</div>
                  <div className={`asset-change ${asset.change.startsWith('-') ? 'negative' : 'positive'}`}>
                    {asset.change}
                  </div>
                  <div className="asset-volume">{asset.volume}</div>
                  <div className={`sentiment ${asset.sentiment.toLowerCase()}`}>
                    {asset.sentiment}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel order-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">ORDER TICKET</p>
                <h3>Quick Trade</h3>
              </div>
            </div>

            <form className="order-form">
              <label>
                Symbol
                <input defaultValue="NVDA" />
              </label>
              <label>
                Side
                <select defaultValue="Buy">
                  <option>Buy</option>
                  <option>Sell</option>
                </select>
              </label>
              <label>
                Quantity
                <input defaultValue="80" />
              </label>
              <label>
                Type
                <select defaultValue="Limit">
                  <option>Limit</option>
                  <option>Market</option>
                  <option>Stop</option>
                </select>
              </label>
              <button type="button" className="primary-button full-width">
                Submit Order
              </button>
            </form>
          </div>
        </section>

        <section className="lower-grid">
          <div className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">PORTFOLIO</p>
                <h3>Open Positions</h3>
              </div>
            </div>

            <table className="positions-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>P&L</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr key={position.symbol}>
                    <td>
                      <div className="position-symbol">
                        <strong>{position.symbol}</strong>
                        <span>{position.company}</span>
                      </div>
                    </td>
                    <td>{position.qty}</td>
                    <td>${position.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="profit">{position.pnl}</td>
                    <td>{position.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">STRATEGY</p>
                <h3>Alpha Signals</h3>
              </div>
            </div>

            <div className="strategy-grid">
              {strategyCards.map((card) => (
                <div key={card.title} className="strategy-card">
                  <span>{card.title}</span>
                  <strong>{card.value}</strong>
                  <small>{card.detail}</small>
                </div>
              ))}
            </div>

            <ul className="signal-list">
              {marketSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">EXECUTION</p>
                <h3>Recent Orders</h3>
              </div>
            </div>

            <div className="orders-list">
              {recentOrders.map((order) => (
                <div key={`${order.time}-${order.symbol}`} className="order-row">
                  <span>{order.time}</span>
                  <strong>{order.symbol}</strong>
                  <span className={order.side === 'Buy' ? 'buy' : 'sell'}>{order.side}</span>
                  <span>{order.volume}</span>
                  <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
