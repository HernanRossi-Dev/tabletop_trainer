// src/components/BattlePlanner.tsx
import { createSignal, createEffect, onMount, For, batch, createMemo } from 'solid-js';
import styles from './BattlePlanner.module.css'; // Make sure this CSS module file exists and is correctly styled

// --- Interfaces and Constants ---

// Default size (will be updated by selection)
const INITIAL_MAP_SIZE_INDEX = 1; // Start with Strike Force (index 1: 44x60)

// Predefined common sizes (Ensure these are accurate for current 40k)
const MAP_SIZES = [
    { label: "Combat Patrol / Incursion (44\" x 30\")", width: 44, height: 30 },
    { label: "Strike Force (44\" x 60\")", width: 44, height: 60 },
    { label: "Onslaught (44\" x 90\")", width: 44, height: 90 },
    // Add other official sizes if needed
];

const OBJECTIVE_DIAMETER_INCHES = 3;

// Define Zone widths based on the 44" standard for calculation reference
// Even if the board width changes, these relative proportions define the zones
const ZONE_EDGE_WIDTH_RATIO = 10 / 44; // Both attacker and defender zones
const ZONE_MIDDLE_WIDTH_RATIO = 1 - 2 * ZONE_EDGE_WIDTH_RATIO; // Middle zone fills the rest

// Colors
const ATTACKER_ZONE_COLOR = 'rgba(192, 57, 43, 0.7)'; // Darker Red
const DEFENDER_ZONE_COLOR = 'rgba(39, 174, 96, 0.7)';   // Darker Green
const MIDDLE_ZONE_COLOR = 'rgba(236, 240, 241, 0.8)'; // Light Grey
const OBJECTIVE_ZONE_COLOR = 'rgba(241, 196, 15, 0.4)'; // Yellowish / Gold
const OBJECTIVE_ICON_COLOR = 'rgba(44, 62, 80, 0.9)'; // Dark Blue/Black for icon visibility
const RULER_LINE_COLOR = 'rgba(44, 62, 80, 0.9)';     // Dark color for ruler lines
const RULER_TEXT_COLOR = 'rgba(0, 0, 0, 1)';          // Black for ruler text
const GRID_COLOR = 'rgba(189, 195, 199, 0.5)';        // Lighter grey for middle grid


// --- Interfaces ---
interface MapItem {
    id: number | string; // Unique ID for reactivity stability
    x: number; // Position in INCHES from top-left center
    y: number; // Position in INCHES from top-left center
    type: 'objective' | 'terrain';
}

interface Objective extends MapItem {
    type: 'objective';
    fixedId?: number; // Add fixedId for ruler lookup and initial positioning
}

interface TerrainPiece extends MapItem {
    type: 'terrain';
    terrainType: keyof typeof terrainTypes; // Reference to the definition key
}

// Terrain Definitions (width, height in inches)
const terrainTypes = {
    'ruin_large': { width: 12, height: 6, label: 'Large Ruin (12x6)' },
    'ruin_medium': { width: 6, height: 4, label: 'Medium Ruin (6x4)' },
    'crate_small': { width: 4, height: 2, label: 'Crates (4x2)' },
    'forest_medium': { width: 6, height: 6, label: 'Forest (6x6)' }
};
type TerrainTypeKey = keyof typeof terrainTypes;

// ID Generators
let nextTerrainId = Date.now(); // Simple unique ID generator for terrain

