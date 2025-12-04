# Skrypt do wdrażania aktualizacji aplikacji BudgetApp

Write-Host "🔨 Budowanie wersji webowej..." -ForegroundColor Cyan
npx expo export -p web

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Błąd podczas budowania aplikacji" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Wdrażanie na Firebase Hosting..." -ForegroundColor Cyan
firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Błąd podczas wdrażania" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Zapisywanie zmian w Git..." -ForegroundColor Cyan
git add .

$commitMessage = Read-Host "Wpisz opis zmian (Enter = 'Update deployment')"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update deployment"
}

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n⬆️ Wysyłanie na GitHub..." -ForegroundColor Cyan
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Gotowe! Aplikacja zaktualizowana:" -ForegroundColor Green
        Write-Host "   https://budgetapp-2f553.web.app" -ForegroundColor Yellow
    } else {
        Write-Host "`n⚠️ Wdrozenie zakonczone, ale push do GitHub nie powiodl sie" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✅ Wdrozenie zakonczone (brak zmian do commita)" -ForegroundColor Green
    Write-Host "   https://budgetapp-2f553.web.app" -ForegroundColor Yellow
}
