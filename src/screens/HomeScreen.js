import React, { useState } from 'react';
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

  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [archiveDate, setArchiveDate] = useState('');
  const [archiveBalance, setArchiveBalance] = useState('');
  const [selectedIncome, setSelectedIncome] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [targetBuffer, setTargetBuffer] = useState(500);

  const { historyData, trend, forecasts } = useBudgetTrend(monthPeriod, totalIncome, totalExpenses, currentBalance, targetBuffer);

  const toggleIncomeSelection = (id) => {
    setSelectedIncome(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleExpenseSelection = (id) => {
    setSelectedExpenses(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addArchiveData = async () => {
    if (!archiveDate || !archiveBalance) {
      alert('Wypełnij wszystkie pola');
      return;
    }

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');

      const balance = parseFloat(archiveBalance);
      const date = new Date(archiveDate);
      const dateStr = date.toISOString().split('T')[0];

      // Oblicz sumy wybranych pozycji
      const selectedIncomeTotal = income
        .filter(item => selectedIncome.includes(item.id))
        .reduce((sum, item) => sum + item.amount, 0);
      
      const selectedExpensesTotal = expenses
        .filter(item => selectedExpenses.includes(item.id))
        .reduce((sum, item) => sum + item.amount, 0);

      // Oblicz dzienne budżety z uwzględnieniem wybranych przychodów i wydatków
      const currentMonthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const nextMonthEnd = new Date(date.getFullYear(), date.getMonth() + 2, 0);
      
      const daysToCurrentMonthEnd = Math.max(1, Math.ceil((currentMonthEnd - date) / (1000 * 60 * 60 * 24)) + 1);
      const daysToNextMonthEnd = Math.max(1, Math.ceil((nextMonthEnd - date) / (1000 * 60 * 60 * 24)) + 1);
      
      const adjustedBalance = balance + selectedIncomeTotal - selectedExpensesTotal;
      
      const dailyBudgetCurrentMonth = Math.floor(adjustedBalance / daysToCurrentMonthEnd);
      const dailyBudgetNextMonth = Math.floor(adjustedBalance / daysToNextMonthEnd);

      await setDoc(doc(db, 'balanceHistory', dateStr), {
        date: dateStr,
        balance: balance,
        dailyBudgetCurrentMonth,
        dailyBudgetNextMonth,
        timestamp: date
      });

      setArchiveModalVisible(false);
      setArchiveDate('');
      setArchiveBalance('');
      setSelectedIncome([]);
      setSelectedExpenses([]);
      alert('Dane archiwalne dodane!');
    } catch (error) {
      console.error('Błąd dodawania danych archiwalnych:', error);
      alert('Błąd podczas dodawania danych');
    }
  };

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
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Docelowa rezerwa na koniec miesiąca:</Text>
          <TextInput
            style={styles.balanceInput}
            value={targetBuffer.toString()}
            onChangeText={(text) => setTargetBuffer(parseFloat(text) || 0)}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
      </View>

      {/* Wykres trendu i prognozy */}
      <View style={styles.chartSection}>
        <TouchableOpacity 
          style={styles.archiveButton}
          onPress={() => setArchiveModalVisible(true)}
        >
          <Text style={styles.archiveButtonText}>📅 Dodaj archiwalne dane</Text>
        </TouchableOpacity>
        <BudgetTrendChart 
          historyData={historyData}
          monthPeriod={monthPeriod}
          trend={trend}
          forecasts={forecasts}
          targetBuffer={targetBuffer}
          setTargetBuffer={setTargetBuffer}
        />
      </View>

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

      {/* Modal dodawania archiwalnych danych */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={archiveModalVisible}
        onRequestClose={() => setArchiveModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dodaj dane archiwalne</Text>
            
            <Text style={styles.inputLabel}>Data (RRRR-MM-DD):</Text>
            <TextInput
              style={styles.input}
              value={archiveDate}
              onChangeText={setArchiveDate}
              placeholder="2025-11-01"
            />
            
            <Text style={styles.inputLabel}>Stan konta (zł):</Text>
            <TextInput
              style={styles.input}
              value={archiveBalance}
              onChangeText={setArchiveBalance}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            
            {/* Wybór przychodów */}
            {income.length > 0 && (
              <View style={styles.selectionSection}>
                <Text style={styles.selectionTitle}>Uwzględnij przychody:</Text>
                <ScrollView style={styles.selectionList}>
                  {income.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.checkboxItem}
                      onPress={() => toggleIncomeSelection(item.id)}
                    >
                      <View style={[
                        styles.checkbox,
                        selectedIncome.includes(item.id) && styles.checkboxChecked
                      ]}>
                        {selectedIncome.includes(item.id) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        {item.name} ({item.amount.toFixed(2)} zł)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Wybór wydatków */}
            {expenses.length > 0 && (
              <View style={styles.selectionSection}>
                <Text style={styles.selectionTitle}>Uwzględnij wydatki:</Text>
                <ScrollView style={styles.selectionList}>
                  {expenses.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.checkboxItem}
                      onPress={() => toggleExpenseSelection(item.id)}
                    >
                      <View style={[
                        styles.checkbox,
                        selectedExpenses.includes(item.id) && styles.checkboxChecked
                      ]}>
                        {selectedExpenses.includes(item.id) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        {item.name} ({item.amount.toFixed(2)} zł)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setArchiveModalVisible(false);
                  setArchiveDate('');
                  setArchiveBalance('');
                  setSelectedIncome([]);
                  setSelectedExpenses([]);
                }}
              >
                <Text style={styles.modalButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={addArchiveData}
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