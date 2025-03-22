import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Circle, Transformer, Text } from 'react-konva';

const Whiteboard = () => {
  // State for managing shapes
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState('pen'); // pen, rect, circle, text, eraser, select
  const [lines, setLines] = useState([]);
  const [isPainting, setIsPainting] = useState(false);
  const [textEditingId, setTextEditingId] = useState(null);
  const [textValue, setTextValue] = useState('');
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  
  // Refs
  const stageRef = useRef(null);
  const textAreaRef = useRef(null);
  const transformerRef = useRef(null);
  
  // Style and config
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  
  // Handle selection
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      // Find the selected node
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        // Attach transformer to the selected node
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      // Clear transformer nodes
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);
  
  // Handle text editing
  useEffect(() => {
    if (textEditingId !== null) {
      const shape = shapes.find(s => s.id === textEditingId);
      if (shape && shape.type === 'text') {
        setTextValue(shape.text);
        
        // Position textarea over the text on stage
        const stage = stageRef.current;
        const textNode = stage.findOne('#' + textEditingId);
        
        if (textNode && textAreaRef.current) {
          const textPosition = textNode.absolutePosition();
          const stageBox = stage.container().getBoundingClientRect();
          
          const areaPosition = {
            x: stageBox.left + textPosition.x,
            y: stageBox.top + textPosition.y,
          };
          
          const textarea = textAreaRef.current;
          textarea.style.position = 'absolute';
          textarea.style.top = `${areaPosition.y}px`;
          textarea.style.left = `${areaPosition.x}px`;
          textarea.style.width = `${textNode.width() * textNode.scaleX()}px`;
          textarea.style.height = `${textNode.height() * textNode.scaleY()}px`;
          textarea.style.fontSize = `${shape.fontSize}px`;
          textarea.style.border = '1px solid black';
          textarea.style.padding = '0px';
          textarea.style.margin = '0px';
          textarea.style.overflow = 'hidden';
          textarea.style.background = 'none';
          textarea.style.outline = 'none';
          textarea.style.resize = 'none';
          textarea.style.lineHeight = 'normal';
          textarea.style.fontFamily = 'sans-serif';
          textarea.style.transformOrigin = 'left top';
          textarea.style.display = 'block';
          
          textarea.focus();
        }
      }
    }
  }, [textEditingId, shapes]);
  
  // Save state to history
  const addToHistory = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({
      shapes: JSON.parse(JSON.stringify(shapes)),
      lines: JSON.parse(JSON.stringify(lines)),
    });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };
  
  // Undo
  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      const prevState = history[newStep];
      setShapes(prevState.shapes);
      setLines(prevState.lines);
      setHistoryStep(newStep);
    }
  };
  
  // Redo
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      const nextState = history[newStep];
      setShapes(nextState.shapes);
      setLines(nextState.lines);
      setHistoryStep(newStep);
    }
  };
  
  // Handle mouse down
  const handleMouseDown = (e) => {
    if (textEditingId !== null) {
      completeTextEditing();
      return;
    }
    
    // Deselect when clicking on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
    
    if (tool === 'select') {
      return;
    }
    
    setIsPainting(true);
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'pen') {
      const newLine = {
        id: Date.now().toString(),
        tool,
        points: [pos.x, pos.y],
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      };
      setLines([...lines, newLine]);
    } else if (tool === 'eraser') {
      const newLine = {
        id: Date.now().toString(),
        tool,
        points: [pos.x, pos.y],
        stroke: 'white',
        strokeWidth: strokeWidth * 2,
      };
      setLines([...lines, newLine]);
    } else if (tool === 'rect') {
      const id = Date.now().toString();
      const newShape = {
        id,
        type: 'rectangle',
        x: pos.x,
        y: pos.y,
        width: 1,
        height: 1,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        fill: fillColor,
      };
      setShapes([...shapes, newShape]);
      setSelectedId(id);
    } else if (tool === 'circle') {
      const id = Date.now().toString();
      const newShape = {
        id,
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 1,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        fill: fillColor,
      };
      setShapes([...shapes, newShape]);
      setSelectedId(id);
    } else if (tool === 'text') {
      const id = Date.now().toString();
      const newShape = {
        id,
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: 'Click to edit',
        fontSize: 20,
        fill: strokeColor,
        width: 200,
      };
      setShapes([...shapes, newShape]);
      setSelectedId(id);
      setTextEditingId(id);
    }
  };
  
  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!isPainting) {
      return;
    }
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    if (tool === 'pen' || tool === 'eraser') {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        setLines([...lines.slice(0, -1), lastLine]);
      }
    } else if (tool === 'rect' && selectedId) {
      const selectedShape = shapes.find(s => s.id === selectedId);
      if (selectedShape && selectedShape.type === 'rectangle') {
        const newShapes = shapes.map(shape => {
          if (shape.id === selectedId) {
            return {
              ...shape,
              width: point.x - shape.x,
              height: point.y - shape.y,
            };
          }
          return shape;
        });
        setShapes(newShapes);
      }
    } else if (tool === 'circle' && selectedId) {
      const selectedShape = shapes.find(s => s.id === selectedId);
      if (selectedShape && selectedShape.type === 'circle') {
        const dx = point.x - selectedShape.x;
        const dy = point.y - selectedShape.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        const newShapes = shapes.map(shape => {
          if (shape.id === selectedId) {
            return {
              ...shape,
              radius,
            };
          }
          return shape;
        });
        setShapes(newShapes);
      }
    }
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    if (isPainting) {
      setIsPainting(false);
      addToHistory();
    }
  };
  
  // Handle shape transform
  const handleTransformEnd = () => {
    addToHistory();
  };
  
  // Complete text editing
  const completeTextEditing = () => {
    if (textEditingId !== null && textAreaRef.current) {
      const newShapes = shapes.map(shape => {
        if (shape.id === textEditingId) {
          return {
            ...shape,
            text: textValue,
          };
        }
        return shape;
      });
      
      setShapes(newShapes);
      setTextEditingId(null);
      setTextValue('');
      addToHistory();
    }
  };
  
  // Handle text change
  const handleTextChange = (e) => {
    setTextValue(e.target.value);
  };
  
  // Handle text area key down
  const handleTextAreaKeyDown = (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      // Enter without shift
      completeTextEditing();
    }
    if (e.keyCode === 27) {
      // Escape
      setTextEditingId(null);
      setTextValue('');
    }
  };
  
  // Export as image
  const exportImage = () => {
    const dataURL = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Clear whiteboard
  const clearWhiteboard = () => {
    setShapes([]);
    setLines([]);
    addToHistory();
  };
  
  // Initialize history
  useEffect(() => {
    addToHistory();
  }, []);
  
  return (
    <div className="whiteboard-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Toolbar */}
      <div className="toolbar" style={{ 
        display: 'flex', 
        backgroundColor: '#f5f5f5', 
        padding: '8px', 
        borderRadius: '8px',
        margin: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
      }}>
        <button 
          onClick={() => setTool('select')}
          style={{ 
            backgroundColor: tool === 'select' ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          Select
        </button>
        <button
          onClick={() => setTool('pen')}
          style={{ 
            backgroundColor: tool === 'pen' ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          Pen
        </button>
        <button
          onClick={() => setTool('rect')}
          style={{ 
            backgroundColor: tool === 'rect' ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          Rectangle
        </button>
        <button
          onClick={() => setTool('circle')}
          style={{ 
            backgroundColor: tool === 'circle' ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          Circle
        </button>
        <button
          onClick={() => setTool('text')}
          style={{ 
            backgroundColor: tool === 'text' ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          Text
        </button>
        <button
          onClick={() => setTool('eraser')}
          style={{ 
            backgroundColor: tool === 'eraser' ? '#e0e0e0' : 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: 'pointer'
          }}
        >
          Eraser
        </button>
        
        {/* Color picker */}
        <div style={{ margin: '0 8px' }}>
          <input 
            type="color" 
            value={strokeColor} 
            onChange={(e) => setStrokeColor(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        {/* Stroke width */}
        <div style={{ margin: '0 8px', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '4px' }}>Width:</span>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={strokeWidth} 
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        {/* Fill color for shapes */}
        <div style={{ margin: '0 8px', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '4px' }}>Fill:</span>
          <input 
            type="color" 
            value={fillColor === 'transparent' ? '#ffffff' : fillColor} 
            onChange={(e) => setFillColor(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <button
            onClick={() => setFillColor(fillColor === 'transparent' ? '#ffffff' : 'transparent')}
            style={{ 
              marginLeft: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer'
            }}
          >
            {fillColor === 'transparent' ? 'No Fill' : 'Fill'}
          </button>
        </div>
        
        {/* Undo/Redo */}
        <button
          onClick={handleUndo}
          disabled={historyStep <= 0}
          style={{ 
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: historyStep <= 0 ? 'default' : 'pointer',
            opacity: historyStep <= 0 ? 0.5 : 1
          }}
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={historyStep >= history.length - 1}
          style={{ 
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            margin: '0 4px',
            cursor: historyStep >= history.length - 1 ? 'default' : 'pointer',
            opacity: historyStep >= history.length - 1 ? 0.5 : 1
          }}
        >
          Redo
        </button>
        
        {/* Export and Clear */}
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
          onClick={clearWhiteboard}
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
      </div>
      
      {/* Stage */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden',
        margin: '8px',
        height: 'calc(100% - 80px)',
      }}>
        <Stage
          width={window.innerWidth - 20}
          height={window.innerHeight - 120}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {/* Drawing lines */}
            {lines.map((line, i) => (
              <Line
                key={line.id}
                id={line.id}
                points={line.points}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
            
            {/* Shapes */}
            {shapes.map((shape) => {
              if (shape.type === 'rectangle') {
                return (
                  <Rect
                    key={shape.id}
                    id={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                    draggable={tool === 'select'}
                    onClick={() => {
                      if (tool === 'select') {
                        setSelectedId(shape.id);
                      }
                    }}
                    onDragEnd={(e) => {
                      const newShapes = shapes.map(s => {
                        if (s.id === shape.id) {
                          return {
                            ...s,
                            x: e.target.x(),
                            y: e.target.y(),
                          };
                        }
                        return s;
                      });
                      setShapes(newShapes);
                      addToHistory();
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const newShapes = shapes.map(s => {
                        if (s.id === shape.id) {
                          return {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            width: node.width() * node.scaleX(),
                            height: node.height() * node.scaleY(),
                          };
                        }
                        return s;
                      });
                      // Reset scale
                      node.scaleX(1);
                      node.scaleY(1);
                      setShapes(newShapes);
                      handleTransformEnd();
                    }}
                  />
                );
              } else if (shape.type === 'circle') {
                return (
                  <Circle
                    key={shape.id}
                    id={shape.id}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                    draggable={tool === 'select'}
                    onClick={() => {
                      if (tool === 'select') {
                        setSelectedId(shape.id);
                      }
                    }}
                    onDragEnd={(e) => {
                      const newShapes = shapes.map(s => {
                        if (s.id === shape.id) {
                          return {
                            ...s,
                            x: e.target.x(),
                            y: e.target.y(),
                          };
                        }
                        return s;
                      });
                      setShapes(newShapes);
                      addToHistory();
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const newShapes = shapes.map(s => {
                        if (s.id === shape.id) {
                          return {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            radius: shape.radius * scaleX,
                          };
                        }
                        return s;
                      });
                      // Reset scale
                      node.scaleX(1);
                      node.scaleY(1);
                      setShapes(newShapes);
                      handleTransformEnd();
                    }}
                  />
                );
              } else if (shape.type === 'text') {
                return (
                  <Text
                    key={shape.id}
                    id={shape.id}
                    x={shape.x}
                    y={shape.y}
                    text={shape.text}
                    fontSize={shape.fontSize}
                    fill={shape.fill}
                    width={shape.width}
                    draggable={tool === 'select'}
                    onClick={() => {
                      if (tool === 'select') {
                        setSelectedId(shape.id);
                        setTextEditingId(shape.id);
                      } else if (tool === 'text') {
                        setSelectedId(shape.id);
                        setTextEditingId(shape.id);
                      }
                    }}
                    onDragEnd={(e) => {
                      const newShapes = shapes.map(s => {
                        if (s.id === shape.id) {
                          return {
                            ...s,
                            x: e.target.x(),
                            y: e.target.y(),
                          };
                        }
                        return s;
                      });
                      setShapes(newShapes);
                      addToHistory();
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const newShapes = shapes.map(s => {
                        if (s.id === shape.id) {
                          return {
                            ...s,
                            x: node.x(),
                            y: node.y(),
                            width: node.width() * node.scaleX(),
                            fontSize: shape.fontSize * node.scaleY(),
                          };
                        }
                        return s;
                      });
                      // Reset scale
                      node.scaleX(1);
                      node.scaleY(1);
                      setShapes(newShapes);
                      handleTransformEnd();
                    }}
                  />
                );
              }
              return null;
            })}
            
            {/* Transformer */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit minimum size
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>
      
      {/* Text editing textarea */}
      {textEditingId !== null && (
        <textarea
          ref={textAreaRef}
          value={textValue}
          onChange={handleTextChange}
          onKeyDown={handleTextAreaKeyDown}
          onBlur={completeTextEditing}
          style={{
            position: 'absolute',
            display: 'none', // Will be set via useEffect
          }}
        />
      )}
    </div>
  );
};

export default Whiteboard;