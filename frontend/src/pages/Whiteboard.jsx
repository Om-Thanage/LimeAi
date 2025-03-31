import React, { useState } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { exportToBlob } from "@excalidraw/excalidraw";

const Whiteboard = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);
  const [theme, setTheme] = useState("light");
  
  const exportImage = async () => {
    if (!excalidrawAPI) return;
    
    try {
      const blob = await exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: { 
          ...excalidrawAPI.getAppState(),
          exportWithDarkMode: theme === "dark"
        },
        files: excalidrawAPI.getFiles(),
        getDimensions: () => {
          return { width: 1200, height: 800 };
        },
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'whiteboard-export.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting image:", error);
    }
  };

  const clearCanvas = () => {
    if (excalidrawAPI) {
      excalidrawAPI.resetScene();
    }
  };
  
  const toggleViewMode = () => {
    setViewModeEnabled(!viewModeEnabled);
  };
  
  const toggleZenMode = () => {
    setZenModeEnabled(!zenModeEnabled);
  };
  
  const toggleGridMode = () => {
    setGridModeEnabled(!gridModeEnabled);
  };
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="whiteboard-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100%' 
    }}>
      {/* Custom Controls */}
      <div className="toolbar" style={{ 
        display: 'flex', 
        backgroundColor: '#f5f5f5', 
        padding: '8px', 
        borderRadius: '8px',
        margin: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        zIndex: 1,
        flexWrap: 'wrap'
      }}>
        <button
          onClick={exportImage}
          style={{ 
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          Export
        </button>
        <button
          onClick={clearCanvas}
          style={{ 
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
        <button
          onClick={toggleViewMode}
          style={{ 
            backgroundColor: viewModeEnabled ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          {viewModeEnabled ? 'Edit Mode' : 'View Mode'}
        </button>
        <button
          onClick={toggleZenMode}
          style={{ 
            backgroundColor: zenModeEnabled ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          {zenModeEnabled ? 'Exit Zen Mode' : 'Zen Mode'}
        </button>
        <button
          onClick={toggleGridMode}
          style={{ 
            backgroundColor: gridModeEnabled ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          {gridModeEnabled ? 'Hide Grid' : 'Show Grid'}
        </button>
        <button
          onClick={toggleTheme}
          style={{ 
            backgroundColor: theme === 'dark' ? '#333' : 'white',
            color: theme === 'dark' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      
      {/* Excalidraw Component */}
      <div style={{ 
        height: 'calc(100% - 60px)', 
        width: '100%', 
        position: 'relative'
      }}>
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={{
            appState: {
              viewModeEnabled,
              zenModeEnabled,
              gridSize: gridModeEnabled ? 20 : null,
              theme
            }
          }}
          viewModeEnabled={viewModeEnabled}
          zenModeEnabled={zenModeEnabled}
          gridModeEnabled={gridModeEnabled}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default Whiteboard;