'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// This component is a presentational component.
// It receives data and renders the chart.
// Data fetching should be handled by the parent component.

interface PriceHistoryPoint {
    _time: string;
    _value: number;
}

interface PriceChartProps {
    data: PriceHistoryPoint[];
}

const PriceChart = ({ data }: PriceChartProps) => {
    if (!data || data.length === 0) {
        return <p>No price history available.</p>;
    }
    
    const formattedData = data.map(point => ({
        time: new Date(point._time).toLocaleDateString(),
        price: point._value
    }));

    return (
        <div className="w-full h-96 bg-gray-800 p-4 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold text-white mb-4">Price History</h3>
            <ResponsiveContainer>
                <LineChart
                    data={formattedData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis dataKey="time" stroke="#A0AEC0" />
                    <YAxis stroke="#A0AEC0" domain={['auto', 'auto']} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} 
                        labelStyle={{ color: '#E2E8F0' }}
                    />
                    <Legend wrapperStyle={{ color: '#E2E8F0' }} />
                    <Line type="monotone" dataKey="price" stroke="#48BB78" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceChart; 