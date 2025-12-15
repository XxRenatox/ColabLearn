// Script de diagnóstico para ejecutar en la consola del navegador
// Copia y pega este código en la consola (F12) cuando estés en una sesión activa

console.log('=== DIAGNÓSTICO DE SESIÓN ===');

// 1. Verificar token
const token = localStorage.getItem('token');
console.log('Token existe:', !!token);
console.log('Token (primeros 20 chars):', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

// 2. Obtener sessionId de la URL o del estado
const sessionId = window.location.pathname.split('/').pop();
console.log('Session ID:', sessionId);

// 3. Probar GET /sessions/:id/resources
const API_URL = 'http://localhost:5000/api';
console.log('\n--- Probando GET /sessions/:id/resources ---');

fetch(`${API_URL}/sessions/${sessionId}/resources`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
    .then(res => {
        console.log('Status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('Respuesta:', data);
        if (data.data && data.data.resources) {
            console.log('Recursos encontrados:', data.data.resources.length);
            console.log('Recursos:', data.data.resources);
        }
    })
    .catch(err => {
        console.error('Error:', err);
    });

// 4. Verificar estado de React (si está disponible)
setTimeout(() => {
    console.log('\n--- Estado de React (si disponible) ---');
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactRootContainer) {
        console.log('React detectado');
    }
}, 1000);

console.log('\n=== FIN DIAGNÓSTICO ===');
console.log('Revisa los resultados arriba ^');
