class Vertex {
    constructor(x, y, color) {
        this.position = { x, y };  // Position in 2D space
        this.color = color;         // Color as a vec4 (RGBA)
    }

    getPosition() {
        return [this.position.x, this.position.y];
    }

    getColor() {
        return this.color;
    }

    setColor(color) {
        this.color = color;
    }

    setPosition(x, y) {
        this.position = { x, y };
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("glCanvas");
    if (!canvas) {
        console.log("Canvas not found, cannot render content.");
        return;
    }

    const gl = canvas.getContext("webgl2"); // Ensure you're using WebGL2 for index buffers
    if (!gl) {
        alert("WebGL not supported!");
        return;
    }

    async function loadShaderSource(url) {
        const response = await fetch(url);
        return await response.text();
    }

    async function initializeShaders() {
        const vertexShaderSource = await loadShaderSource("vertexShader.glsl");
        const fragmentShaderSource = await loadShaderSource("fragmentShader.glsl");

        if (!vertexShaderSource || !fragmentShaderSource) {
            console.error("Error loading shader sources.");
            return;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        setUpAttributesAndBuffers(program);

        draw();
    }

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function setUpAttributesAndBuffers(program) {
        const positionAttribLocation = gl.getAttribLocation(program, "a_position");
        const colorAttribLocation = gl.getAttribLocation(program, "a_color");

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), GL_STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttribLocation);
        gl.vertexAttribPointer(colorAttribLocation, 4, gl.FLOAT, false, 0, 0);
    }

    function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0); // Use drawElements
    }

    // Initialize everything
    initializeShaders();

    var n = 50; // Number of bars
    const minHeight = -0.9; // Minimum height of bars
    const maxHeight = 0.9; // Maximum height of bars
    var speed = document.getElementById("speedControl").value; // Animation speed
    let bars = [];
    let currentBar = -1;

    // Generate bars
    for (let i = 0; i < n; i++) {
        let normalizedHeight = i / (n - 1);
        let color = [0.3, 0.3, 0.3, 1.0]; // gray
        bars.push({
            height: minHeight + normalizedHeight * (maxHeight - minHeight),
            color: color
        });
    }

    // Shuffle bars using Fisher-Yates shuffle
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    shuffle(bars);

    function getBarVertices() {
        let vertices = [];
        let colors = [];
        const barWidth = 2 / n - (maxHeight / n); // Bar width with spacing
        const indices = [];

        bars.forEach((bar, i) => {
            let x = (i / n) * 2 - 0.99; // Normalize x position (-0.99 to 0.99)
            let height = bar.height;

            // Rectangle vertices (two triangles)
            vertices.push(
                x, -1,               // Bottom left
                x + barWidth, -1,    // Bottom right
                x, height,           // Top left

                x, height,           // Top left
                x + barWidth, -1,    // Bottom right
                x + barWidth, height // Top right
            );

            colors.push(...Array(6).fill(bar.color).flat());

            // Define indices for two triangles per bar
            const baseIndex = i * 4;
            indices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex + 2, baseIndex + 1, baseIndex + 3);
        });

        return { vertices: new Float32Array(vertices), colors: new Float32Array(colors), indices: new Uint16Array(indices) };
    }

    function drawBars() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const { vertices, colors, indices } = getBarVertices();

        // Bind position buffer
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.GL_STATIC_DRAW);
        const positionAttribLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

        // Bind color buffer
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, GL_STATIC_DRAW);
        const colorAttribLocation = gl.getAttribLocation(program, "a_color");
        gl.enableVertexAttribArray(colorAttribLocation);
        gl.vertexAttribPointer(colorAttribLocation, 4, gl.FLOAT, false, 0, 0);

        // Create and bind the index buffer
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW());

        // Draw the bars using the index buffer
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    drawBars();

    // Bubble Sort Animation
    window.bubbleSort = async function bubbleSort() {
        console.log("Bubble Sort started");
        let swapped;
        do {
            swapped = false;
            for (let i = 0; i < bars.length - 1; i++) {
                if (bars[i].height > bars[i + 1].height) {
                    [bars[i], bars[i + 1]] = [bars[i + 1], bars[i]];
                    swapped = true;
                    drawBars();
                    await new Promise(resolve => setTimeout(resolve, speed)); // Animation delay
                }
            }
        } while (swapped);
        console.log("Bubble Sort completed");
    };

    // controls
    var speedControl = document.getElementById("speedControl");
    if (speedControl) {
        speedControl.addEventListener("input", (event) => {
            speed = 2000 - event.target.value; // Inverse relationship (higher value = faster)
        });
    } else {
        console.log("Speed control not found.");
    }

    var shuffleButton = document.getElementById("shuffleButton");
    if (shuffleButton) {
        shuffleButton.addEventListener("click", () => {
            shuffle(bars);
            drawBars();
        });
    } else {
        console.log("Shuffle button not found.");
    };

    document.getElementById("setBarCountButton").addEventListener("click", () => {
        const newCount = parseInt(document.getElementById("barCountInput").value);
        if (newCount >= 10 && newCount <= 2000) {
            n = newCount;
            bars = [];
            for (let i = 0; i < n; i++) {
                let normalizedHeight = i / (n - 1);
                bars.push({ height: -1.0 + normalizedHeight * (0.9 - (-1.0)), color: [0.3, 0.3, 0.3, 1.0] });
            }
            shuffle(bars);
            drawBars();
        }
    });

});
