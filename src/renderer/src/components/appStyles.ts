import React from 'react';

export const appStyles = (): {
  imageDivContainer: React.CSSProperties;
  botImageStyles: React.CSSProperties;
} => ({
  imageDivContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: 'white',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'transform 0.2s',
    zIndex: '9999999',
    position: 'relative',
    display: 'flex',
    alignContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  },
  botImageStyles: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    pointerEvents: 'none'
  }
});
