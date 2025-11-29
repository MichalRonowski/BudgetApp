const { initializeApp } = require('firebase/app');
const { getFirestore, collection, setDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDpE3wvQCDskikxbr7Fqb9Gt8fpOAI0Jdo",
  authDomain: "budgetapp-2f553.firebaseapp.com",
  projectId: "budgetapp-2f553",
  storageBucket: "budgetapp-2f553.firebasestorage.app",
  messagingSenderId: "502068034831",
  appId: "1:502068034831:web:a4c92e6fdcc1a0ffe9b1e8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedBalanceHistory() {
  console.log('Rozpoczynam seedowanie danych...');
  
  const startDate = new Date('2025-11-28');
  const endDate = new Date('2025-11-28');
  
  let currentDate = new Date(startDate);
  let currentBalance = 3350;
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Oblicz rzeczywiste dzienne budżety
    const now = new Date(currentDate);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    
    const daysToCurrentMonthEnd = Math.max(1, Math.ceil((currentMonthEnd - now) / (1000 * 60 * 60 * 24)) + 1);
    const daysToNextMonthEnd = Math.max(1, Math.ceil((nextMonthEnd - now) / (1000 * 60 * 60 * 24)) + 1);
    
    const dailyBudgetCurrentMonth = Math.floor(currentBalance / daysToCurrentMonthEnd);
    const dailyBudgetNextMonth = Math.floor(currentBalance / daysToNextMonthEnd);
    
    await setDoc(doc(db, 'balanceHistory', dateStr), {
      date: dateStr,
      balance: currentBalance,
      dailyBudgetCurrentMonth,
      dailyBudgetNextMonth,
      timestamp: new Date(currentDate)
    });
    
    console.log(`✓ Dodano dane dla ${dateStr} (saldo: ${currentBalance} zł)`);
    
    currentDate.setDate(currentDate.getDate() + 1);
    currentBalance += Math.floor(Math.random() * 200) - 100;
    currentBalance = Math.max(5000, Math.min(7000, currentBalance));
  }
  
  console.log('✅ Seedowanie zakończone!');
  process.exit(0);
}

seedBalanceHistory().catch(error => {
  console.error('Błąd podczas seedowania:', error);
  process.exit(1);
});
