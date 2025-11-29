import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useBudgetTrend = (monthPeriod, totalIncome = 0, totalExpenses = 0, currentBalance = 0, targetBuffer = 0) => {
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
  }, [monthPeriod, totalIncome, totalExpenses, currentBalance, targetBuffer]);

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

    // Oblicz dni pozostałe na podstawie aktualnej daty
    const now = new Date();
    const monthEnd = monthPeriod === 'current' 
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
      : new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const daysRemaining = Math.max(1, Math.ceil((monthEnd - now) / (1000 * 60 * 60 * 24)) + 1);

    // A) Prognoza na koniec miesiąca
    const last7Days = data.slice(-7);
    if (last7Days.length > 0) {
      // Oblicz średnie wydatki tylko jeśli mamy co najmniej 2 dni
      let avgSpending = 0;
      if (last7Days.length >= 2) {
        let totalSpending = 0;
        let validDays = 0;
        
        for (let i = 1; i < last7Days.length; i++) {
          const spending = last7Days[i - 1].balance - last7Days[i].balance;
          if (spending > 0) {
            totalSpending += spending;
            validDays++;
          }
        }
        
        avgSpending = validDays > 0 ? totalSpending / validDays : 0;
      }

      // Prognoza uwzględniająca zaplanowane przychody i wydatki
      const projectedEndWithPlans = currentBalance + totalIncome - totalExpenses;
      const projectedEnd = projectedEndWithPlans - (avgSpending * daysRemaining);
      
      const targetDaily = daysRemaining > 0 ? projectedEndWithPlans / daysRemaining : 0;

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

      // D) Ile dni starczy pieniędzy przy obecnym tempie
      let daysMoneyWillLast = 0;
      let moneyRunsOutDate = null;
      if (avgSpending > 0) {
        daysMoneyWillLast = Math.floor(currentBalance / avgSpending);
        const runsOutDate = new Date();
        runsOutDate.setDate(runsOutDate.getDate() + daysMoneyWillLast);
        moneyRunsOutDate = runsOutDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
      }

      // E) Optymalna dzienka do zachowania rezerwy
      const targetDailyWithBuffer = daysRemaining > 0 ? (projectedEndWithPlans - targetBuffer) / daysRemaining : 0;

      setForecasts({
        projectedEndOfMonth: projectedEnd,
        avgDailySpending: avgSpending,
        targetDailyToZero: targetDaily,
        consecutiveDays,
        trendDirection,
        vsStartPercent,
        daysRemaining: daysRemaining,
        daysMoneyWillLast,
        moneyRunsOutDate,
        targetDailyWithBuffer,
      });
    }
  };

  return {
    historyData,
    trend,
    forecasts,
  };
};
