import logo from './logo.svg';
import React, { useState, setState, useRef, useEffect } from 'react';
import './App.css';
import cornerstone from "cornerstone-core";
import cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";

import ProbeTool from './Probe'


import './App.css'
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.ProbeTool = ProbeTool;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.init();



function App() {
  const imageId = "http://localhost:5000/static/images/Subject_01_frame_10_.png";


  const stack = '';
  let element;
  const [viewport, setViewport] = useState(cornerstone.getDefaultViewport(null, undefined));
  const [selectedTool, setSelectedTool] = useState("")
  const viewPortRef = useRef(null);

  const onWindowResize = () => {
    cornerstone.resize(viewPortRef.current);
  }

  const onImageRendered = () => {
    const viewport = cornerstone.getViewport(viewPortRef.current);
    setViewport(viewport);

  }

  const onNewImage = () => {
    const enabledElement = cornerstone.getEnabledElement(viewPortRef.current);
  }



  const is_inside_point = (cx, cy, px, py) => {
    var dx = px - cx;
    var dy = py - cy;
    return (dx * dx + dy * dy) < 6 * 6;
  }

  const onMouseClick = (e) => {
    // Mouse click on image
    // We get image points
    var x_image = e.detail.currentPoints.image.x;
    var y_image = e.detail.currentPoints.image.y;

    var old_data = measurements;
    // Check if click on any measurement
    for (var i = 0; i < old_data.length; i++) {
      if (is_inside_point(old_data[i].handles.end.x, old_data[i].handles.end.y, x_image, y_image)) {
        // If click on measurement, we show annotation editor
        setActiveMeasurment(old_data[i].uuid);
        setViewPosition({ x: e.detail.currentPoints.canvas.x, y: e.detail.currentPoints.canvas.y })
        setAnnotationEditorVisible(true);
      }
    }
  }


  const addElipticalTool = (e) => {
    const EllipticalRoiTool = cornerstoneTools.EllipticalRoiTool;
    cornerstoneTools.addTool(EllipticalRoiTool)
    cornerstoneTools.setToolActive('EllipticalRoi', { mouseButtonMask: 1 })
  }

  const addProbeTool = (e) => {
    const ProbeTool_V = cornerstoneTools.ProbeTool;
    cornerstoneTools.addTool(ProbeTool_V)
    cornerstoneTools.setToolActive('Probe', { mouseButtonMask: 1, disableTextBox: true })
    setSelectedTool("Probe")
  }

  const onChangeAnnotionLabel = (e) => {
    // Get measurments data
    var old_data = measurements //cornerstoneTools.getToolState(temp_element, "Probe").data

    // iterate over each and change label on annotation having uuid
    for (var i = 0; i < old_data.length; i++) {
      if (old_data[i].uuid === activeMeasurement) {
        if (e.target.name === 'calibration'){
          old_data[i].calibration = e.target.value;
        }else{
          old_data[i].label = e.target.value;
        }
        
      }
    }
    // Redraw to view changes
    cornerstone.draw(cornerstone.getEnabledElements()[0].element)
    setMeasurements(old_data)
    setAnnotationEditorVisible(false); // hide annotation editor popup
  }



  const [activeMeasurement, setActiveMeasurment] = useState("")
  const [measurements, setMeasurements] = useState([])
  const [viewPostion, setViewPosition] = useState({ x: 0, y: 0 })
  const [annotationEditorVisible, setAnnotationEditorVisible] = useState(false)

  const onMeasurementAdded = (e) => {
    // On new measurement added
    if (e.detail.toolName !== "Probe") { return; }

    // If new measurement added is a Probe, we get tool data and add to state
    var md = cornerstoneTools.getToolState(element, "Probe").data
    setMeasurements(md)
  }


  const onMeasurementModified = (e) => {
    // Measurement modified
  }


  useEffect(() => {
    element = viewPortRef.current;
    // Enable the DOM Element for use with Cornerstone

    cornerstone.enable(element);
    // Load the first image in the stack
    if (imageId) {

      cornerstone.loadImage(imageId).then(image => {
        // Display the first image    
        cornerstone.displayImage(element, image);

        element.addEventListener("cornerstoneimagerendered", onImageRendered);
        element.addEventListener("cornerstonenewimage", onNewImage);
        element.addEventListener("cornerstonetoolsmeasurementadded", onMeasurementAdded);
        element.addEventListener("cornerstonetoolsmeasurementmodified", onMeasurementModified);
        element.addEventListener("cornerstonetoolsmouseclick", onMouseClick);
        window.addEventListener("resize", onWindowResize);

      }).then(() => {
        addProbeTool()
        const ZoomTool = cornerstoneTools.ZoomTool;

        cornerstoneTools.addTool(ZoomTool)
        cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 })

        localStorage.setItem("debug", "cornerstoneTools")

      });
    }
  }, [measurements])


  const selectDeselect = (tool_name) => {
    if (selectedTool == tool_name) {
      cornerstoneTools.setToolPassive(tool_name, { mouseButtonMask: 1 })
      setSelectedTool("")
    } else {
      if (tool_name === "Probe") {
        addProbeTool();
      } else if (tool_name === "EllipticalRoi") {
        setAnnotationEditorVisible(false);
        addElipticalTool();
      }
      setSelectedTool(tool_name)
      cornerstoneTools.setToolActive(tool_name, { mouseButtonMask: 1 })
    }
  }


  return (
    <div>
      <div style={{ float: "left", width: "70%" }}>
        <h2>Cornerstone</h2>
        <div style={{ position: "relative" }}>
          <div
            className="viewportElement my-3"
            ref={viewPortRef}
          >


          </div>
          {annotationEditorVisible ?
            <div className="form-input" style={{ top: `${viewPostion.y}px`, left: `${viewPostion.x}px` }}>
              <div className="form-input_close" onClick={() => setAnnotationEditorVisible(false)}>&times;</div>
              <div className="annotation-editor">
                <div className="annotation-editor_row annotation-editor-header">
                  <span className="annotation-editor_col">Point</span>
                  <span className="annotation-editor_col">Calibration</span>
                </div>
                <div className="annotation-editor_row">
                  <span className="annotation-editor_col">
                    <select id="points-selection" name="points" onChange={(e) => onChangeAnnotionLabel(e)}>
                      <option value=""></option>
                      <option value="Point 1">reference_line_1_P1</option>
                      <option value="Point 2">reference_line_1_P2</option>
                      <option value="Point 10">calibration_P2</option>
                    </select>
                  </span>
                  <span className="annotation-editor_col">
                    <select id="calibration-selection" name="calibration" onChange={(e) => onChangeAnnotionLabel(e)}>
                      <option value=""></option>
                      <option value="1-2">1-2</option>
                      <option value="2-3">2-3</option>
                    </select>
                  </span>
                </div>
              </div></div>
            : null}</div>
        <button onClick={() => selectDeselect("Probe")} style={{ backgroundColor: selectedTool === "Probe" ? "#09F" : "#000", color: "#FFF", outline: "none", border: "none", padding: "8px 12px", margin: "10px 20px", borderRadius: "2px" }}>Probe</button>
        <button onClick={() => selectDeselect("EllipticalRoi")} style={{ backgroundColor: selectedTool === "EllipticalRoi" ? "#09F" : "#000", color: "#FFF", outline: "none", border: "none", padding: "8px 12px", margin: "10px 20px", borderRadius: "2px" }}>Cicle</button>
      </div>



    </div>
  );
}

export default App;
