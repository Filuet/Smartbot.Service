import React from 'react';

export const appStyles = (): {
  mainDivContainer: React.CSSProperties;
  menuContainer: React.CSSProperties;
  textStyles: React.CSSProperties;
  restartButtonStyles: React.CSSProperties;
  cancelButtonStyles: React.CSSProperties;
  imageDivContainer: React.CSSProperties;
  botImageStyles: React.CSSProperties;
  buttonContainer: React.CSSProperties;
} => ({
  mainDivContainer: {
    bottom: 0,
    right: 0,
    position: 'fixed',
    zIndex: 9999999
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px',
    borderBottomRightRadius: '20px',
    borderBottomLeftRadius: '5px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    padding: '16px',
    bottom: 0,
    right: 0,
    minWidth: '200px',
    touchAction: 'none',
    backdropFilter: 'blur(10px)',
    zIndex: 9999998
  },
  textStyles: {
    margin: '0 0 0 5px',
    fontSize: '16px',
    color: 'black',
    textAlign: 'center',
    paddingBottom: '20px'
  },
  restartButtonStyles: {
    padding: '8px 16px',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  cancelButtonStyles: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  imageDivContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: 'white',
    cursor: 'grab',
    userSelect: 'none',
    transition: 'transform 0.2s',
    zIndex: 9999999,
    position: 'relative'
  },
  botImageStyles: { width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: '30px'
  }
});
