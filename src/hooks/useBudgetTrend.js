import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useBudgetTrend = (monthPeriod) => {
  const [historyData, setHistoryData] = useState([]);
  const [trend, setTrend] = useState({ direction: 'stable', percentage: 0 });
  const [forecasts, setForecasts] = useState({});

  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateKey = firstDayOfMonth.toISOString().split('T')[0];

    const q = query(
      collection(db, 'balanceHistory'),
      where('date', '>=', dateKey),
      orderBy('date', 'asc')
    );

    // Subskrypcja na żywo - aktualizuje się automatycznie
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data());
      });

      setHistoryData(data);
      calculateTrend(data);
      calculateForecasts(data);
    }, (error) => {
      console.error('Błąd pobierania historii:', error);
    });

    return () => unsubscribe();
  }, [monthPeriod]);

  const calculateTrend = (data) => {
    if (data.length < 2) {
      setTrend({ direction: 'stable', percentage: 0 });
      return;
    }

    const field = monthPeriod === 'current' ? 'dailyBudgetCurrentMonth' : 'dailyBudgetNextMonth';
    const firstValue = data[0][field] || 0;
    const lastValue = data[data.length - 1][field] || 0;

    const change = lastValue - firstValue;
    const percentage = firstValue !== 0 ? ((change / firstValue) * 100) : 0;

    let direction = 'stable';
    if (percentage > 2) direction = 'up';
    else if (percentage < -2) direction = 'down';

    setTrend({ direction, percentage: percentage.toFixed(1) });
  };

  const calculateForecasts = (data) => {
    if (data.length === 0) {
      setForecasts({});
      return;
    }

    const latestData = data[data.length - 1];
    const field = monthPeriod === 'current' ? 'dailyBudgetCurrentMonth' : 'dailyBudgetNextMonth';
    const daysField = monthPeriod === 'current' ? 'daysRemainingCurrentMonth' : 'daysRemainingNextMonth';

    // A) Prognoza na koniec miesiąca
    const last7Days = data.slice(-7);
    if (last7Days.length > 0) {
      const avgSpending = last7Days.reduce((sum, day) => {
        const prevDay = data[data.indexOf(day) - 1];
        if (prevDay) {
          const spending = prevDay.balance - day.balance;
          return sum + (spending > 0 ? spending : 0);
        }
        return sum;
      }, 0) / Math.max(1, last7Days.length - 1);

      const daysRemaining = latestData[daysField] || 1;
      const projectedEnd = latestData.balance - (avgSpending * daysRemaining);
      const targetDaily = daysRemaining > 0 ? latestData.balance / daysRemaining : 0;

      // B) Alerty trendu
      const last3Days = data.slice(-3);
      let consecutiveDays = 0;
      let trendDirection = 'stable';
      
      if (last3Days.length === 3) {
        const trend1 = last3Days[1][field] - last3Days[0][field];
        const trend2 = last3Days[2][field] - last3Days[1][field];
        
        if (trend1 < 0 && trend2 < 0) {
          consecutiveDays = 3;
          trendDirection = 'down';
        } else if (trend1 > 0 && trend2 > 0) {
          consecutiveDays = 3;
          trendDirection = 'up';
        }
      }

      // C) Trend wzrostu/spadku (vs początek miesiąca)
      const startValue = data[0][field] || 0;
      const currentValue = latestData[field] || 0;
      const vsStartPercent = startValue !== 0 ? (((currentValue - startValue) / startValue) * 100).toFixed(1) : 0;

      setForecasts({
        projectedEndOfMonth: projectedEnd,
        avgDailySpending: avgSpending,
        targetDailyToZero: targetDaily,
        consecutiveDays,
        trendDirection,
        vsStartPercent,
        daysRemaining: latestData[daysField] || 0,
      });
    }
  };

  return {
    historyData,
    trend,
    forecasts,
  };
};
