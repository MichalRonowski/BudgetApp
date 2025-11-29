// Skrypt do usunięcia fikcyjnych danych z Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDpE3wvQCDskikxbr7Fqb9Gt8fpOAI0Jdo",
  authDomain: "budgetapp-2f553.firebaseapp.com",
  projectId: "budgetapp-2f553",
  storageBucket: "budgetapp-2f553.firebasestorage.app",
  messagingSenderId: "902072927164",
  appId: "1:902072927164:web:fa4adeff4286cd6a84e1b9",
  measurementId: "G-7JD85ZB6CN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearNovemberData() {
  console.log('Rozpoczynam czyszczenie danych...');

  try {
    // Pobierz wszystkie dokumenty z listopada 2025
    const q = query(
      collection(db, 'balanceHistory'),
      where('date', '>=', '2025-10-31'),
      where('date', '<', '2025-11-29')
    );

    const querySnapshot = await getDocs(q);
    
    console.log(`Znaleziono ${querySnapshot.size} dokumentów do usunięcia`);

    // Usuń każdy dokument
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
      console.log(`✓ Usunięto ${docSnapshot.id}`);
    }

    console.log('✅ Czyszczenie zakończone!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  }
}

clearNovemberData();
