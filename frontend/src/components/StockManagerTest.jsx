import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const StockManagerTest = () => {
  const [showModal, setShowModal] = useState(false);
  
  console.log('StockManagerTest rendered, showModal:', showModal);

  const handleButtonClick = () => {
    console.log('Test button clicked!');
    setShowModal(true);
  };

  const handleClose = () => {
    console.log('Closing modal');
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Test Manager (Simple)
      </button>

      {showModal && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={handleClose}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Test Modal</h2>
            <p>If you can see this, the basic portal functionality works!</p>
            <button onClick={handleClose}>Close</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default StockManagerTest; 