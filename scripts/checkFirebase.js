const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, orderBy, query } = require('firebase/firestore');

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

async function checkFirebaseData() {
  console.log('📊 Sprawdzam dane w Firebase...\n');
  
  // Balance History
  console.log('=== BALANCE HISTORY ===');
  const historyQuery = query(collection(db, 'balanceHistory'), orderBy('date', 'asc'));
  const historySnapshot = await getDocs(historyQuery);
  
  historySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`\n📅 ${data.date}:`);
    console.log(`   Balance: ${data.balance} zł`);
    console.log(`   Remaining Money: ${data.remainingMoney || 'N/A'} zł`);
    console.log(`   Daily Budget (Current): ${data.dailyBudgetCurrentMonth} zł`);
    console.log(`   Days Remaining (Current): ${data.daysRemainingCurrentMonth || 'N/A'}`);
    console.log(`   Daily Budget (Next): ${data.dailyBudgetNextMonth} zł`);
    console.log(`   Days Remaining (Next): ${data.daysRemainingNextMonth || 'N/A'}`);
  });
  
  // Income
  console.log('\n\n=== INCOME ===');
  const incomeSnapshot = await getDocs(collection(db, 'income'));
  let totalIncome = 0;
  incomeSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`${data.name}: ${data.amount} zł`);
    totalIncome += data.amount;
  });
  console.log(`TOTAL INCOME: ${totalIncome} zł`);
  
  // Expenses
  console.log('\n=== EXPENSES ===');
  const expensesSnapshot = await getDocs(collection(db, 'expenses'));
  let totalExpenses = 0;
  expensesSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`${data.name}: ${data.amount} zł`);
    totalExpenses += data.amount;
  });
  console.log(`TOTAL EXPENSES: ${totalExpenses} zł`);
  
  // Settings
  console.log('\n=== SETTINGS ===');
  const settingsSnapshot = await getDocs(collection(db, 'settings'));
  settingsSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`${doc.id}:`, data);
  });
  
  process.exit(0);
}

checkFirebaseData().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
