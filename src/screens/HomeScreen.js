import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function HomeScreen() {
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthPeriod, setMonthPeriod] = useState('current'); // 'current' or 'next'
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('income'); // 'income' or 'expense'
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');

  // Pobierz przychody z Firebase
  useEffect(() => {
    const q = query(collection(db, 'income'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setIncome(items);
    });
    return () => unsubscribe();
  }, []);

  // Pobierz wydatki z Firebase
  useEffect(() => {
    const q = query(collection(db, 'expenses'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(items);
    });
    return () => unsubscribe();
  }, []);

  // Obliczenia
  const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const remainingMoney = currentBalance + totalIncome - totalExpenses;
  
  // Dni do końca miesiąca (włącznie z dzisiejszym dniem)
  const today = new Date();
  const monthOffset = monthPeriod === 'current' ? 1 : 2;
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 0);
  const daysRemaining = Math.max(1, Math.ceil((lastDayOfMonth - today) / (1000 * 60 * 60 * 24)) + 1);
  const dailyBudget = remainingMoney / daysRemaining;
  
  const monthName = monthPeriod === 'current' 
    ? ['Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca', 'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia'][today.getMonth()]
    : ['Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca', 'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia'][(today.getMonth() + 1) % 12];

  // Dodaj pozycję
  const addItem = async () => {
    if (!itemName || !itemAmount) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }

    try {
      const collectionName = modalType === 'income' ? 'income' : 'expenses';
      await addDoc(collection(db, collectionName), {
        name: itemName,
        amount: parseFloat(itemAmount),
        createdAt: new Date().toISOString()
      });
      
      setItemName('');
      setItemAmount('');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Błąd', error.message);
    }
  };

  // Usuń pozycję
  const deleteItem = async (id, type) => {
    try {
      const collectionName = type === 'income' ? 'income' : 'expenses';
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      Alert.alert('Błąd', error.message);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
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
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 800,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryLabelBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  incomeText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  expenseText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  negativeText: {
    color: '#f44336',
  },
  dailyText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  balanceInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
    textAlign: 'right',
  },
  periodSelector: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 5,
    gap: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  periodButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  periodButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  incomeButton: {
    backgroundColor: '#4CAF50',
  },
  expenseButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeAmount: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 10,
  },
  expenseAmount: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '600',
    marginRight: 10,
  },
  deleteButton: {
    fontSize: 20,
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
