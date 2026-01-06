import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function BidChart({ bids }) {
    if (!bids || bids.length === 0) return null;

    // Calculate statistics
    const amounts = bids.map(b => b.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
        amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length
    );

    // Identify outliers (>2 std dev from mean)
    const outliers = bids.map(bid => Math.abs(bid.amount - mean) > 2 * stdDev);

    const data = {
        labels: bids.map((bid, idx) => bid.vendorName || `Vendor ${idx + 1}`),
        datasets: [
            {
                label: 'Bid Amount (₹)',
                data: amounts,
                backgroundColor: bids.map((_, idx) =>
                    outliers[idx] ? 'rgba(239, 68, 68, 0.7)' : 'rgba(102, 126, 234, 0.7)'
                ),
                borderColor: bids.map((_, idx) =>
                    outliers[idx] ? 'rgba(239, 68, 68, 1)' : 'rgba(102, 126, 234, 1)'
                ),
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Bid Comparison Analysis',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = context.parsed.y;
                        const deviation = ((value - mean) / mean * 100).toFixed(1);
                        return [
                            `Amount: ₹${value.toLocaleString()}`,
                            `Deviation: ${deviation > 0 ? '+' : ''}${deviation}%`,
                            outliers[context.dataIndex] ? '⚠️ Outlier Detected' : ''
                        ];
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return '₹' + (value / 1000000).toFixed(1) + 'M';
                    }
                }
            }
        }
    };

    return (
        <div className="card" style={{ marginTop: '20px' }}>
            <Bar data={data} options={options} />
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                <strong>Mean Bid:</strong> ₹{mean.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {' | '}
                <strong>Std Dev:</strong> ₹{stdDev.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {' | '}
                <span style={{ color: '#ef4444' }}><strong>Outliers:</strong> {outliers.filter(Boolean).length}</span>
            </div>
        </div>
    );
}

export default BidChart;
