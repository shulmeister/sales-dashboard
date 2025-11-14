import React from 'react';

function App() {
  console.log('🚀 App is rendering!');
  
  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: 'white',
      minHeight: '100vh',
      padding: '50px',
      fontSize: '24px'
    }}>
      <h1 style={{ color: '#3b82f6', fontSize: '48px', marginBottom: '30px' }}>
        🎉 HELLO FROM REACT!
      </h1>
      
      <div style={{
        backgroundColor: '#1e293b',
        padding: '30px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '2px solid #3b82f6'
      }}>
        <h2 style={{ color: '#22c55e' }}>Test Card 1</h2>
        <p>If you can see this, React is rendering!</p>
      </div>

      <div style={{
        backgroundColor: '#1e293b',
        padding: '30px',
        borderRadius: '10px',
        border: '2px solid #8b5cf6'
      }}>
        <h2 style={{ color: '#f59e0b' }}>Test Card 2</h2>
        <p>This is completely plain React - no React Admin!</p>
      </div>

      <button 
        onClick={() => alert('Button works!')}
        style={{
          marginTop: '30px',
          padding: '15px 30px',
          fontSize: '18px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Click Me!
      </button>
    </div>
  );
}

export default App;
