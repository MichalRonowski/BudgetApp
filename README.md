# Budget App

Aplikacja do planowania budżetu domowego z synchronizacją w czasie rzeczywistym.

## 🚀 Funkcje

- ✅ Dodawanie przychodów i wydatków
- ✅ Automatyczne obliczanie pozostałych środków
- ✅ Dzienny budżet do końca miesiąca
- ✅ Synchronizacja w czasie rzeczywistym (Firebase)
- ✅ Działa na iOS, Android i Web

## 📱 Technologie

- **React Native + Expo** - framework mobilny/webowy
- **Firebase Firestore** - baza danych w czasie rzeczywistym

## 🛠️ Konfiguracja Firebase

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Utwórz nowy projekt
3. Dodaj aplikację Web do projektu
4. Skopiuj konfigurację Firebase
5. Wklej ją do pliku `src/config/firebase.js`
6. W Firebase Console włącz Firestore Database (Start in test mode)

## 📦 Instalacja

```bash
npm install
```

## 🏃‍♂️ Uruchamianie

### Web
```bash
npm run web
```

### Android
```bash
npm run android
```

### iOS (tylko macOS)
```bash
npm run ios
```

### Testowanie na telefonie
1. Zainstaluj aplikację **Expo Go** z App Store / Google Play
2. Uruchom `npm start`
3. Zeskanuj kod QR telefonem

## 📝 Struktura projektu

```
BudgetApp/
├── src/
│   ├── screens/
│   │   └── HomeScreen.js      # Główny ekran aplikacji
│   └── config/
│       └── firebase.js        # Konfiguracja Firebase
├── App.js                     # Punkt startowy aplikacji
└── package.json
```

## 🎯 Kolejne kroki

- [ ] Skonfigurować Firebase (patrz wyżej)
- [ ] Uruchomić aplikację: `npm run web`
- [ ] Przetestować na telefonie przez Expo Go

## 📄 Licencja

MIT - Aplikacja do użytku prywatnego
