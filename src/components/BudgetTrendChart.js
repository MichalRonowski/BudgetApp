import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { styles } from '../styles/BudgetTrend.styles';

export const BudgetTrendChart = ({ historyData, monthPeriod, trend, forecasts }) => {
  const screenWidth = Dimensions.get('window').width;
  const containerWidth = Math.min(screenWidth - 40, 760); // Max 800px - 40px padding

  if (!historyData || historyData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Brak danych historycznych</Text>
      </View>
    );
  }

  const field = monthPeriod === 'current' ? 'dailyBudgetCurrentMonth' : 'dailyBudgetNextMonth';
  
  // Przygotuj dane do wykresu
  const labels = historyData.map(item => {
    const date = new Date(item.date);
    return date.getDate().toString();
  });

  const data = historyData.map(item => item[field] || 0);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
      strokeWidth: 1,
    },
  };

  const getTrendIcon = () => {
    if (trend.direction === 'up') return '📈';
    if (trend.direction === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = () => {
    if (trend.direction === 'up') return '#4CAF50';
    if (trend.direction === 'down') return '#f44336';
    return '#999';
  };

  const getTrendText = () => {
    if (trend.direction === 'up') return 'Rośnie';
    if (trend.direction === 'down') return 'Maleje';
    return 'Stabilny';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trend Budżetu</Text>
        <View style={styles.trendIndicator}>
          <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {getTrendText()} {Math.abs(parseFloat(trend.percentage))}%
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <BarChart
          data={{
            labels: labels,
            datasets: [{ data: data }],
          }}
          width={Math.max(containerWidth, labels.length * 40)}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars={false}
          withInnerLines={true}
        />
      </ScrollView>

      {/* Prognozy */}
      {forecasts && Object.keys(forecasts).length > 0 && (
        <View style={styles.forecastsContainer}>
          <Text style={styles.forecastsTitle}>📊 Prognozy i Analizy</Text>
          
          {/* A) Prognoza końca miesiąca */}
          <View style={styles.forecastItem}>
            <Text style={styles.forecastLabel}>
              Przy obecnym tempie na koniec miesiąca:
            </Text>
            <Text style={[
              styles.forecastValue,
              forecasts.projectedEndOfMonth < 0 ? styles.negativeValue : styles.positiveValue
            ]}>
              {forecasts.projectedEndOfMonth?.toFixed(2)} zł
            </Text>
          </View>

          {/* Średnie wydatki */}
          <View style={styles.forecastItem}>
            <Text style={styles.forecastLabel}>
              Średnie wydatki (ostatnie 7 dni):
            </Text>
            <Text style={styles.forecastValue}>
              {forecasts.avgDailySpending?.toFixed(2)} zł/dzień
            </Text>
          </View>

          {/* Cel do zera */}
          <View style={styles.forecastItem}>
            <Text style={styles.forecastLabel}>
              Żeby zostało 0 zł, możesz wydawać:
            </Text>
            <Text style={styles.forecastValue}>
              {forecasts.targetDailyToZero?.toFixed(2)} zł/dzień
            </Text>
          </View>

          {/* B) Alerty trendu */}
          {forecasts.consecutiveDays >= 3 && (
            <View style={[
              styles.alert,
              forecasts.trendDirection === 'down' ? styles.alertWarning : styles.alertSuccess
            ]}>
              <Text style={styles.alertText}>
                {forecasts.trendDirection === 'down' 
                  ? `⚠️ Budżet maleje ${forecasts.consecutiveDays} dni z rzędu`
                  : `✅ Budżet rośnie ${forecasts.consecutiveDays} dni z rzędu - świetnie!`
                }
              </Text>
            </View>
          )}

          {/* C) Trend vs początek miesiąca */}
          <View style={styles.forecastItem}>
            <Text style={styles.forecastLabel}>
              Zmiana od początku miesiąca:
            </Text>
            <Text style={[
              styles.forecastValue,
              parseFloat(forecasts.vsStartPercent) < 0 ? styles.negativeValue : styles.positiveValue
            ]}>
              {parseFloat(forecasts.vsStartPercent) > 0 ? '+' : ''}{forecasts.vsStartPercent}%
            </Text>
          </View>

          {/* Dni pozostałe */}
          <View style={styles.forecastItem}>
            <Text style={styles.forecastLabel}>
              Dni do końca miesiąca:
            </Text>
            <Text style={styles.forecastValue}>
              {forecasts.daysRemaining} dni
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
