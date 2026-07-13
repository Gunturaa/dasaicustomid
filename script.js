// --- Tab Switching Logic ---
function switchTab(tabId) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if(btn.dataset.target === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update active pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
        if(pane.id === tabId) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    // If switching to 3d-model, resize event might be needed to fix canvas size if it was hidden
    if(tabId === '3d-model') {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }
}

// --- Three.js 3D Viewer Setup ---
function init3DViewer() {
    const container = document.getElementById('3d-canvas');
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 600;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 50, 100);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f3ff, 0.8);
    dirLight1.position.set(50, 50, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-50, -50, -50);
    scene.add(dirLight2);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(100, 20, 0x00f3ff, 0x222222);
    gridHelper.position.y = -20;
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Material for STL
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x111111, 
        specular: 0x00f3ff, 
        shininess: 100,
        flatShading: true
    });

    // Make variables globally accessible for loadSTL
    window.stlScene = scene;
    window.stlMaterial = material;
    window.currentMesh = null;

    // Load default
    window.loadSTL('dasai.stl');

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle Window Resize
    window.addEventListener('resize', onWindowResize, false);
    function onWindowResize() {
        if (!container || container.clientWidth === 0) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init3DViewer);

window.loadSTL = function(filename) {
    if (!window.stlScene) return;

    // Remove existing mesh if present
    if (window.currentMesh) {
        window.stlScene.remove(window.currentMesh);
        // Clean up memory
        if (window.currentMesh.geometry) window.currentMesh.geometry.dispose();
        window.currentMesh = null;
    }
    
    const loader = new THREE.STLLoader();
    loader.load(
        'assets/' + filename,
        function (geometry) {
            geometry.center();
            geometry.computeVertexNormals();
            const mesh = new THREE.Mesh(geometry, window.stlMaterial);
            mesh.scale.set(0.5, 0.5, 0.5); 
            
            const wireframe = new THREE.WireframeGeometry(geometry);
            const line = new THREE.LineSegments(wireframe);
            line.material.depthTest = false;
            line.material.opacity = 0.1;
            line.material.transparent = true;
            line.material.color.setHex(0x00f3ff);
            mesh.add(line);

            window.stlScene.add(mesh);
            window.currentMesh = mesh;
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded (' + filename + ')');
        },
        function (error) {
            console.warn("STL not found: " + filename + ", showing placeholder.");
            const boxGeo = new THREE.BoxGeometry(30, 30, 30);
            const mesh = new THREE.Mesh(boxGeo, window.stlMaterial);
            
            const wireGeo = new THREE.WireframeGeometry(boxGeo);
            const line = new THREE.LineSegments(wireGeo);
            line.material.color.setHex(0x00f3ff);
            mesh.add(line);
            
            window.stlScene.add(mesh);
            window.currentMesh = mesh;
        }
    );
};
