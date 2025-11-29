import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useHomeScreen } from '../hooks/useHomeScreen';
import { useBudgetTrend } from '../hooks/useBudgetTrend';
import { BudgetTrendChart } from '../components/BudgetTrendChart';
import { styles } from '../styles/HomeScreen.styles';

export default function HomeScreen() {
  const {
    income,
    expenses,
    currentBalance,
    setCurrentBalance,
    monthPeriod,
    setMonthPeriod,
    modalVisible,
    setModalVisible,
    modalType,
    itemName,
    setItemName,
    itemAmount,
    setItemAmount,
    totalIncome,
    totalExpenses,
    remainingMoney,
    daysRemaining,
    dailyBudget,
    monthName,
    addItem,
    deleteItem,
    openModal,
  } = useHomeScreen();

  const { historyData, trend, forecasts } = useBudgetTrend(monthPeriod);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Budżet Domowy 💰</Text>
        
        {/* Podsumowanie */}
        <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Aktualny stan konta:</Text>
          <TextInput
            style={styles.balanceInput}
            value={currentBalance.toString()}
            onChangeText={(text) => setCurrentBalance(parseFloat(text) || 0)}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
        
        {/* Wybór okresu */}
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, monthPeriod === 'current' && styles.periodButtonActive]}
            onPress={() => setMonthPeriod('current')}
          >
            <Text style={[styles.periodButtonText, monthPeriod === 'current' && styles.periodButtonTextActive]}>
              Bieżący miesiąc
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, monthPeriod === 'next' && styles.periodButtonActive]}
            onPress={() => setMonthPeriod('next')}
          >
            <Text style={[styles.periodButtonText, monthPeriod === 'next' && styles.periodButtonTextActive]}>
              Następny miesiąc
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Przychody:</Text>
          <Text style={styles.incomeText}>{totalIncome.toFixed(2)} zł</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Wydatki:</Text>
          <Text style={styles.expenseText}>{totalExpenses.toFixed(2)} zł</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelBold}>Pozostało:</Text>
          <Text style={[styles.remainingText, remainingMoney < 0 && styles.negativeText]}>
            {remainingMoney.toFixed(2)} zł
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Do końca {monthName} ({daysRemaining} dni):</Text>
          <Text style={styles.dailyText}>{dailyBudget.toFixed(2)} zł/dzień</Text>
        </View>
      </View>

      {/* Wykres trendu i prognozy */}
      <BudgetTrendChart 
        historyData={historyData}
        monthPeriod={monthPeriod}
        trend={trend}
        forecasts={forecasts}
      />

      {/* Przyciski dodawania */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.addButton, styles.incomeButton]} 
          onPress={() => openModal('income')}
        >
          <Text style={styles.buttonText}>+ Przychód</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.addButton, styles.expenseButton]} 
          onPress={() => openModal('expense')}
        >
          <Text style={styles.buttonText}>+ Wydatek</Text>
        </TouchableOpacity>
      </View>

      {/* Lista przychodów */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Przychody</Text>
        {income.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemRight}>
              <Text style={styles.incomeAmount}>{parseFloat(item.amount).toFixed(2)} zł</Text>
              <TouchableOpacity onPress={() => deleteItem(item.id, 'income')}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {income.length === 0 && <Text style={styles.emptyText}>Brak przychodów</Text>}
      </View>

      {/* Lista wydatków */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wydatki</Text>
        {expenses.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemRight}>
              <Text style={styles.expenseAmount}>{parseFloat(item.amount).toFixed(2)} zł</Text>
              <TouchableOpacity onPress={() => deleteItem(item.id, 'expense')}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {expenses.length === 0 && <Text style={styles.emptyText}>Brak wydatków</Text>}
      </View>

      {/* Modal dodawania */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Dodaj {modalType === 'income' ? 'Przychód' : 'Wydatek'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nazwa"
              value={itemName}
              onChangeText={setItemName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Kwota (zł)"
              value={itemAmount}
              onChangeText={setItemAmount}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setModalVisible(false);
                  setItemName('');
                  setItemAmount('');
                }}
              >
                <Text style={styles.modalButtonText}>Anuluj</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={addItem}
              >
                <Text style={styles.modalButtonText}>Dodaj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </ScrollView>
  );
}