import React, { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { useMediaQuery, useTheme } from '@mui/material';
import axios from 'axios';
import { BRAND } from '../theme/theme';

const Pie = () => {
  const [chartData, setChartData] = useState([]);
  const baseURL = import.meta.env.VITE_API_URL;
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  useEffect(() => {
    axios.get(`${baseURL}/api/travels`) // Adjust the URL to your API endpoint
      .then((response) => {
        const travels = response.data;

        // Define allowed Areas
        const allowedAreas = ['Division', 'Region', 'National', 'Abroad'];

        // Group by allowed Areas
        const areaCount = {};
        travels.forEach((travel) => {
          const area = travel.Area;
          if (allowedAreas.includes(area)) {
            areaCount[area] = (areaCount[area] || 0) + 1;
          }
        });

        // Set colors for each area — anchored on the app's navy/accent brand
        // colors, with two contrasting accents for the remaining categories.
        const colors = {
          Division: BRAND.navy,
          Region: BRAND.accent,
          National: BRAND.amber,
          Abroad: BRAND.violet,
        };

        // Convert grouped data into chart format
        const data = allowedAreas.map((area, index) => ({
          id: index,
          value: areaCount[area] || 0,
          label: area,
          color: colors[area],
        }));

        setChartData(data);
      })
      .catch((error) => {
        console.error('Failed to fetch travel data:', error);
      });
  }, []);

  const valueFormatter = (item) => `${item.value} travels`;

  return (
    <div className='bg-white rounded-xl shadow-md w-full max-w-[420px] mx-auto min-h-[360px] items-center flex flex-col justify-center pt-5 px-2'>
      <h2 className='text-center text-2xl font-semibold mb-2'>Travel Distribution</h2>

      <PieChart
        series={[
          {
            data: chartData,
            highlightScope: { fade: 'global', highlight: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
            valueFormatter,
            innerRadius: isSmall ? 30 : 40,
            outerRadius: isSmall ? 100 : 140,
            paddingAngle: 2,
            cornerRadius: 4,
          },
        ]}
        height={isSmall ? 260 : 300}
        width={isSmall ? 300 : 400}
        margin={{ top: 10, bottom: 55, left: 10, right: 10 }}
        legend={{
          hidden: false,
          position: { vertical: 'bottom', horizontal: 'center' },
          direction: 'row',
          itemMarkWidth: 15,
          itemMarkHeight: 15,
          markGap: 8,
          itemGap: 15,
        }}
        slotProps={{
          legend: {
            padding: 5,
            labelStyle: {
              fontSize: 14,
              fontWeight: 500,
            },
          },
        }}
      />
    </div>
  );
};

export default Pie;
