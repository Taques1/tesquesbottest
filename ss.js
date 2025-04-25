// ss.js
const { QuickDB } = require('quick.db');
const db = new QuickDB();

(async () => {
  try {
    await db.set('test_key', 'test_value');
    const value = await db.get('test_key');
    console.log('Valor armazenado:', value); // Deve imprimir 'test_value'
    await db.delete('test_key');
  } catch (err) {
    console.error('Erro:', err);
  }
})();
