
// Шапка онбординга: только логотип по центру. Правый блок макета (флаг и баланс)
// не воспроизводим — денежного баланса в продукте нет, валюта приложения это XP.
export default function OnboardHeader() {
  return (
    <div style={{
      position: 'relative',
      zIndex: 1,
      height: '64px',
      padding: '16px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
    }}>
      <img src="/icons/Logo-2.svg" alt="888starz" style={{ width: '102px', display: 'block' }} />
    </div>
  )
}