// --- Component ---
function BattlePlanner() {
    // --- Refs ---
    let canvasRef: HTMLCanvasElement | undefined;
    let ctx: CanvasRenderingContext2D | null = null;

    // --- Signals ---
    // Initialize dimensions based on the starting map size index
    const [boardWidthInches, setBoardWidthInches] = createSignal(MAP_SIZES[INITIAL_MAP_SIZE_INDEX].width);
    const [boardHeightInches, setBoardHeightInches] = createSignal(MAP_SIZES[INITIAL_MAP_SIZE_INDEX].height);
    const [objectives, setObjectives] = createSignal<Objective[]>([]);
    const [terrainPieces, setTerrainPieces] = createSignal<TerrainPiece[]>([]);
    const [selectedTerrainType, setSelectedTerrainType] = createSignal<TerrainTypeKey | null>(null);
    const [draggedItem, setDraggedItem] = createSignal<Objective | TerrainPiece | null>(null);
    const [isDragging, setIsDragging] = createSignal(false);
    const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });

    // --- Reactive Scale Calculation ---
    const scale = createMemo(() => {
        if (!canvasRef) return 10; // Default before mount
        const canvasWidth = canvasRef.width;
        const canvasHeight = canvasRef.height;
        const currentBoardWidth = boardWidthInches();
        const currentBoardHeight = boardHeightInches();
        // Prevent division by zero
        if (currentBoardWidth <= 0 || currentBoardHeight <= 0) return 10;
        const scaleX = canvasWidth / currentBoardWidth;
        const scaleY = canvasHeight / currentBoardHeight;
        // Use the smaller scale to fit everything
        return Math.min(scaleX, scaleY);
    });

    // --- Derived Pixel Values ---
    const objectiveRadiusPx = createMemo(() => (OBJECTIVE_DIAMETER_INCHES / 2) * scale());
    const objectiveIconRadiusPx = createMemo(() => 0.5 * scale()); // Smaller icon radius

    // --- Initialization & Effects ---
    onMount(() => {
        if (!canvasRef) {
            console.error("Canvas reference is not available on mount.");
            return;
        }
        const context = canvasRef.getContext('2d');
        if (!context) {
            console.error("Failed to get 2D context from canvas.");
            return;
        }
        ctx = context; // Assign to outer scope variable
        resetObjectives(); // Place objectives relative to initial size
        // Initial draw is triggered by the effect below
    });

    // Effect to redraw canvas whenever relevant state changes
    createEffect(() => {
        // Depend on signals that affect visuals
        const currentObjectives = objectives();
        const currentTerrain = terrainPieces();
        const currentScale = scale();
        const currentWidth = boardWidthInches();
        const currentHeight = boardHeightInches();

        // Ensure context is available before drawing
        if (ctx && canvasRef) {
             redrawCanvas(ctx, canvasRef, currentObjectives, currentTerrain, currentWidth, currentHeight, currentScale);
        }
    });

    // --- Drawing Functions ---
    const redrawCanvas = (
        context: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        currentObjectives: Objective[],
        currentTerrain: TerrainPiece[],
        currentBoardWidth: number,
        currentBoardHeight: number,
        currentScale: number
    ) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        // Draw background zones FIRST
        drawBackgroundZones(context, canvas, currentBoardWidth, currentBoardHeight, currentScale);
        // Draw other elements on top
        drawTerrain(context, currentTerrain, currentScale);
        drawObjectives(context, currentObjectives, currentScale);
        // Draw rulers LAST
        drawRulerLines(context, currentObjectives, currentBoardWidth, currentScale);
    };

    const drawBackgroundZones = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, boardW: number, boardH: number, sc: number) => {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calculate zone widths in pixels based on current board width and ratios
        const zoneEdgePx = boardW * ZONE_EDGE_WIDTH_RATIO * sc;
        const zoneMiddlePx = boardW * ZONE_MIDDLE_WIDTH_RATIO * sc;

        // Attacker Zone (Red)
        context.fillStyle = ATTACKER_ZONE_COLOR;
        context.fillRect(0, 0, zoneEdgePx, canvasHeight);

        // Middle Zone (Light Grey + Grid)
        context.fillStyle = MIDDLE_ZONE_COLOR;
        context.fillRect(zoneEdgePx, 0, zoneMiddlePx, canvasHeight);

        // Draw fine grid inside middle zone
        context.strokeStyle = GRID_COLOR;
        context.lineWidth = 0.5; // Make grid lines thin
        const gridStep = 1 * sc; // Grid every inch

        // Vertical grid lines in middle zone
        for (let x = zoneEdgePx + gridStep; x < zoneEdgePx + zoneMiddlePx; x += gridStep) {
             // Ensure lines don't draw outside the middle zone due to floating point precision
            if (x > zoneEdgePx && x < zoneEdgePx + zoneMiddlePx) {
                context.beginPath();
                context.moveTo(x, 0);
                context.lineTo(x, canvasHeight);
                context.stroke();
            }
        }
        // Horizontal grid lines in middle zone
        for (let y = gridStep; y < canvasHeight; y += gridStep) {
            context.beginPath();
            context.moveTo(zoneEdgePx, y); // Start at left edge of middle zone
            context.lineTo(zoneEdgePx + zoneMiddlePx, y); // End at right edge
            context.stroke();
        }

        // Defender Zone (Green)
        context.fillStyle = DEFENDER_ZONE_COLOR;
        context.fillRect(zoneEdgePx + zoneMiddlePx, 0, zoneEdgePx, canvasHeight); // Fill remaining width
         // TODO: Add shield icon later (requires image loading/drawing)
    };


    const drawObjectives = (context: CanvasRenderingContext2D, currentObjectives: Objective[], sc: number) => {
        const objRadiusPx = objectiveRadiusPx(); // Use memoized value
        const iconRadiusPx = objectiveIconRadiusPx(); // Use memoized value

        currentObjectives.forEach(obj => {
            const pixelX = obj.x * sc;
            const pixelY = obj.y * sc;

            // Draw 3" control zone circle
            context.fillStyle = OBJECTIVE_ZONE_COLOR;
            context.beginPath();
            context.arc(pixelX, pixelY, objRadiusPx, 0, Math.PI * 2);
            context.fill();

            // Draw objective marker icon (simple circle for now)
            // TODO: Replace with skull icon later if desired (load image, drawImage)
            context.fillStyle = OBJECTIVE_ICON_COLOR;
            context.beginPath();
            context.arc(pixelX, pixelY, iconRadiusPx, 0, Math.PI * 2);
            context.fill();

            // // Optionally draw fixed ID inside marker (can be cluttered)
            // if (obj.fixedId) {
            //     context.fillStyle = 'white';
            //     context.font = `${iconRadiusPx * 1.2}px sans-serif`;
            //     context.textAlign = 'center';
            //     context.textBaseline = 'middle';
            //     context.fillText(String(obj.fixedId), pixelX, pixelY);
            // }
        });
    };

    const drawTerrain = (context: CanvasRenderingContext2D, currentTerrain: TerrainPiece[], sc: number) => {
        currentTerrain.forEach(piece => {
            const def = terrainTypes[piece.terrainType];
            if (!def) return; // Skip if type definition is missing

            const pixelX = piece.x * sc;
            const pixelY = piece.y * sc;
            const pixelW = def.width * sc;
            const pixelH = def.height * sc;

            context.fillStyle = TERRAIN_COLOR;
            context.strokeStyle = TERRAIN_BORDER_COLOR;
            context.lineWidth = 2;

            // Draw terrain centered on its x, y
            context.fillRect(pixelX - pixelW / 2, pixelY - pixelH / 2, pixelW, pixelH);
            context.strokeRect(pixelX - pixelW / 2, pixelY - pixelH / 2, pixelW, pixelH);

            // Draw Label inside terrain piece
            context.fillStyle = 'white';
            context.font = 'bold 14px sans-serif'; // Make label bold
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            // Extract label part before parenthesis if needed for brevity
            const labelText = def.label.split(' (')[0];
            context.fillText(labelText, pixelX, pixelY);
        });
    };

    const drawRulerLines = (context: CanvasRenderingContext2D, currentObjectives: Objective[], boardW: number, sc: number) => {
        // Helper to find objective by its fixed ID
        const findObj = (fixedId: number): Objective | undefined => currentObjectives.find(o => o.fixedId === fixedId);

        const centerObj = findObj(1); // Center
        const leftObj = findObj(2);   // Left of Center
        const rightObj = findObj(3);  // Right of Center
        const topObj = findObj(4);    // Top of Center
        const bottomObj = findObj(5); // Bottom of Center

        // Ensure all objectives needed for rulers are found before drawing
        if (!centerObj || !leftObj || !rightObj || !topObj || !bottomObj) {
            // console.warn("Not all fixed objectives found for drawing rulers.");
            return; // Exit if any objective is missing
        }

        // Convert objective positions (inches) to pixel coordinates
        const cPx = { x: centerObj.x * sc, y: centerObj.y * sc };
        const lPx = { x: leftObj.x * sc, y: leftObj.y * sc };
        const rPx = { x: rightObj.x * sc, y: rightObj.y * sc };
        const tPx = { x: topObj.x * sc, y: topObj.y * sc };
        const bPx = { x: bottomObj.x * sc, y: bottomObj.y * sc };

        // Calculate pixel coordinates for the vertical edges of the deployment/middle zones
        const dzEdgeLeftPx = boardW * ZONE_EDGE_WIDTH_RATIO * sc;       // X-coord of red zone right edge
        const dzEdgeRightPx = boardW * (ZONE_EDGE_WIDTH_RATIO + ZONE_MIDDLE_WIDTH_RATIO) * sc; // X-coord of green zone left edge

        // Styling for rulers
        context.strokeStyle = RULER_LINE_COLOR;
        context.fillStyle = RULER_TEXT_COLOR;
        context.lineWidth = 1.5;
        context.font = 'bold 14px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        const arrowSize = 6;     // Size of the arrowhead
        const textOffset = 18;   // Vertical offset for text from its measurement line
        const lineOffsetH = 8;   // Horizontal offset for vertical measurement lines from centerline
        const lineOffsetV = 8;   // Vertical offset for horizontal measurement lines from centerline


        // --- Draw Dotted Centerlines ---
        context.save(); // Save current drawing state (like line style)
        context.setLineDash([4, 4]); // Set line style to dotted
        context.lineWidth = 1;       // Use a thinner line for dotted centerlines
        context.strokeStyle = RULER_LINE_COLOR; // Or a slightly lighter color

        // Horizontal centerline (extend slightly past edge objectives)
        context.beginPath();
        context.moveTo(lPx.x - 10 * sc, lPx.y); // Extend left
        context.lineTo(rPx.x + 10 * sc, rPx.y); // Extend right
        context.stroke();

        // Vertical centerline (extend slightly past edge objectives)
        context.beginPath();
        context.moveTo(tPx.x, tPx.y - 10 * sc); // Extend up
        context.lineTo(bPx.x, bPx.y + 10 * sc); // Extend down
        context.stroke();

        context.restore(); // Restore previous drawing state (solid line, etc.)


        // --- Draw Measurement Lines & Text ---
        context.lineWidth = 1.5; // Reset line width if changed by dotted lines

        // Helper function to draw an arrow line segment
        const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            // Draw line segment
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
            // Draw arrowhead at the end (x2, y2)
            context.save();
            context.translate(x2, y2); // Move origin to arrowhead point
            context.rotate(angle);     // Rotate context to draw arrow correctly
            context.beginPath();
            context.moveTo(0, 0); // Tip of the arrow
            context.lineTo(-arrowSize, -arrowSize / 2); // Back left point
            context.lineTo(-arrowSize, arrowSize / 2);  // Back right point
            context.closePath();    // Close the arrowhead shape
            context.fillStyle = RULER_LINE_COLOR; // Fill arrowhead with line color
            context.fill();
            context.restore(); // Restore context transformation
        };

        // Vertical Measurements (16") - Offset horizontally from centerline
        drawArrow(tPx.x - lineOffsetH, tPx.y, tPx.x - lineOffsetH, cPx.y); // Top to Center
        drawArrow(bPx.x - lineOffsetH, bPx.y, bPx.x - lineOffsetH, cPx.y); // Bottom to Center
        context.fillText('16"', tPx.x - lineOffsetH - textOffset, (tPx.y + cPx.y) / 2); // Place text left of line
        context.fillText('16"', bPx.x - lineOffsetH - textOffset, (bPx.y + cPx.y) / 2); // Place text left of line

        // Horizontal Measurements (12") - Offset vertically from centerline
        drawArrow(lPx.x, lPx.y + lineOffsetV, cPx.x, cPx.y + lineOffsetV); // Left to Center
        drawArrow(rPx.x, rPx.y + lineOffsetV, cPx.x, cPx.y + lineOffsetV); // Right to Center
        context.fillText('12"', (lPx.x + cPx.x) / 2, lPx.y + lineOffsetV + textOffset); // Place text below line
        context.fillText('12"', (rPx.x + cPx.x) / 2, rPx.y + lineOffsetV + textOffset); // Place text below line

        // Horizontal Measurements (8") - Offset vertically from centerline
        // Use the same vertical offset as the 12" lines for consistency
        drawArrow(lPx.x, lPx.y + lineOffsetV, dzEdgeLeftPx, lPx.y + lineOffsetV); // From Left Obj to Red Zone Edge
        drawArrow(rPx.x, rPx.y + lineOffsetV, dzEdgeRightPx, rPx.y + lineOffsetV); // From Right Obj to Green Zone Edge
        context.fillText('8"', (lPx.x + dzEdgeLeftPx) / 2, lPx.y + lineOffsetV + textOffset); // Place text below line
        context.fillText('8"', (rPx.x + dzEdgeRightPx) / 2, rPx.y + lineOffsetV + textOffset); // Place text below line
    };


    // --- Event Handlers ---

    // Modified resetObjectives to match the image layout and assign fixed IDs
    const resetObjectives = () => {
        const currentWidth = boardWidthInches();
        const currentHeight = boardHeightInches();
        const centerX = currentWidth / 2;
        const centerY = currentHeight / 2;

        const defaultObjectives: Objective[] = [
            // Assign fixedId for easy lookup when drawing rulers
            // IDs are strings to avoid conflict with terrain Date.now() IDs if needed
            { id: 'fixed_1', fixedId: 1, type: 'objective', x: centerX, y: centerY },          // Center
            { id: 'fixed_2', fixedId: 2, type: 'objective', x: centerX - 12, y: centerY },      // Left
            { id: 'fixed_3', fixedId: 3, type: 'objective', x: centerX + 12, y: centerY },      // Right
            { id: 'fixed_4', fixedId: 4, type: 'objective', x: centerX, y: centerY - 16 },      // Top
            { id: 'fixed_5', fixedId: 5, type: 'objective', x: centerX, y: centerY + 16 },      // Bottom
        ];

        // Basic validation: ensure objectives are within bounds (important if board size changes drastically)
        // Allows objectives near edge on smaller boards if calculation puts them there
        const validObjectives = defaultObjectives.filter(obj =>
            obj.x >= 0 && obj.x <= currentWidth && obj.y >= 0 && obj.y <= currentHeight
        );

        setObjectives(validObjectives);
        // Redraw is handled by the effect
    };

    const handleMapSizeChange = (event: Event) => {
        const selectedIndex = parseInt((event.target as HTMLSelectElement).value, 10);
        if (selectedIndex >= 0 && selectedIndex < MAP_SIZES.length) {
            const newSize = MAP_SIZES[selectedIndex];
            batch(() => {
                setBoardWidthInches(newSize.width);
                setBoardHeightInches(newSize.height);
                resetObjectives(); // Reposition objectives for new size
            });
        }
    };

    const handleSaveAsPng = () => {
        if (!canvasRef) {
            console.error("Cannot save PNG: Canvas reference is not available.");
            alert("Error: Cannot save image, canvas not ready.");
            return;
        }
        try {
            const dataUrl = canvasRef.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            // Include current dimensions in the filename
            link.download = `battle-plan-${boardWidthInches()}x${boardHeightInches()}.png`;
            document.body.appendChild(link); // Required for Firefox trigger
            link.click();
            document.body.removeChild(link); // Clean up the temporary link
        } catch (error) {
            console.error("Failed to save canvas as PNG:", error);
            alert("Error: Could not save image. Browser might not support this feature or the canvas may be 'tainted' (e.g., due to cross-origin images if added later).");
        }
    };

    const clearTerrain = () => {
        batch(() => { // Group signal updates
            setTerrainPieces([]);
            setSelectedTerrainType(null); // Also deselect any selected terrain type
        });
    };

    const handleTerrainButtonClick = (type: TerrainTypeKey) => {
        setSelectedTerrainType(type); // Set the selected type for placement
    };

    const handleCanvasClick = (event: MouseEvent) => {
        const typeToPlace = selectedTerrainType();
        // Only place if a type is selected AND we didn't just finish dragging
        if (typeToPlace && !isDragging() && !draggedItem()) {
            const currentScale = scale();
            if (!canvasRef) return; // Guard clause if canvas isn't ready
            const pos = getMousePos(canvasRef, event); // Get click position in canvas pixels
            const terrainDef = terrainTypes[typeToPlace];

            if (terrainDef) {
                 const newPiece: TerrainPiece = {
                    id: `T${nextTerrainId++}`, // Generate unique terrain ID
                    type: 'terrain',
                    terrainType: typeToPlace,
                    x: pos.x / currentScale, // Convert click position back to INCHES for storage
                    y: pos.y / currentScale
                };
                // Add the new piece to the terrain array using functional update
                setTerrainPieces(prev => [...prev, newPiece]);
                // Optional: Deselect terrain type after placing it
                // setSelectedTerrainType(null);
            }
        }
        // Reset drag state after a click action finishes, just in case mouseup didn't fire
        setIsDragging(false);
        setDraggedItem(null);
    };

    const handleMouseDown = (event: MouseEvent) => {
        const currentScale = scale();
        if (!canvasRef) return; // Guard clause
        const pos = getMousePos(canvasRef, event); // Get click position in canvas pixels
        let itemToDrag: Objective | TerrainPiece | null = null;
        let isDraggingItem = false;

        // Check terrain first (iterate in reverse to check topmost items first)
        for (let i = terrainPieces().length - 1; i >= 0; i--) {
            const piece = terrainPieces()[i];
            const def = terrainTypes[piece.terrainType];
            if (isPointInTerrain(pos.x, pos.y, piece, def, currentScale)) {
                itemToDrag = piece;
                isDraggingItem = true;
                break; // Found draggable terrain
            }
        }

        // If not dragging terrain, check objectives
        if (!isDraggingItem) {
            for (let i = objectives().length - 1; i >= 0; i--) {
                 const obj = objectives()[i];
                 // Use helper function for hit detection on objectives
                 if (isPointInObjective(pos.x, pos.y, obj, currentScale)) {
                    itemToDrag = obj;
                    isDraggingItem = true;
                    break; // Found draggable objective
                 }
            }
        }

        // If an item was found to drag...
        if (isDraggingItem && itemToDrag) {
             batch(() => { // Group state updates
                setIsDragging(true); // Set dragging flag
                setDraggedItem(itemToDrag); // Store reference to the item being dragged
                setSelectedTerrainType(null); // Deselect any selected terrain type

                // Calculate the offset between the mouse click and the item's center (in pixels)
                const itemCenterX = itemToDrag.x * currentScale;
                const itemCenterY = itemToDrag.y * currentScale;
                setDragOffset({ x: pos.x - itemCenterX, y: pos.y - itemCenterY });

                // Add global listeners to the document for smooth dragging outside the canvas
                document.addEventListener('mousemove', handleDocumentMouseMove);
                // Use { once: true } for mouseup to automatically remove listener after firing once
                document.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
             });
            canvasRef.style.cursor = 'grabbing'; // Change cursor to indicate dragging
        } else {
            // If click didn't hit anything draggable, ensure drag state is reset
            setIsDragging(false);
            setDraggedItem(null);
        }
    };

    const handleDocumentMouseMove = (event: MouseEvent) => {
        // Use guard clause pattern for better readability
        if (!isDragging() || !draggedItem() || !canvasRef) return;

        const currentScale = scale(); // Get current scale
        const item = draggedItem()!; // Assert non-null as we checked isDragging
        const offset = dragOffset(); // Get the initial drag offset
        const pos = getMousePos(canvasRef, event); // Get current mouse position relative to canvas

        // Calculate new INCH position based on mouse movement and initial offset
        const newXinch = (pos.x - offset.x) / currentScale;
        const newYinch = (pos.y - offset.y) / currentScale;

        // Update the correct state array (objectives or terrain) based on item type
        // Use functional updates for signals holding arrays
        if (item.type === 'objective') {
            setObjectives(objs => objs.map(obj =>
                obj.id === item.id ? { ...obj, x: newXinch, y: newYinch } : obj
            ));
        } else if (item.type === 'terrain') {
             setTerrainPieces(pieces => pieces.map(piece =>
                piece.id === item.id ? { ...piece, x: newXinch, y: newYinch } : piece
            ));
        }
        // No need to explicitly call redrawCanvas here, the createEffect hook handles it
    };

    const handleDocumentMouseUp = (event: MouseEvent) => {
        // This function now primarily resets state and removes the mousemove listener
        // The mouseup listener is already set to { once: true }
        if(isDragging()) { // Check if dragging was actually active
            batch(() => {
                setIsDragging(false); // Reset dragging flag
                setDraggedItem(null); // Clear the reference to the dragged item
                if (canvasRef) canvasRef.style.cursor = 'default'; // Reset cursor style

                // Remove the persistent mousemove listener
                document.removeEventListener('mousemove', handleDocumentMouseMove);
            });
        }
    };

    // --- Helper Functions ---
    // Calculates mouse position relative to the canvas element
    const getMousePos = (canvasEl: HTMLCanvasElement, event: MouseEvent): { x: number; y: number } => {
        const rect = canvasEl.getBoundingClientRect(); // Get canvas position and size on screen
        // Calculate scaling factor if CSS size differs from canvas resolution
        const scaleXCanvas = canvasEl.width / rect.width;
        const scaleYCanvas = canvasEl.height / rect.height;
        // Return coordinates adjusted for canvas position and scaling
        return {
            x: (event.clientX - rect.left) * scaleXCanvas,
            y: (event.clientY - rect.top) * scaleYCanvas
        };
    };

    // Checks if a pixel coordinate (px, py) is within an objective's grab radius
    const isPointInObjective = (px: number, py: number, objective: Objective, sc: number): boolean => {
        const objRadiusPx = objectiveRadiusPx(); // Use reactive radius memo
        const objPixelX = objective.x * sc; // Objective center X in pixels
        const objPixelY = objective.y * sc; // Objective center Y in pixels
        const dx = px - objPixelX; // Difference in X
        const dy = py - objPixelY; // Difference in Y
        // Use distance squared formula for efficiency (avoids sqrt)
        // Check against the larger control zone radius for easier grabbing
        return dx * dx + dy * dy <= objRadiusPx * objRadiusPx;
    };

    // Checks if a pixel coordinate (px, py) is within a terrain piece's rectangle
    const isPointInTerrain = (px: number, py: number, terrain: TerrainPiece, definition: typeof terrainTypes[TerrainTypeKey], sc: number): boolean => {
        if (!definition) return false; // Guard against invalid terrain type
        const piecePixelX = terrain.x * sc; // Terrain center X in pixels
        const piecePixelY = terrain.y * sc; // Terrain center Y in pixels
        const piecePixelW = definition.width * sc; // Terrain width in pixels
        const piecePixelH = definition.height * sc; // Terrain height in pixels

        // Calculate boundaries based on center position and dimensions
        const left = piecePixelX - piecePixelW / 2;
        const right = piecePixelX + piecePixelW / 2;
        const top = piecePixelY - piecePixelH / 2;
        const bottom = piecePixelY + piecePixelH / 2;

        // Check if the point is within the rectangle
        return px >= left && px <= right && py >= top && py <= bottom;
    };


    // --- Render JSX ---
    return (
        <div class={styles.appContainer}>
            {/* --- Controls Column --- */}
            <div class={styles.controls}>
                <h2>Controls</h2>

        
                {/* Terrain Section */}
                <div class={styles.controlSection}>
                    <h3>Terrain</h3>
                    <p>Click to select, then click on map to place.</p>
                    <For each={Object.entries(terrainTypes)}>
                        {([typeKey, typeDef]) => (
                            <button
                                class={styles.terrainButton}
                                // Use classList for dynamic styling based on selection state
                                classList={{ [styles.selected]: selectedTerrainType() === typeKey }}
                                onClick={() => handleTerrainButtonClick(typeKey as TerrainTypeKey)}
                            >
                                {typeDef.label}
                            </button>
                        )}
                    </For>
                     <button onClick={clearTerrain} class={styles.actionButton}>Clear All Terrain</button>
                    {/* Display currently selected terrain type */}
                    <div class={styles.selectedTerrainInfo}>
                        Selected: {selectedTerrainType() ? terrainTypes[selectedTerrainType()!].label : 'None'}
                    </div>
                </div>

                {/* Objectives Section */}
                <div class={styles.controlSection}>
                    <h3>Objectives</h3>
                    <p>Drag to move.</p>
                    {/* Reset objectives to their fixed layout */}
                    <button onClick={resetObjectives} class={styles.actionButton}>Reset Objectives</button>
                </div>

                 {/* Save Section */}
                 <div class={styles.controlSection}>
                    <h3>Export</h3>
                    {/* Button to trigger PNG download */}
                    <button onClick={handleSaveAsPng} class={`${styles.actionButton} ${styles.saveButton}`}>
                        Save as PNG
                    </button>
                </div>

                 {/* Instructions Section */}
                 <div class={styles.controlSection}>
                    <h3>Instructions</h3>
                    <ul>
                        <li>Select map size from dropdown.</li>
                        <li>Click terrain buttons to select type.</li>
                        <li>Click on map to place selected terrain.</li>
                        <li>Click and drag objectives or terrain to move.</li>
                        {/* Removed mention of Red/Blue zones as they are part of background */}
                    </ul>
                 </div>
            </div>

            {/* --- Map Column --- */}
            <div class={styles.mapContainer}>
                <canvas
                    ref={canvasRef} // Assign the ref to access the canvas element
                    id="battleMap" // ID can be useful for external CSS or specific targeting
                    width="880" // Set a fixed, higher resolution canvas width
                    height="600" // Set a fixed, higher resolution canvas height
                                 // CSS will control the display size
                    // Attach mouse down/click handlers directly to the canvas element
                    onMouseDown={handleMouseDown}
                    onClick={handleCanvasClick}
                    // Mouse move/up listeners are added to document dynamically during drag
                />
                <p class={styles.mapSizeLabel}>
                    Map Size: {boardWidthInches()}" x {boardHeightInches()}"
                </p>
            </div>
        </div>
    );
}

export default BattlePlanner;