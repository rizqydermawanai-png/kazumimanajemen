// components/Chart.tsx
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import type { ChartType, ChartData, ChartOptions } from 'chart.js';

interface ChartComponentProps {
    type: ChartType;
    data: ChartData;
    options?: ChartOptions;
    className?: string;
}

export const ChartComponent = ({ type, data, options, className }: ChartComponentProps) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    const isDataEmpty = !data.labels || data.labels.length === 0 || data.datasets.every(ds => ds.data.length === 0);

    useEffect(() => {
        if (chartRef.current && !isDataEmpty) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type,
                    data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        },
                        ...options
                    },
                });
            }
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [type, data, options, isDataEmpty]);

    if (isDataEmpty) {
        return (
            <div className={`flex items-center justify-center h-full bg-slate-50 rounded-lg ${className}`}>
                <p className="text-slate-500">Tidak ada data untuk ditampilkan.</p>
            </div>
        );
    }

    return <div className={className}><canvas ref={chartRef}></canvas></div>;
};
