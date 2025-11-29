import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useHomeScreen = () => {
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

  // Pobierz ustawienia (saldo i okres) z Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'budget'), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setCurrentBalance(data.currentBalance || 0);
        setMonthPeriod(data.monthPeriod || 'current');
      }
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

  // Zapisz do historii (wywoływane przy zmianie salda lub obliczeń)
  const saveToHistory = async () => {
    try {
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0];
      const historyDoc = doc(db, 'balanceHistory', dateKey);
      
      // Oblicz budżet dzienny dla bieżącego miesiąca
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysRemainingCurrent = Math.max(1, Math.ceil((currentMonthEnd - now) / (1000 * 60 * 60 * 24)) + 1);
      const dailyBudgetCurrent = remainingMoney / daysRemainingCurrent;
      
      // Oblicz budżet dzienny dla następnego miesiąca
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      const daysRemainingNext = Math.max(1, Math.ceil((nextMonthEnd - now) / (1000 * 60 * 60 * 24)) + 1);
      const dailyBudgetNext = remainingMoney / daysRemainingNext;
      
      await setDoc(historyDoc, {
        balance: currentBalance,
        dailyBudgetCurrentMonth: dailyBudgetCurrent,
        dailyBudgetNextMonth: dailyBudgetNext,
        daysRemainingCurrentMonth: daysRemainingCurrent,
        daysRemainingNextMonth: daysRemainingNext,
        remainingMoney: remainingMoney,
        date: dateKey,
        timestamp: now.toISOString(),
        updatedAt: now.toISOString()
      });
    } catch (error) {
      console.error('Błąd zapisu historii:', error);
    }
  };

  // Zapisz saldo do Firebase
  const updateCurrentBalance = async (value) => {
    setCurrentBalance(value);
    try {
      const now = new Date();
      
      // Zapisz aktualny stan konta
      await setDoc(doc(db, 'settings', 'budget'), {
        currentBalance: value,
        monthPeriod,
        updatedAt: now.toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Błąd zapisu salda:', error);
    }
  };

  // Efekt do zapisywania historii przy zmianie kluczowych wartości
  useEffect(() => {
    if (currentBalance !== 0 || totalIncome !== 0 || totalExpenses !== 0) {
      saveToHistory();
    }
  }, [currentBalance, totalIncome, totalExpenses, dailyBudget]);

  // Zapisz okres do Firebase
  const updateMonthPeriod = async (value) => {
    setMonthPeriod(value);
    try {
      await setDoc(doc(db, 'settings', 'budget'), {
        currentBalance,
        monthPeriod: value,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Błąd zapisu okresu:', error);
    }
  };

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

  return {
    // State
    income,
    expenses,
    currentBalance,
    setCurrentBalance: updateCurrentBalance,
    monthPeriod,
    setMonthPeriod: updateMonthPeriod,
    modalVisible,
    setModalVisible,
    modalType,
    itemName,
    setItemName,
    itemAmount,
    setItemAmount,
    
    // Computed values
    totalIncome,
    totalExpenses,
    remainingMoney,
    daysRemaining,
    dailyBudget,
    monthName,
    
    // Functions
    addItem,
    deleteItem,
    openModal,
  };
};
