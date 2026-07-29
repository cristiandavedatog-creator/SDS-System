import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { BRAND } from '../theme/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const generateWeeklyLabels = (year, month) => {
  const startDate = new Date(year, month, 1);
  const labels = [];

  while (startDate.getMonth() === month) {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    if (endDate.getMonth() !== month) {
      endDate.setMonth(month);
      endDate.setDate(new Date(year, month + 1, 0).getDate());
    }
    const label = `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { day: 'numeric' })}`;
    labels.push(label);
    startDate.setDate(startDate.getDate() + 7);
  }

  return labels;
};

const LineGraph = () => {
  const [timeRange, setTimeRange] = useState('Monthly');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState(0); // Number: 0 = Jan
  const selectedPosition = 'All';
  const selectedStation = 'All';

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseURL = import.meta.env.VITE_API_URL ;

 const fetchGraphData = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const typeMap = { Weekly: 'week', Monthly: 'month', Yearly: 'year' };
    let url = `${baseURL}/api/travels/graph?type=${typeMap[timeRange]}`;

    if (selectedYear !== 'All') {
      url += `&year=${selectedYear}`;
    }

    if (timeRange === 'Weekly' && selectedYear !== 'All') {
      url += `&month=${selectedMonth + 1}`;
    }

    if (selectedPosition !== 'All') {
      url += `&position=${selectedPosition}`;
    }

    if (selectedStation !== 'All') {
      url += `&station=${selectedStation}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error (${response.status}): ${await response.text()}`);
    const data = await response.json();
    setGraphData(data);
  } catch (err) {
    console.error('Fetch error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [timeRange, selectedYear, selectedMonth, selectedPosition, selectedStation]);


  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const getChartData = () => {
  if (!graphData?.datasets || graphData.datasets.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [
        {
          label: `Travels (${timeRange})`,
          data: [0],
          borderColor: BRAND.accent,
          backgroundColor: BRAND.chartFillMuted,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }

  // Process labels and datasets as per the time range


    let labels = graphData.labels;
    let datasets = graphData.datasets;

    if (timeRange === 'Weekly') {
      const weeklyLabels = generateWeeklyLabels(Number(selectedYear), selectedMonth);

      // Filter labels and data based on the start of travels
      const filteredLabels = weeklyLabels.filter((label, index) => {
        const weekStartDate = new Date(Number(selectedYear), selectedMonth, index * 7 + 1);
        return graphData.startDate ? weekStartDate >= new Date(graphData.startDate) : true;
      });

      labels = filteredLabels;

      datasets = datasets.map((dataset) => ({
        ...dataset,
        data: filteredLabels.map((label, index) => dataset.data[index] || 0),
      }));
    } else if (timeRange === 'Yearly' && selectedYear !== 'All') {
      const allYears = [2023, 2024, 2025, 2026];
      const existingYears = graphData.labels.map(l => parseInt(l, 10));
      labels = allYears.map(y => y.toString());

      datasets = datasets.map(ds => {
        const data = allYears.map(y => {
          const idx = existingYears.indexOf(y);
          return idx >= 0 ? ds.data[idx] : 0;
        });
        return { ...ds, data };
      });
    } else if (selectedYear === 'All') {
      // Show all labels and data
      labels = graphData.labels;
      datasets = datasets.map(ds => ({
        ...ds,
        label: `${ds.label} (All Years)`
      }));
    }

    return {
      labels,
      datasets: datasets.map((ds) => ({
        ...ds,
        tension: 0.3,
        fill: true,
      })),
    };
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: selectedYear === 'All'
          ? `Travels - ${timeRange} (All Years)`
          : timeRange === 'Weekly'
            ? `Weekly Travels - ${new Date(Number(selectedYear), selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`
            : `Travels - ${timeRange} View (${selectedYear})`
      }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <Box className="w-full max-w-[700px] mx-auto p-4 bg-white rounded-xl shadow" sx={{ maxHeight: '425px' }}>
      <Box className="flex gap-4 mb-4 flex-wrap">
        <FormControl size="small">
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} onChange={e => setTimeRange(e.target.value)} label="Time Range">
            <MenuItem value="Weekly">Weekly</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
            <MenuItem value="Yearly">Yearly</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Year</InputLabel>
          <Select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} label="Year">
            <MenuItem value="All">All</MenuItem>
            {[2023, 2024, 2025, 2026].map(y => (
              <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {timeRange === 'Weekly' && selectedYear !== 'All' && (
          <FormControl size="small">
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              label="Month"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i} value={i}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {error && <Alert severity="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <Box className="flex justify-center items-center" sx={{ height: 300 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Line data={getChartData()} options={options} />
      )}
    </Box>
  );
};

export default LineGraph;
